---
title: Multi-Architecture Support
description: How Thinkube runs on both ARM64 and AMD64 nodes without emulation
sidebar_position: 2
---

Thinkube supports mixed-architecture clusters with ARM64 and AMD64 nodes. Every container image is built natively on hardware of the target architecture — no QEMU emulation, no slow cross-compilation.

## Core Principle

**Images are only built for architectures that have physical nodes in the cluster.** A single-node ARM64 installation builds ARM64 images only. When an AMD64 worker joins, Thinkube automatically rebuilds all images as multi-arch manifest lists, with each architecture built on its native hardware.

```d2
ARM64 Node.Build arm64 image -> Manifest List
AMD64 Node.Build amd64 image -> Manifest List
Manifest List -> Harbor Registry
```

## How It Works

### Single Architecture

When the cluster has only one architecture (the common case for initial setup):

- `container_build_platforms` is set to the control plane's architecture (e.g., `linux/arm64`)
- All images are built locally with `podman build`
- No manifest lists needed — images are pushed directly to Harbor

### Adding a Second Architecture

When a worker node of a different architecture joins, image builds happen in two phases:

1. **Node joins the cluster** via the Thinkube Control UI
2. **New node is cordoned** to prevent scheduling broken pods
3. **Build platforms are updated** in the Ansible inventory
4. **User runs `tk_images rebuild`** from a code-server terminal to mirror and build images
5. **Base images are rebuilt** natively on both architectures using `delegate_to`
6. **Public images are re-mirrored** with per-platform filtering
7. **Node is uncordoned** after successful builds

Image builds run in the terminal rather than the UI because they can take a long time and benefit from direct retry. See [Adding Nodes](/installation/adding-nodes/) for the full procedure.

## Native Per-Node Builds

Thinkube uses Ansible's `delegate_to` to run builds on the architecture-matching node:

| Step | What happens | Where it runs |
|------|-------------|---------------|
| Parse platforms | Read `container_build_platforms` from inventory | Control plane |
| Map to nodes | Find a node per architecture from inventory groups | Control plane |
| Sync context | Push Containerfiles and build context via rsync | Control plane → remote |
| Build image | `podman build --platform linux/<arch>` | Each architecture's node |
| Push per-arch | `podman push <image>:<tag>-<arch>` | Each architecture's node |
| Create manifest | `podman manifest create` combining per-arch tags | Control plane |
| Push manifest | `podman manifest push` the multi-arch manifest list | Control plane |

For single-architecture clusters, this simplifies to a local build and push — no delegation overhead.

## Application Builds (Argo Workflows)

Template applications are built in-cluster using Kaniko. For multi-arch clusters:

- **Per-arch DAG steps** run on nodes with matching `kubernetes.io/arch` labels and `thinkube.io/build-node=true`
- **Git-clone init containers** provide build context on worker nodes (they don't have hostPath access to the control plane)
- **crane** creates manifest lists from per-arch images — lightweight and runs without a container runtime
- **Kaniko** is pinned to a specific version from the Harbor mirror for reproducible builds

```d2
Tests -> Build arm64
Tests -> Build amd64
Build arm64 -> Create Manifest
Build amd64 -> Create Manifest
Create Manifest -> Push to Harbor
```

## Architecture-Specific Images

Some images have different base images per architecture:

| Image | ARM64 Base | AMD64 Base |
|-------|-----------|-----------|
| TensorRT-LLM | `tensorrt-llm-spark` (DGX Spark SDK) | `tensorrt-llm` (standard release) |

The build playbook uses per-arch base image mapping with `--build-arg BASE_IMAGE=...` to select the right base for each architecture.

## Jupyter Venvs

Jupyter virtual environments contain native compiled binaries (PyTorch, CUDA extensions) that are architecture-specific. Thinkube handles this by:

- Building each venv on a GPU node of the target architecture
- Writing an `.arch` marker file inside the venv
- Only syncing venvs to nodes of the **same** architecture (never cross-arch)
- Optionally building on all architectures with `build_for_all_architectures=true`

## Image Mirroring

Public images mirrored to Harbor are filtered by the configured build platforms:

- **Single-arch**: Standard pull-tag-push (fast, no manifest overhead)
- **Multi-arch**: Per-platform `podman manifest add --os linux --arch <arch>` — only the architectures you need, not the full upstream manifest

The image list is maintained in [thinkube-metadata](https://github.com/thinkube/thinkube-metadata) and fetched at runtime.

## Cache Warming

A daily CronWorkflow warms the Kaniko cache on each architecture's build node:

- Runs at 2 AM UTC
- Warms base images (Python, Node.js, Nginx) that Kaniko builds use as `FROM` layers
- Cache is stored on a **persistent hostPath volume** so warmed layers survive pod restarts
- Multi-arch clusters warm cache on each architecture's node independently

## Inventory Configuration

The architecture setup is controlled by a single inventory variable:

```yaml
# Ansible inventory (all/vars)
container_build_platforms: "linux/arm64"           # single-arch
container_build_platforms: "linux/amd64,linux/arm64"  # multi-arch
```

Nodes are organized into architecture groups that map to build delegation:

```yaml
arch:
  children:
    arm64:
      hosts:
        spark-node: {}
    x86_64:
      hosts:
        amd64-worker: {}
```

When a node joins via the UI, `container_build_platforms` is updated automatically.

## Supported Architectures

| Architecture | k8s Label | Inventory Group | Typical Hardware |
|-------------|-----------|----------------|-----------------|
| ARM64 | `arm64` | `arm64` | DGX Spark, Jetson, Graviton |
| AMD64 | `amd64` | `x86_64` | Standard x86 servers, workstations |

## Next Steps

- [Installation Guide](/installation/overview/) — Deploy Thinkube on your hardware
- [Container Registry](/thinkube-control/registry/) — Manage images in Harbor
- [Components](/components/) — Available platform services
