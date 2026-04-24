---
title: GPU Support
description: How Thinkube manages NVIDIA GPUs across heterogeneous nodes with host-managed drivers and time-slicing
sidebar_position: 4
---

Thinkube uses the [NVIDIA GPU Operator](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/index.html) to expose GPUs to Kubernetes workloads. Drivers are installed and managed on the host — the operator handles only the container runtime, device plugin, and monitoring components.

## Architecture

```d2
Host: {
  Driver: "NVIDIA Driver (host-managed)"
  Marker: "/run/nvidia/validations/host-driver-ready"
  Containerd: "k8s-snap containerd"
}

GPU Operator: {
  NFD: Node Feature Discovery
  Validator: Operator Validator
  Toolkit: nvidia-container-toolkit
  Plugin: nvidia-device-plugin
  DCGM: DCGM Exporter
}

Pod: {
  App: "User Workload"
  Runtime: "runtimeClassName: nvidia"
}

Host.Driver -> Host.Marker: systemd creates on boot
Host.Marker -> GPU Operator.Validator: checks marker
GPU Operator.NFD -> GPU Operator.Validator: gpu.present=true
GPU Operator.Validator -> GPU Operator.Toolkit: unblocks
GPU Operator.Toolkit -> Host.Containerd: 99-nvidia.toml drop-in
GPU Operator.Plugin -> Pod.App: nvidia.com/gpu resources
Pod.Runtime -> Host.Containerd: nvidia runtime
```

## Host-Managed Drivers

The GPU Operator is deployed with `driver.enabled=false`. Thinkube installs NVIDIA drivers directly on each GPU node because:

1. **DGX Spark ships with a pre-installed driver** tied to its firmware — the operator's containerized driver would conflict
2. **Host drivers persist across pod restarts** — no re-download on node reboot
3. **Full control over driver version** — `ubuntu-drivers` selects the recommended package for each GPU

### Driver Installation Flow

On non-DGX nodes, the GPU operator playbook:

1. Blacklists the `nouveau` driver and updates initramfs
2. Detects the recommended NVIDIA driver via `ubuntu-drivers devices`
3. Installs the driver package (e.g., `nvidia-driver-580`)
4. Unloads any stale kernel modules (`nvidia_uvm`, `nvidia_drm`, `nvidia_modeset`, `nvidia`) and loads the new ones
5. Verifies with `nvidia-smi`

DGX Spark nodes skip driver installation — the driver is part of the system image.

### Host Driver Validation

Since the operator doesn't manage the driver, it needs a signal that the driver is ready. A systemd service (`nvidia-host-driver-validation`) creates the marker file `/run/nvidia/validations/host-driver-ready` on every boot. The operator's validator DaemonSet checks for this marker before allowing other components (toolkit, device plugin) to deploy.

```
/run is tmpfs → marker disappears on reboot
systemd service recreates it before kubelet starts
→ operator validator finds it → unblocks DaemonSets
```

## GPU Compatibility

Thinkube requires **Volta or newer** GPUs (compute capability 7.0+). Older architectures are detected during node scanning and excluded from GPU workloads.

| Architecture | Examples | Supported |
|-------------|----------|-----------|
| Volta (V) | V100, Titan V | Yes |
| Turing (TU) | RTX 2080, T4 | Yes |
| Ampere (GA) | A100, RTX 3090 | Yes |
| Ada Lovelace (AD) | RTX 4090, L40 | Yes |
| Hopper (GH) | H100 | Yes |
| Blackwell (GB) | DGX Spark (GB10) | Yes |
| Pascal (GP) | GTX 1080 Ti, P100 | No |
| Maxwell (GM) | GTX 980, M40 | No |
| Kepler (GK) | GTX 780, K80 | No |

When a node with an incompatible GPU joins the cluster, Thinkube:

1. Sets `gpu_detected=false` during hardware validation (the GPU exists but is not usable)
2. Excludes the node from the `baremetal_gpus` inventory group
3. Sets `nvidia.com/gpu.deploy.*=false` labels to prevent the GPU operator from scheduling DaemonSets on that node

This is necessary because Node Feature Discovery (NFD) detects the physical GPU regardless of compatibility and sets `nvidia.com/gpu.present=true`. Without the override labels, the operator would attempt to deploy components that would fail on pre-Volta hardware.

## Containerd Integration

The `nvidia-container-toolkit` DaemonSet configures containerd to use the NVIDIA runtime. On Canonical k8s (k8s-snap), containerd lives at a non-standard path:

| Component | Path |
|-----------|------|
| Config | `/var/lib/k8s-containerd/k8s-containerd/etc/containerd/config.toml` |
| Socket | `/var/lib/k8s-containerd/k8s-containerd/run/containerd/containerd.sock` |
| Drop-in config | `/etc/containerd/conf.d/99-nvidia.toml` |

