---
title: Introduction
description: What is Thinkube and why does it exist
---

# Your own AI cloud

Thinkube is a self-hosted platform that turns a single GPU machine into a complete AI development environment. Local LLMs, vector databases, experiment tracking, CI/CD, monitoring — all pre-configured and integrated. Install it, and start building.

## The real cost of "just set it up yourself"

You buy a GPU machine. You want to run LLMs on it. Simple, right?

First you need Kubernetes — because you'll want to run more than one thing. That means `kubeadm` or `k3s`, CNI plugins, storage drivers, GPU operators. Then you need a container registry, because you're building custom images. And a Git server for your code. And CI/CD to build and deploy automatically. And an ingress controller for HTTPS. And certificates. And DNS. And authentication — you don't want your services open to the internet.

You haven't written a line of application code yet.

Now add the AI stack. Ollama for quick inference. vLLM for production serving. A vector database for RAG. MLflow for experiment tracking. Langfuse for LLM observability. JupyterHub for notebooks. Each one needs configuration, storage, networking, and integration with everything else.

**This takes weeks. Thinkube takes hours.**

## What you get

After installation, you have a fully working platform at `*.yourdomain.com`:

- **`jupyter.yourdomain.com`** — JupyterHub with Thinky, your Claude-powered AI assistant that can read, write, and execute notebook cells autonomously
- **`code.yourdomain.com`** — VS Code in the browser with Claude Code CLI pre-installed
- **`control.yourdomain.com`** — Dashboard to monitor services, deploy apps, manage models, and configure your platform
- **`ollama.yourdomain.com`** — LLM inference API, ready to load models
- **`mlflow.yourdomain.com`** — Experiment tracking and model registry
- **`gitea.yourdomain.com`** — Your own Git server with CI/CD webhooks
- **`registry.yourdomain.com`** — Private container registry (Harbor)

Plus PostgreSQL, Valkey (Redis), ClickHouse, Qdrant, and more — all accessible from your code with connection strings injected automatically.

Everything is behind SSO (Keycloak). One login, all services.

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

That's it. Thinkube handles:
- Building container images (Kaniko)
- Pushing to your private registry (Harbor)
- Deploying via GitOps (ArgoCD)
- TLS certificates for `myapp.yourdomain.com`
- Database provisioning and connection strings
- Health checks and monitoring
- Automatic redeployment on git push

The equivalent Kubernetes setup would be 200+ lines of YAML across Deployments, Services, Ingress, PVCs, Secrets, ConfigMaps, and a database operator. You don't need to know any of that.

## Run your own LLMs

Deploy models on your GPUs with no API costs:

| Engine | Best for | How |
|--------|----------|-----|
| **Ollama** | Quick experiments, chat | One-click deploy from dashboard |
| **vLLM** | Production inference, OpenAI-compatible API | Template deployment |
| **TensorRT-LLM** | Maximum throughput on NVIDIA GPUs | Template deployment |
| **LiteLLM** | Unified API gateway across all engines | Pre-installed |

Load a model, and every service on the platform can use it — your notebooks, your agents, your applications. LiteLLM provides a single OpenAI-compatible endpoint that routes to whichever engine is serving which model.

## Access from anywhere

Thinkube uses ZeroTier to create a secure overlay network. Your laptop — at home, at work, at a coffee shop — connects directly to your server. No port forwarding, no VPN configuration, no exposing services to the public internet.

Open your browser, go to `jupyter.yourdomain.com`, and you're in your notebook environment with full GPU access. It feels like the machine is sitting under your desk, no matter where you are.

## Who builds with Thinkube

**AI engineers** who want to run experiments on their own GPUs without cloud costs. Fine-tune models, build RAG pipelines, deploy agents — with full control over the stack.

**Developers** who want Claude-assisted development in a complete environment. Push code, it deploys. Ask Thinky, it writes and runs. No setup, no maintenance.

**Researchers** who need reproducible ML environments with experiment tracking, model registries, and GPU-accelerated notebooks — without depending on institutional IT.

## What's included

| Category | Components |
|----------|------------|
| **Development** | JupyterHub + Thinky, Code Server + Claude Code, Thinkube Control |
| **LLM Inference** | Ollama, vLLM, TensorRT-LLM, LiteLLM |
| **Vector Databases** | Qdrant, Weaviate, Chroma |
| **ML Platform** | MLflow, Langfuse |
| **Databases** | PostgreSQL, Valkey (Redis), ClickHouse |
| **CI/CD** | Gitea, Argo Workflows, ArgoCD, Harbor |
| **Monitoring** | Prometheus, Perses |
| **Storage** | JuiceFS (shared filesystem), SeaweedFS (object storage) |
| **Security** | Keycloak SSO, Envoy Gateway, ZeroTier |

## Next steps

1. **[Install Thinkube](/installation/overview/)** — Get it running on your machine
2. **[Learning Paths](/learn/overview/)** — Tutorials for AI, web apps, and DevOps
3. **[Explore Components](/components/)** — Deep dive into every service
