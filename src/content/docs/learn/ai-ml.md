---
title: Run AI on Your Hardware
description: Local LLMs, GPU-accelerated notebooks, experiment tracking — no API costs, no data leaving your network.
---

You have a GPU. You want to run models on it, train new ones, track experiments, and build applications — without paying per token and without sending your data to someone else's servers. Here's how.

## The workflow

From model to running inference in four steps:

**1. Mirror a model.** Open Thinkube Control, go to AI Model Library, pick a model from the catalog (Llama, Mistral, Qwen, or any Hugging Face model). One click to mirror it to your local storage.

**2. Load it onto your GPU.** Deploy an inference backend — Ollama for quick experiments, vLLM for production throughput, TensorRT-LLM for maximum speed. Load the model through the dashboard.

**3. Call it from your notebook.** Open JupyterHub at `jupyter.yourdomain.com`. The LLM Gateway gives you an OpenAI-compatible API at `llm.yourdomain.com` — use the same SDK you already know:

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://llm.yourdomain.com/v1",
    api_key="your-gateway-token"
)

response = client.chat.completions.create(
    model="llama-3.1-8b",
    messages=[{"role": "user", "content": "Explain attention mechanisms"}]
)
```

**4. Track your experiments.** Log parameters, metrics, and artifacts to MLflow at `mlflow.yourdomain.com`:

```python
import mlflow

with mlflow.start_run():
    mlflow.log_param("model", "llama-3.1-8b")
    mlflow.log_param("temperature", 0.7)
    mlflow.log_metric("accuracy", 0.92)
```

See the **[LLM Gateway playbook](/learn/llm-gateway/)** for the full step-by-step walkthrough with screenshots.

## Three engines, one API

All three inference engines are accessible through the LLM Gateway at `llm.yourdomain.com`. Your code uses the same OpenAI SDK regardless of which engine serves the model.

| Engine | Best for | Deploy as |
|--------|----------|-----------|
| **Ollama** | Quick experiments. Pull a model, start chatting. | Add-On (one click) |
| **vLLM** | Production throughput. OpenAI-compatible API, continuous batching. | Template |
| **TensorRT-LLM** | Maximum speed. Pre-optimized NVIDIA models, lowest latency. | Template |

The gateway also supports Anthropic-compatible endpoints (`POST /v1/messages`) and separates reasoning tokens for thinking models.

## JupyterHub + Thinky

Open `jupyter.yourdomain.com`. You get a full JupyterLab environment with GPU access, pre-installed ML libraries, and Thinky in your sidebar.

Tell Thinky to load data, write a training loop, plot results — it executes cells autonomously and iterates on errors. It reads your notebook, writes code, runs it, reads the output, fixes mistakes, and runs again. You watch and steer.

Your notebooks are stored on persistent shared storage. Your GPU is available for training and inference. MLflow integration logs your experiments automatically.

## MLflow: track everything, reproduce anything

Open `mlflow.yourdomain.com`. Every experiment, every parameter, every metric — versioned and searchable.

- **Experiment tracking** — log parameters, metrics, and artifacts from any notebook or script
- **Model registry** — version models, stage them from development to production
- **Artifact storage** — models stored on shared JuiceFS/SeaweedFS, mountable by inference services

## Three vector databases for RAG

Install any combination through the Add-Ons page in Thinkube Control:

| Database | Best for |
|----------|----------|
| **Qdrant** | High-performance vector similarity search with filtering and payload storage |
| **Weaviate** | Hybrid search combining vector and keyword queries |
| **Chroma** | Lightweight embedding database, great for prototyping RAG pipelines |

All three are accessible from your notebooks and applications with connection strings pre-configured.

## GPU in your templates

Templates request GPU resources in `thinkube.yaml`:

```yaml
spec:
  containers:
    - name: inference
      gpu:
        count: 1
        memory: "20Gi"
```

The platform handles GPU scheduling and resource allocation. Deploy the Stable Diffusion template (`tkt-stable-diffusion`, ~20GB GPU) or the text embeddings template (`tkt-text-embeddings`, ~8GB GPU) the same way.

## Next steps

- **[LLM Gateway playbook](/learn/llm-gateway/)** — Full walkthrough: mirror a model, deploy a backend, call it from code
- **[Deploy a Web App](/learn/web-apps/)** — Build a frontend for your AI service
- **[How Deploys Work](/learn/devops/)** — What happens behind the scenes
- **[All components](/components/)** — Every service available on the platform