The toolkit writes the NVIDIA runtime drop-in to `/etc/containerd/conf.d/99-nvidia.toml`. The k8s-snap containerd config imports from both its own `conf.d` directory and `/etc/containerd/conf.d/`:

```toml
imports = [
  "/var/lib/k8s-containerd/.../conf.d/*.toml",
  "/etc/containerd/conf.d/*.toml"
]
```

After the toolkit creates the drop-in, the playbook restarts containerd to load the NVIDIA runtime. Pods can then request GPU access using `runtimeClassName: nvidia`.

## Time-Slicing (DGX Spark)

The DGX Spark has a single GPU (NVIDIA GB10) that is shared across workloads via [GPU time-slicing](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/gpu-sharing.html). Time-slicing allows multiple pods to use the same physical GPU by rapidly context-switching between them — similar to CPU time-sharing.

### How It Works

```d2
Physical GPU: {
  GB10: "1x NVIDIA GB10"
}

Kubernetes: {
  vGPU0: "nvidia.com/gpu (pod 1)"
  vGPU1: "nvidia.com/gpu (pod 2)"
  vGPU2: "nvidia.com/gpu (pod 3)"
  vGPU3: "nvidia.com/gpu (pod 4)"
}

Physical GPU.GB10 -> Kubernetes.vGPU0: time-sliced
Physical GPU.GB10 -> Kubernetes.vGPU1: time-sliced
Physical GPU.GB10 -> Kubernetes.vGPU2: time-sliced
Physical GPU.GB10 -> Kubernetes.vGPU3: time-sliced
```

Time-slicing is configured by:

1. Creating a `ConfigMap` in the `gpu-operator` namespace with the sharing policy
2. Patching the GPU Operator's `ClusterPolicy` to reference the config
3. The device plugin restarts and advertises 4 virtual GPUs instead of 1

### Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| Replicas | 4 (default) | Virtual GPUs per physical GPU |
| MIG strategy | None | GB10 does not support Multi-Instance GPU |
| Rename by default | false | Resources remain `nvidia.com/gpu` |
| Fail requests > 1 | false | A single pod can request multiple virtual GPUs |

The replica count is configurable via the `gpu_time_slicing_replicas` inventory variable.

### Important Considerations

- **Memory is shared, not partitioned**: All virtual GPUs share the full GPU memory. If total usage exceeds physical memory, workloads will OOM.
- **No performance isolation**: A compute-heavy pod affects all others sharing the GPU. Time-slicing is best for inference and light training, not sustained full-GPU workloads.
- **Only enabled on DGX Spark**: Nodes with discrete GPUs (RTX 3090, A100, etc.) do not use time-slicing — each physical GPU is allocated exclusively to one pod.

## DGX Spark Specifics

The DGX Spark (NVIDIA GB10) is an ARM64 system with an integrated GPU. It receives special handling:

| Aspect | DGX Spark | Standard GPU Node |
|--------|-----------|-------------------|
| Architecture | ARM64 | AMD64 (typically) |
| Driver install | Skipped (pre-installed) | `ubuntu-drivers` recommended package |
| Docker runtime | Configured (`/etc/docker/daemon.json`) | Not configured |
| Time-slicing | Enabled (4 virtual GPUs) | Disabled (exclusive GPU per pod) |
| GPU operator driver | `driver.enabled=false` | `driver.enabled=false` |

The Docker daemon configuration is specific to DGX Spark because it runs Docker alongside containerd for system-level GPU workloads (NVIDIA's management stack).

## Requesting GPUs in Pods

To use a GPU in your workload, set `runtimeClassName` and request GPU resources:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-workload
spec:
  runtimeClassName: nvidia
  containers:
  - name: cuda-app
    image: your-cuda-image:latest
    resources:
      limits:
        nvidia.com/gpu: 1
```

The `nvidia` RuntimeClass is created automatically by the GPU Operator Helm chart. The device plugin handles GPU allocation — Kubernetes schedules the pod on a node with available GPU capacity.

## Multi-Node GPU Scheduling

In a multi-node cluster with heterogeneous GPUs, Kubernetes schedules GPU workloads based on availability. NFD labels each GPU node with its GPU product name (`nvidia.com/gpu.product`), which can be used for node affinity if a workload requires a specific GPU model:

```yaml
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
      - matchExpressions:
        - key: nvidia.com/gpu.product
          operator: In
          values:
          - NVIDIA-GeForce-RTX-3090
```

## Next Steps

- [Multi-Architecture Support](/architecture/multi-architecture/) — How ARM64 and AMD64 nodes coexist
- [Networking](/architecture/networking/) — Overlay network and gateway configuration
- [Components](/components/) — Available platform services
