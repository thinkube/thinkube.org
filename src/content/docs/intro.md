---
title: Introduction
description: What is Thinkube and who is it for
---

# What is Thinkube?

Thinkube is a self-hosted platform for AI development. It provides everything you need to build AI applications and agents on your own hardware - local LLMs, vector databases, development tools, and deployment pipelines - all pre-configured and working together.

## The Problem

Building AI applications requires a complex stack: LLMs for inference, vector databases for RAG, experiment tracking for ML, observability for debugging, CI/CD for deployment. Setting this up yourself means:

- **Weeks of configuration** - Kubernetes, GPU drivers, networking, storage, authentication
- **Integration headaches** - Making dozens of components work together
- **Ongoing maintenance** - Updates, security patches, troubleshooting
- **Cloud lock-in** - API costs that scale with usage, rate limits, data leaving your network

## The Solution

Thinkube provides a complete, integrated AI development environment that installs in hours, not weeks. One installer sets up everything - from Kubernetes to LLM inference to GitOps deployment - configured to work together out of the box.

## What Makes Thinkube Unique

### Claude-Powered Development Tools

Thinkube integrates Claude directly into your development environment:

- **Thinky** - An AI assistant in JupyterLab. Chat with Claude in a sidebar while working on notebooks. Thinky can read, write, and execute your notebook cells - and iterate until they work. When code fails, Thinky sees the error, fixes it, and re-runs automatically. Changes appear in your notebook in real-time.

- **Code Server with Claude Code** - VS Code in the browser with Claude Code CLI pre-installed. Full agentic coding capabilities for your projects.

- **Thinkube Control** - Central dashboard for your entire platform. Monitor all services with health checks and GPU metrics. Deploy applications from templates with one click. Manage your container registry, AI models, secrets, and optional components. Evolving into an MCP server for LLM-based platform management.

### Complete Platform, Not Just Tools

Thinkube isn't another Kubernetes distribution or ML framework. It's an opinionated, integrated platform where every component is configured to work with every other component. SSO across all services, shared storage, unified observability.

### Built for AI Agents

The platform is designed for building and running AI agents. Local LLMs via Ollama/vLLM, vector databases for memory, MCP servers for tool integration, and the infrastructure agents need to operate autonomously.

### Deploy Without Kubernetes Expertise

Thinkube replaces complex Kubernetes manifests with a simple deployment descriptor. Compare deploying a web app with database:

**thinkube.yaml** (what you write):
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

**Kubernetes + Helm** (what you'd otherwise need):
- Deployment, Service, Ingress for each container
- PersistentVolumeClaims for storage
- Secrets and ConfigMaps
- TLS certificate configuration
- Database StatefulSet or operator
- ~200+ lines of YAML across multiple files

Thinkube handles all the complexity. You describe what you want, not how to deploy it. The platform automatically:
- Builds container images with Kaniko
- Pushes to Harbor registry
- Deploys via ArgoCD GitOps
- Configures SSL certificates
- Injects database connection strings
- Sets up health checks and monitoring

### Accessible from Anywhere

ZeroTier overlay network gives you secure access to your entire platform from any location - your laptop at a coffee shop connects to your home servers as if you were on the local network.

## Who is it for?

**AI Engineers** building:
- AI agents and autonomous systems
- RAG applications with local LLMs
- Fine-tuned models for specific domains
- LLM-powered products and services

**Developers** who want:
- Local AI infrastructure without cloud costs
- Claude-assisted development in notebooks and VS Code
- GitOps deployment without Kubernetes expertise
- A complete development environment accessible anywhere

## What can you do with it?

### Develop with AI Assistance

Work in JupyterLab with Thinky - ask Claude to write code, and it writes, executes, and iterates until it works. When code fails, Thinky sees the error, fixes it, and re-runs automatically. Or use Claude Code in the browser-based VS Code for full agentic coding.

### Build AI Agents

Run Claude, local LLMs, or hybrid setups. Connect agents to tools via MCP servers. Store agent memory in vector databases. Monitor agent behavior with LLM observability.

### Run Local LLMs

Deploy Ollama, vLLM, or TensorRT-LLM. Run Llama, Mistral, Qwen, and other models on your GPUs. Use LiteLLM as a unified API gateway with cost tracking and load balancing.

### Build RAG Applications

Vector databases (Qdrant, Weaviate, Chroma) and embedding services ready to use. Connect to your local LLMs or external APIs.

### Train and Fine-tune Models

JupyterHub with GPU support, MLflow for experiment tracking, pre-built images with PyTorch and CUDA.

### Deploy Web Applications

Push code to Git, select a template, and your application deploys automatically with SSL certificates and monitoring.

## What's included?

| Category | Components |
|----------|------------|
| **Development** | JupyterHub + Thinky, Code Server + Claude Code, Thinkube Control |
| **LLM Inference** | Ollama, vLLM, TensorRT-LLM, LiteLLM |
| **Vector Databases** | Qdrant, Weaviate, Chroma |
| **ML Platform** | MLflow, Langfuse |
| **Databases** | PostgreSQL, Valkey (Redis), ClickHouse |
| **CI/CD** | Gitea, Argo Workflows, ArgoCD, Harbor |
| **Monitoring** | Prometheus, Perses |

## Next Steps

1. [Install Thinkube](/installation/overview/) - Set up your platform
2. [Learning Paths](/learn/overview/) - Tutorials for different use cases
3. [Explore Components](/components/) - See all available services
