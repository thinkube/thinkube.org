---
title: DGX Spark Support
description: How Thinkube handles NVIDIA DGX Spark — unified memory, sm_121 wheels, time-slicing, and host tuning for the GB10 platform
sidebar_position: 5
---

The NVIDIA DGX Spark (GB10) is a unique target: an ARM64 system with a single GPU, a unified 128 GB memory pool shared between CPU and GPU, and ships with NVIDIA's stack pre-installed. Thinkube treats DGX Spark as a first-class hardware target — every layer of the platform has Spark-specific paths so users get the right behavior without manual tuning.

This page documents what Thinkube does on Spark hardware, why each piece is necessary, and the host-level tuning the installer applies automatically.

## Architecture Overview

```d2
DGX Spark.GB10 GPU: "GB10 (Blackwell, sm_121)"
DGX Spark.Memory: "128 GB unified pool"
DGX Spark.OS: "Ubuntu 24.04 (ARM64)"
DGX Spark.Driver: "NVIDIA driver (system image)"
DGX Spark.Docker: "Docker (pre-installed)"

Thinkube.K8s: "Canonical k8s (containerd)"
Thinkube.Operator: "GPU Operator (driver.enabled=false)"
Thinkube.TimeSlicing: "Time-slicing: 4 vGPUs"
Thinkube.Tuning: "Host tuning (vm.swappiness, vm.dirty_bytes)"
Thinkube.Images: "Harbor: sm_121 vLLM + tensorrt-llm-spark"

DGX Spark.Driver -> Thinkube.Operator: validates host driver
DGX Spark.GB10 GPU -> Thinkube.TimeSlicing: shared by 4 pods
DGX Spark.Memory -> Thinkube.Tuning: stabilized by sysctl drop-in
DGX Spark.Docker -> Thinkube.K8s: runs alongside containerd
Thinkube.Images -> DGX Spark.GB10 GPU: native sm_121 inference
```

## Unified Memory: What's Different

On a discrete GPU (RTX 3090, A100, H100) the GPU has its own VRAM. A CUDA out-of-memory error kills the process; the host stays up. On the GB10, **CPU and GPU share the same 128 GB pool**. This has two consequences that ripple through every layer of the stack:

