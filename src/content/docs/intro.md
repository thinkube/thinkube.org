---
title: Why Thinkube
description: What is Thinkube and why does it exist
---

# Your personal sovereign AI cloud

Thinkube turns a GPU machine into a complete AI development environment — whether it's an NVIDIA DGX Spark, a workstation with a consumer GPU, or a rack server. ARM64 or x86, single node or multi-node. Local LLMs, vector databases, experiment tracking, CI/CD, monitoring — all pre-configured and integrated. Install it, and start building.

## The real cost of "just set it up yourself"

You buy a GPU machine. You want to run LLMs on it. Simple, right?

First you need Kubernetes — because you'll want to run more than one thing. That means `kubeadm` or `k3s`, CNI plugins, storage drivers, GPU operators. Then you need a container registry, because you're building custom images. And a Git server for your code. And CI/CD to build and deploy automatically. And an ingress controller for HTTPS. And certificates. And DNS. And authentication — you don't want your services open to the internet.

You haven't written a line of application code yet.

Now add the AI stack. Ollama for quick inference. vLLM for production serving. A vector database for RAG. MLflow for experiment tracking. Langfuse for LLM observability. JupyterHub for notebooks. Each one needs configuration, storage, networking, and integration with everything else.

**This takes weeks. Thinkube takes under 3 hours.**

## Why we built this

We kept hearing the same story: someone buys a powerful GPU, spends weeks setting up infrastructure, and never gets to the actual work. The cloud alternative costs more every month and sends your data to someone else's servers.

There should be a third option — a platform that gives you everything a cloud provider does, running on hardware you own, with data that never leaves your network. Not a collection of Docker containers you wire together. A real, integrated environment where services discover each other, authenticate through SSO, and deploy through GitOps from the moment you install it.

That's what Thinkube is. Your personal sovereign AI cloud.

## What happens after you install

Open your browser. JupyterLab with Thinky, VS Code with Claude Code, a control dashboard, your Git server, your model registry, a private container registry — all at `*.yourdomain.com`, all behind single sign-on. One login, everything works.

Databases, caches, object storage, and vector databases are pre-configured with connection strings injected into your applications automatically. You don't wire anything together. You just build.

## Thinky — your AI pair programmer

The centerpiece of the development experience. Thinky is a Claude-powered agent that lives in your JupyterLab sidebar, built with the Claude Agent SDK.

It doesn't just answer questions. It **acts**:

1. You say: "Load the sales data and find anomalies"
2. Thinky writes a cell with pandas code
3. Executes it
4. Reads the output — maybe there's an import error
5. Fixes the import, re-runs
6. Writes a second cell with visualization code
7. Executes that too
8. Explains what it found

All of this happens in your notebook, in real time. You see each cell appear, execute, and update. It's not generating code for you to copy-paste — it's working alongside you in the same notebook, with the same kernel, the same data.

You bring your own Claude Pro or Max subscription. Your API key stays on your machine. No proxy, no middleman.

## Deploy without Kubernetes expertise

You don't need to understand Kubernetes to deploy on Thinkube. You write a `thinkube.yaml`:

```yaml
spec:
  containers:
    - name: backend
      build: ./backend
      port: 8000
    - name: frontend
      build: ./frontend
      port: 80
  routes:
    - path: /api
      to: backend
    - path: /
      to: frontend
  services:
    - database
```

That's 15 lines. Thinkube handles:
- Building container images (Kaniko)
- Pushing to your private registry (Harbor)
- Deploying via GitOps (ArgoCD)
- TLS certificates for `myapp.yourdomain.com`
- Database provisioning and connection strings
- Health checks and monitoring
- Automatic redeployment on git push

The equivalent Kubernetes setup is 200+ lines of YAML across Deployments, Services, Ingress, PVCs, Secrets, ConfigMaps, and a database operator. You don't need to know any of that.

## Run your own LLMs

Deploy models on your GPUs with no API costs:

| Engine | Best for | How |
|--------|----------|-----|
| **Ollama** | Quick experiments, chat | One-click deploy from dashboard |
| **vLLM** | Production inference, OpenAI-compatible API | Template deployment |
| **TensorRT-LLM** | Maximum throughput on NVIDIA GPUs | Template deployment |

The **LLM Gateway** at `llm.yourdomain.com` orchestrates all three engines and exposes them through a single API — both OpenAI-compatible (`/v1/chat/completions`) and Anthropic-compatible (`/v1/messages`). Load a model, and every service on the platform can use it — your notebooks, your agents, your applications. The Gateway handles routing, GPU resource management, and model lifecycle.

## Access from anywhere

Thinkube uses ZeroTier to create a secure overlay network. Your laptop — at home, at work, at a coffee shop — connects directly to your server. No port forwarding, no VPN configuration, no exposing services to the public internet.

Open your browser, go to `jupyter.yourdomain.com`, and you're in your notebook environment with full GPU access. It feels like the machine is sitting under your desk, no matter where you are.

## Multi-architecture, built in

Thinkube runs natively on ARM64 and AMD64. Start with a DGX Spark (ARM64), add an x86 worker for specific workloads — every container image is built natively on each architecture. No QEMU emulation, no slow cross-compilation.

For mixed-architecture clusters, we recommend running the Kubernetes control plane on an AMD64 node and dedicating the DGX Spark entirely to AI workloads. Beyond freeing up GPU resources, there's a stability reason: on x86 systems, a GPU out-of-memory error kills the workload. On a DGX Spark's unified memory, a GPU OOM can take down the entire machine — CPU and GPU share the same memory pool. Keeping the control plane on a separate x86 node means a runaway model doesn't take your cluster with it.

## Next steps

1. **[Your First Deploy](/learn/your-first-deploy/)** — Deploy, edit, push, and see it live in 15 minutes
2. **[Install Thinkube](/installation/overview/)** — Get it running on your machine in under 3 hours
3. **[Playbooks](/learn/overview/)** — Step-by-step guides for web apps, AI, and ML
4. **[See all components](/components/)** — The full list of 30+ services included
