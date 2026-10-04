---
id: architecture-overview
title: How Thinkube Works
sidebar_label: Overview
sidebar_position: 1
---

Thinkube turns a GPU machine into a complete development platform. This page explains what runs where, how your code gets from a `git push` to a live application, and the key decisions that shape the architecture.

## The big picture

```d2
direction: right

you: You {
  shape: person
}

interact: {
  label: ""
  style.stroke: "transparent"
  style.fill: "transparent"

  ui: "Thinkube Control\n(Browser)" {
    style.fill: "#e3f2fd"
  }
  mcp: "Claude Code\n(MCP)" {
    style.fill: "#e3f2fd"
  }
}

you -> interact.ui
you -> interact.mcp

pipeline: "Thinkube Control — Deployment Pipeline" {
  style.fill: "#f5f5f5"

  git: "Git Server" {
    style.fill: "#fff"
  }
  build: "Container\nBuild" {
    style.fill: "#fff"
  }
  registry: "Image\nRegistry" {
    style.fill: "#fff"
  }
  deploy: "GitOps\nDeploy" {
    style.fill: "#fff"
  }

  git -> build: webhook
  build -> registry: push
  registry -> deploy: sync
}

interact.ui -> pipeline.git
interact.mcp -> pipeline.git

services: "Platform Services" {
  style.fill: "#fce4ec"

  sso: "Single Sign-On" {style.fill: "#fff"}
  db: "PostgreSQL" {style.fill: "#fff"}
  cache: "Valkey" {style.fill: "#fff"}
  storage: "Shared Storage" {style.fill: "#fff"}
  models: "MLflow Models" {style.fill: "#fff"}
  gpu: "GPU Access" {style.fill: "#fff"}
}

app: "Your Application\nhttps://myapp.yourdomain.com" {
  style.fill: "#e8f5e9"
  style.font-size: 16
  style.bold: true
}

gateway: "Envoy Gateway\nAutomatic TLS" {
  style.fill: "#fff8e1"
}

pipeline.deploy -> app: deploy
services -> app: auto-injected
app -> gateway
you -> gateway: HTTPS {style.stroke-dash: 3}
```

Three layers make up the platform. At the bottom, **Canonical k8s-snap** provides a production-grade Kubernetes distribution that works on a single machine and scales to a multi-node cluster. On top of that, **Thinkube Control** orchestrates everything — deployments, model management, service health, the container registry, and single sign-on. At the top, **your applications** run as standard containers with automatic TLS, DNS, and monitoring.

You interact with the platform through the Thinkube Control dashboard in your browser, or through Claude Code using the built-in MCP server. Both paths lead to the same result — you never need to write Kubernetes manifests, Helm charts, or infrastructure code.

## What happens when you deploy

You describe your application in a `thinkube.yaml` file — a static descriptor that says what containers you have, what ports they listen on, and what services they need:

```yaml
spec:
  containers:
    - name: backend
      build: ./backend
      port: 8000
      health: /health
      migrations:
        tool: alembic
        auto: true
    - name: frontend
      build: ./frontend
      port: 80
      health: /health
  routes:
    - path: /api
      to: backend
    - path: /
      to: frontend
  services:
    - database
```

When you deploy this through Thinkube Control (or ask Claude Code to deploy it via MCP), a sequence of automated steps runs:

1. The template repository is cloned into your platform's Git server
2. A container build workflow builds each image natively on the target architecture and pushes it to your private registry
3. A GitOps controller picks up the new images and deploys the application to Kubernetes
4. A wildcard TLS certificate is applied, and your app is live at `https://myapp.yourdomain.com`

Database provisioning, connection strings, health checks, and redeployment on push all happen automatically. The same sequence runs whether you're deploying a simple web app or a GPU-accelerated inference server.

## Single sign-on everywhere

Keycloak provides identity for the entire platform. You log in once and have access to JupyterHub, the Git server, the container registry, the model registry, dashboards, and your own applications. Every service authenticates through OAuth2/OIDC — there are no separate passwords to manage.

When you deploy an application, it can optionally participate in the same SSO system. Thinkube Control injects the Keycloak URL and client ID as environment variables, so your app can protect its routes without configuring an auth provider from scratch.

## Networking and access

Thinkube runs on an encrypted overlay network — either ZeroTier or Tailscale, chosen during installation. This means your laptop connects directly to your server from anywhere — home, office, or a coffee shop — without port forwarding, VPN configuration, or exposing services to the public internet.

All HTTP traffic flows through an Envoy Gateway using the Kubernetes Gateway API. A single wildcard TLS certificate (`*.yourdomain.com`) covers every service and application. The gateway handles path-based and host-based routing, so multiple applications share the same IP address and domain.

For non-HTTP services (Git SSH, database connections, message queues), a separate TCP gateway exposes specific ports on the overlay network. See [Networking](/architecture/networking/) for the full details.

## Storage

Two storage systems serve different purposes. **JuiceFS** provides a POSIX-compatible distributed filesystem backed by SeaweedFS — this is where shared data lives, including MLflow model artifacts that get mounted directly into GPU containers. **SeaweedFS** also exposes an S3-compatible API for object storage, used by the model registry, experiment tracking, and container image layers.

For applications, you declare storage needs in your `thinkube.yaml` and Thinkube provisions the volumes automatically. Database services (PostgreSQL, Valkey) manage their own persistent storage.

## GPU and AI workloads

The NVIDIA GPU Operator exposes GPUs to containers. On a DGX Spark, the single GB10 GPU is shared across workloads using time-slicing — multiple containers can use the GPU concurrently, with context-switching handled by the driver.

When a container declares GPU requirements in its `thinkube.yaml`, it automatically gets access to the MLflow Model Registry through a JuiceFS mount at `/mlflow-models`. Models load from local disk, not from the cloud — you mirror them once through the model catalog, and every inference container reads from the same shared volume.

For mixed-architecture clusters, Thinkube builds every image natively on hardware matching the target architecture. No QEMU emulation. An ARM64 image builds on the ARM64 node, an AMD64 image builds on the AMD64 node, and a manifest list ties them together. See [Multi-Architecture Support](/architecture/multi-architecture/) and [GPU Support](/architecture/gpu/) for the full details.

## Monitoring

Prometheus collects metrics from every service and application. Perses provides dashboards. Logs are aggregated centrally with full-text search. Pre-built dashboards cover cluster health, GPU utilization, and application performance — you can add custom dashboards for your own services.

## Security

TLS is automatic and everywhere — the wildcard certificate covers all services with no per-application certificate management. Secrets are stored encrypted in Kubernetes and injected as environment variables at runtime, never exposed in logs or Git. The overlay network encrypts all traffic between nodes, and the cluster itself runs behind a firewall that only opens the ports Kubernetes needs.

## What Thinkube is not

Thinkube is designed for small teams and individual developers running AI workloads on their own hardware. It prioritizes developer experience and simplicity over enterprise-scale features. There is no multi-tenant isolation, no built-in disaster recovery to a second site, and no automatic failover across regions. If you need those things, you need a cloud provider — but the applications you build on Thinkube are containerized and CI/CD-deployed from day one, so moving to a cloud provider means deploying the same containers to a different cluster.