1. **GPU OOM can take down the entire machine.** A runaway inference workload that exhausts the unified pool can starve the kernel, kubelet, and control plane processes. For this reason, Thinkube recommends putting the Kubernetes control plane on an AMD64 node (if you have one) and reserving the DGX Spark as a dedicated AI worker. See [GPU Support — Unified Memory and OOM Behavior](/architecture/gpu/#unified-memory-and-oom-behavior).
2. **Default kernel paging is wrong for this topology.** Linux defaults assume "RAM" and "GPU memory" are separate. On Spark they're not. Aggressive swapping and large dirty-page write-back queues fight inference workloads for the same pool, producing the "memory creep" symptoms reported on the NVIDIA DGX Spark forum. Thinkube applies sysctl tuning automatically — see [Host Memory Tuning](#host-memory-tuning) below.

## What Thinkube Does on DGX Spark

| Layer | Standard GPU node | DGX Spark |
|-------|-------------------|-----------|
| Driver | `ubuntu-drivers` recommended package | Skipped (system image) |
| Docker | Not configured | Configured with NVIDIA runtime (preserves DGX system tools) |
| GPU operator driver | `driver.enabled=false` | `driver.enabled=false` |
| Time-slicing | Disabled (exclusive GPU per pod) | Enabled (4 vGPUs) |
| Inference images | Standard wheels | Pre-built `sm_121` wheels in Harbor |
| Host kernel tuning | Defaults | `vm.swappiness=1`, `vm.dirty_bytes=256 MB` |

Each of these is automatic. The installer detects DGX Spark hardware (DMI product name + `nvidia-smi` reporting GB10) and applies the Spark-specific paths without user intervention.

## Pre-Built sm_121 Inference Images

The Blackwell GB10 is compute capability 8.12 (`sm_121`). NVIDIA's container images on Docker Hub ship `sm_120` precompiled kernels by default, which forces the GB10 to JIT-compile six CUTLASS kernels at startup — each `cicc` compiler process consuming 1.5–6 GB in parallel, producing 20–30 GB transient memory spikes before inference can begin.

Thinkube avoids this entirely by building inference images for `sm_121` natively on ARM64 / DGX Spark hardware and mirroring them to your local Harbor registry:

| Image | What it provides |
|-------|------------------|
| `library/vllm-base` | vLLM pre-built for `sm_121` (uses `tk-vllm-wheels` GitHub release) |
| `library/tensorrt-llm-base` | `tensorrt-llm-spark` on ARM64 (Blackwell-optimized, NVFP4/MXFP4 support) |
| `library/tk-jupyter-base` | NVIDIA PyTorch 25.11+ with full CUDA 13 stack |
| `library/cuda` | CUDA 13.0 base, multi-arch (sm_121 + sm_86) |

The build path is: ARM64 wheels are downloaded from the `thinkube/tk-vllm-wheels` GitHub release pinned in the Containerfile, AMD64 wheels are pulled from PyPI. A multi-arch manifest list ties them together so users on either architecture pull the right image transparently.

Environment defaults baked into the vLLM base image:

```
VLLM_USE_V1=1
VLLM_USE_FLASHINFER_MXFP4_MOE=1
VLLM_TARGET_DEVICE=cuda
```

These enable the V1 engine and FlashInfer's MXFP4 MoE path, which are the recommended settings for GB10. Application-level CLI flags (`--gpu-memory-utilization`, `--max-model-len`, `--kv-cache-dtype fp8`) remain user-tunable per workload.

## GPU Time-Slicing

The DGX Spark exposes a single physical GPU, which without time-slicing means a maximum of one GPU-using pod cluster-wide. Thinkube enables time-slicing automatically when a Spark node is present, advertising **4 virtual GPUs** through the device plugin:

| Setting | Value |
|---------|-------|
| Replicas | 4 (default; configurable via `gpu_time_slicing_replicas`) |
| MIG strategy | None (GB10 does not support Multi-Instance GPU) |
| Rename by default | false |
| Fail requests > 1 | false |

Memory is shared across all virtual GPUs, not partitioned. This is deliberate — partitioning 128 GB into four 32 GB slices would prevent running large models. For the design rationale see [GPU Support — Time-Slicing](/architecture/gpu/#time-slicing-dgx-spark).

## Host Memory Tuning

The installer (and `thinkube-control`'s add-node flow) applies a sysctl drop-in at `/etc/sysctl.d/99-thinkube-dgx-spark.conf` on every detected DGX Spark node:

```ini
vm.swappiness = 1
vm.dirty_bytes = 268435456
```

**Why these values:**

- `vm.swappiness = 1` — On unified-memory hardware, the kernel's default swappiness (60) aggressively pages anonymous memory out of RAM under pressure. With CPU and GPU sharing the same pool, this causes the kernel to swap out memory that the GPU is actively using, producing severe latency spikes and memory thrashing during inference. Setting swappiness near zero tells the kernel to prefer reclaiming page cache over swapping.
- `vm.dirty_bytes = 268435456` (256 MB) — Default dirty-page thresholds on a 128 GB system can buffer multiple gigabytes before forced write-back, producing large bursty I/O that contends with GPU memory bandwidth. A 256 MB cap keeps write-back smooth and predictable.

The drop-in is idempotent and self-detecting: the playbook ends silently on non-Spark hosts (DMI product name + `nvidia-smi` GB10 check), so it's safe to leave in the default install path on mixed clusters.

To revert, run `ansible/00_initial_setup/17_rollback_dgx_spark_tuning.yaml` — it removes the drop-in and reloads sysctl to distribution defaults.

## Recommended Workload Patterns

**Topology — multi-node clusters with mixed architectures:**

| Node | Role | Why |
|------|------|-----|
| AMD64 node | Kubernetes control plane | Survives GPU OOM events; keeps the cluster operational if Spark reboots |
| DGX Spark | Dedicated AI worker | Full 128 GB unified memory available; no control plane overhead |

**Topology — single-node DGX Spark:**

This is supported but you accept the tradeoff: a runaway inference workload can take down the cluster, requiring a reboot. Thinkube's host tuning reduces the probability significantly but does not eliminate it.

**Inference framework defaults to be aware of:**

- vLLM defaults to `gpu_memory_utilization=0.9`, which on GB10 pre-allocates ~89 GB of KV cache for ~1,247 concurrent requests. For single-user inference, override to `0.2` or lower. Setting `--enforce-eager` and `--kv-cache-dtype fp8` further reduces memory footprint with minimal latency cost.
- `--max-model-len` should be sized to your actual context needs, not the model's maximum. The KV cache scales linearly with this value.

These flags are workload-specific, so Thinkube does not enforce them globally — but Thinkube Control's app templates ship sensible Spark-aware defaults where applicable.

## See Also

- [GPU Support](/architecture/gpu/) — host-managed drivers, time-slicing, and operator integration across all NVIDIA GPUs
- [Multi-Architecture Support](/architecture/multi-architecture/) — how ARM64 and AMD64 nodes coexist in a single cluster
- [Resource Management](/architecture/resource-management/) — namespace tier policies and `LimitRange` defaults
