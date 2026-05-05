---
title: Resource Management
description: How Thinkube prevents OOM crashes with kubelet protection, priority-based eviction, namespace budgets, and dynamic pod resizing
sidebar_position: 5
---

Thinkube implements a 5-layer memory protection system to prevent kernel OOM crashes on nodes where many services share physical RAM. This is especially critical on unified memory systems (like DGX Spark) where CPU and GPU share the same memory pool.

## The Problem

Without resource management, a Kubernetes cluster can overcommit memory — pods collectively request more RAM than the node has. When the kernel runs out of memory, the OOM killer fires indiscriminately and may crash critical infrastructure (database, gateway) instead of a batch job.

## Layer 1: Kubelet Protection

The kubelet is configured at bootstrap to reserve memory for the OS and Kubernetes system processes, and to start evicting pods well before the kernel OOM killer fires.

| Setting | Value | Purpose |
|---------|-------|---------|
| `system-reserved` | memory=4Gi, cpu=500m | Reserved for OS processes and GPU driver |
| `kube-reserved` | memory=2Gi, cpu=500m | Reserved for kubelet and containerd |
| `eviction-hard` | memory.available<2Gi | Hard eviction — pods killed immediately |
| `eviction-soft` | memory.available<4Gi | Soft eviction — 30s grace period before kill |
| `enforce-node-allocatable` | pods | Hard cgroup limit on pod memory only |

On a 128 GB node, this makes ~122 GB allocatable for pods. The scheduler will refuse to place pods beyond this limit, preventing overcommit.

### Why only pods are cgroup-enforced

`enforce-node-allocatable` is set to `pods` only. k8s-snap runs all Kubernetes system daemons (kubelet, containerd, API server, etcd) under `system.slice` alongside OS services — there is no separate cgroup for kube-reserved components. Setting hard cgroup limits on those shared slices causes the node to report memory pressure immediately, even with hundreds of gigabytes free, because the cgroup accounting sees the kubelet and API server as "over budget."

The `system-reserved` and `kube-reserved` values still subtract 6 Gi from the advertised allocatable, so the scheduler never overcommits. The eviction thresholds fire before the kernel OOM killer. Pod-level cgroup enforcement (`kubepods.slice`) is what keeps pods within their allocated budget.

### UMA vs Discrete GPU

These values work for both architectures:
- **Discrete GPU**: GPU has its own VRAM; system-reserved covers OS only
- **UMA (DGX Spark)**: CPU and GPU share memory, but the NVIDIA driver allocates via `/dev/nvidia*` mmap which doesn't count against kubelet's cgroup accounting — the eviction thresholds provide the actual protection

## Layer 2: Priority-Based Eviction

Four PriorityClasses ensure that when memory pressure hits, the right pods get evicted first:

| PriorityClass | Value | Assigned To |
|---------------|-------|-------------|
| `thinkube-critical` | 1,000,000 | Gateway, DNS, CoreDNS |
| `thinkube-platform` | 100,000 | Keycloak, PostgreSQL, Harbor, Gitea, ArgoCD, thinkube-control |
| `thinkube-workload` | 10,000 | User apps, optional components (default) |
| `thinkube-batch` | 1,000 | Argo workflow tasks, image builds |

Under memory pressure, batch jobs are evicted first, then user workloads, then platform services — critical infrastructure survives.

`thinkube-workload` is the `globalDefault`, so any pod that doesn't specify a priority class automatically gets this tier. Template-deployed applications inherit this default.

## Layer 3: Namespace Resource Budgets

Every namespace has a **LimitRange** (default resources for pods that don't declare any) and a **ResourceQuota** (total memory budget for the namespace).

### LimitRange Defaults

| Tier | Default Limit | Default Request |
|------|---------------|-----------------|
| Critical / Platform | 512Mi / 500m | 128Mi / 50m |
| Workload / Optional / Batch | 256Mi / 250m | 64Mi / 25m |

These prevent pods without explicit resource declarations from running unbounded.

### ResourceQuota Budgets

| Tier | Memory Requests | Memory Limits |
|------|-----------------|---------------|
| Critical / Platform | 16Gi | 32Gi |
| Workload / Optional / Batch | 8Gi | 16Gi |

Template-deployed app namespaces also get these policies automatically at deployment time.

## Layer 4: Template Size Presets

User applications deployed via `thinkube.yaml` specify a `size` per container:

```yaml
containers:
  - name: backend
    size: medium
```

Each size maps to fixed resource requests and limits:

| Size | CPU Request | CPU Limit | Memory Request | Memory Limit |
|------|-------------|-----------|----------------|--------------|
| `small` | 100m | 500m | 128Mi | 256Mi |
| `medium` | 250m | 1000m | 256Mi | 512Mi |
| `large` | 500m | 2000m | 512Mi | 1Gi |
| `xlarge` | 1000m | 4000m | 4Gi | 16Gi |

For workloads that need more than `xlarge`, use the dynamic resize API after deployment.

## Layer 5: Dynamic In-Place Resize

Kubernetes 1.35 introduced **InPlacePodVerticalScaling** as GA. Thinkube exposes this through the control plane:

### How It Works

Pods are deployed with a `resizePolicy` that tells Kubernetes how to handle resource changes:

```yaml
resizePolicy:
  - resourceName: cpu
    restartPolicy: NotRequired      # CPU: resized in-place, no restart
  - resourceName: memory
    restartPolicy: RestartContainer  # Memory: container restarted to apply
```

### API Endpoints

```
GET  /api/v1/services/{id}/pods/{pod}/resources
PATCH /api/v1/services/{id}/pods/{pod}/containers/{container}/resources
```

Both endpoints are also available as MCP tools (`get_pod_resources`, `resize_pod_resources`) for AI agent integration.

### UI

The Service Details page shows a **Resize** button on each container card. Clicking it opens an inline editor for CPU and memory requests/limits.

### Resize Status

After a resize, Kubernetes reports status via pod conditions:
- **PodResizePending** (Deferred) — node temporarily lacks capacity, will retry
- **PodResizePending** (Infeasible) — requested resources exceed node capacity
- **PodResizeInProgress** — kubelet is applying the change
- No conditions — resize completed successfully

### Owner Patching

When a pod is resized, the parent Deployment or StatefulSet is also patched to match. Without this, the controller would revert the pod resources on next reconciliation.

## Deployment Order

These layers are deployed in dependency order during installation:

1. **Kubelet args** — applied at k8s-snap bootstrap (before any pods run)
2. **PriorityClasses + Quotas + LimitRanges** — deployed after cluster is up, before components
3. **Component resources + resizePolicy** — each component's deploy playbook
4. **Dynamic resize API** — available once thinkube-control is running

## Verification

```bash
# Layer 1: Check node allocatable
kubectl describe node | grep -A5 "Allocatable"

# Layer 2: Check PriorityClasses
kubectl get priorityclasses | grep thinkube

# Layer 3: Check namespace policies
kubectl get limitrange,resourcequota -A

# Layer 5: Check resize status
kubectl get pod <pod> -o jsonpath='{.status.conditions[?(@.type=="PodResizePending")]}'
```
