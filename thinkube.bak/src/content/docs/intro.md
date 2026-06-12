---
title: Why Thinkube
description: What is Thinkube and why does it exist
---

# Your personal sovereign AI cloud

Thinkube turns a GPU machine into a complete AI development environment — whether it's an NVIDIA DGX Spark, a workstation with a consumer GPU, or a rack server. ARM64 or x86, single node or multi-node. Local LLMs, vector databases, experiment tracking, CI/CD, monitoring — all pre-configured and integrated. Install it, and start building.

## The real cost of "just set it up yourself"

You buy a GPU machine. You want to run LLMs on it. Simple, right?

You set up Proxmox, create a VM, install Docker. Traefik for reverse proxy. Let's Encrypt for SSL. Each service has its own login. Ollama in one container, a vector database in another, JupyterHub in a third. Fifteen containers, fifteen config files, no CI/CD — you SSH in and `docker compose up`. It works.

Until your POC succeeds and someone asks you to deploy it for real. Now you need a container registry, a CI/CD pipeline, proper TLS, monitoring, authentication. Everything you built is a throwaway.

**Thinkube starts where you'd end up.** Container registry, CI/CD, single sign-on, TLS, monitoring — the same architecture patterns as any hyperscaler, installed on your hardware in under 3 hours. Your prototype runs on production-grade infrastructure from day one.

## Why we built this

We kept hearing the same story: someone buys a powerful GPU, spends weeks wiring together Docker containers, and ends up with a fragile stack that doesn't survive contact with production. The cloud alternative costs more every month and sends your data to someone else's servers.

There should be a third option — a platform that gives you everything a cloud provider does, running on hardware you own, with data that never leaves your network. Not a collection of containers you wire together. A real, integrated environment where services discover each other, authenticate through single sign-on, and deploy automatically from the moment you install it.

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

## Manage your platform from Claude Code

Thinkube includes an MCP server that connects Claude Code to your platform. Deploy a template, load a model onto your GPU, check service status, browse the model catalog — from your terminal, through natural language.

No dashboard clicking. No SSH. No kubectl. You describe what you want, and your AI assistant does it.

This is what developer experience looks like when AI isn't just helping you write code — it's operating the infrastructure your code runs on.

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

That's 15 lines. Commit, push, and the platform handles everything:
- Building container images
- Pushing to your private registry
- Deploying automatically
- TLS certificates for `myapp.yourdomain.com`
- Database provisioning and connection strings
- Health checks and monitoring
- Automatic redeployment on every push

The same CI/CD patterns, container workflows, and deployment models you'd use on any hyperscaler — without writing a single line of infrastructure code.

## Cloud-ready from day one

This is the fundamental difference between Thinkube and a Docker Compose stack: your prototype isn't a throwaway. Thinkube runs the same architecture patterns you'd find on AWS, GCP, or Azure — container registry, CI/CD pipelines, single sign-on, TLS, monitoring. When your POC succeeds, you're already running on production-grade infrastructure. Scale to a cloud provider, and your application is already containerized, deployed through CI/CD, and API-compatible.

## Run your own LLMs

Deploy models on your GPUs with no API costs:

| Engine | Best for | How |
|--------|----------|-----|
| **Ollama** | Quick experiments, chat | One-click deploy from dashboard |
| **vLLM** | Production inference, OpenAI-compatible API | Template deployment |
| **TensorRT-LLM** | Maximum throughput on NVIDIA GPUs | Template deployment |

The **LLM Gateway** at `llm.yourdomain.com` orchestrates all three engines and exposes them through a single API — both OpenAI-compatible (`/v1/chat/completions`) and Anthropic-compatible (`/v1/messages`). Load a model, and every service on the platform can use it — your notebooks, your agents, your applications. The Gateway handles routing, GPU resource management, and model lifecycle.

## Access from anywhere

Thinkube uses a secure overlay network to connect your devices directly to your server. Your laptop — at home, at work, at a coffee shop — reaches your platform without port forwarding, VPN configuration, or exposing services to the public internet.

Open your browser, go to `jupyter.yourdomain.com`, and you're in your notebook environment with full GPU access. It feels like the machine is sitting under your desk, no matter where you are.

## Multi-architecture, built in

Thinkube runs natively on ARM64 and AMD64. Start with a DGX Spark (ARM64), add an x86 worker for specific workloads — every container image is built natively on each architecture. No QEMU emulation, no slow cross-compilation.

For mixed-architecture clusters, we recommend running the Kubernetes control plane on an AMD64 node and dedicating the DGX Spark entirely to AI workloads. Beyond freeing up GPU resources, there's a stability reason: on x86 systems, a GPU out-of-memory error kills the workload. On a DGX Spark's unified memory, a GPU OOM can take down the entire machine — CPU and GPU share the same memory pool. Keeping the control plane on a separate x86 node means a runaway model doesn't take your cluster with it.

## Next steps

1. **[Your First Deploy](/learn/your-first-deploy/)** — Deploy, edit, push, and see it live in 15 minutes
2. **[Install Thinkube](/installation/overview/)** — Get it running on your machine in under 3 hours
3. **[Playbooks](/learn/overview/)** — Step-by-step guides for web apps, AI, and ML
4. **[See all components](/components/)** — The full list of 30+ services included
