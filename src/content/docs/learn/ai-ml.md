---
title: AI & Machine Learning
description: Run AI/ML workloads on Thinkube
---

Run LLMs, train models, and experiment with AI - all on your own hardware with no API costs.

## What Thinkube Provides

- **JupyterHub** - Multi-user notebook environment
- **MLflow** - Experiment tracking and model registry
- **GPU Support** - NVIDIA GPU Operator for GPU workloads
- **LiteLLM** - Gateway to route requests to local LLMs
- **Vector Databases** - Qdrant, Weaviate, Chroma (optional)

## Running Local LLMs

Deploy LLM inference from templates - no cloud APIs needed.

### Deploy an LLM Service

1. Open Thinkube Control
2. Deploy the `tkt-vllm-gradio` template
3. Provide app name and domain
4. Wait for deployment (models download on first run)

Access your LLM at `https://my-llm.example.com`

### Available AI Templates

| Template | Description | GPU Memory |
|----------|-------------|------------|
| `tkt-vllm-gradio` | LLM inference with Gradio UI | ~20GB |
| `tkt-stable-diffusion` | Image generation | ~20GB |
| `tkt-text-embeddings` | Text embeddings service | ~8GB |
| `tkt-tensorrt-llm-harmony` | TensorRT-LLM optimized inference | Varies |

## JupyterHub

Access notebooks at `https://jupyter.example.com` with Keycloak SSO.

### Features
- Persistent storage for notebooks
- Pre-installed ML libraries
- GPU access for training
- MLflow integration for experiment tracking

### Example Workflow

1. Open JupyterHub
2. Create a notebook
3. Train your model
4. Log experiments to MLflow
5. Register models in MLflow Model Registry

## MLflow

Track experiments and manage models at `https://mlflow.example.com`.

### Capabilities
- **Experiment Tracking** - Log parameters, metrics, artifacts
- **Model Registry** - Version and stage models
- **Model Serving** - Deploy models as endpoints

Models are stored in SeaweedFS/JuiceFS and can be mounted by inference services.

## Vector Databases (Optional)

For RAG applications and semantic search:

| Service | Use Case |
|---------|----------|
| Qdrant | Vector similarity search |
| Weaviate | Vector search with filtering |
| Chroma | Lightweight embedding database |

Enable via optional component installation.

## GPU Configuration

Thinkube uses the NVIDIA GPU Operator for automatic GPU management.

### GPU in Templates

Templates request GPU resources in `thinkube.yaml`:

```yaml
spec:
  containers:
    - name: inference
      gpu:
        count: 1
        memory: "20Gi"
```

The platform handles GPU scheduling and resource allocation.

## LiteLLM Gateway

Route LLM requests through a unified API at `https://litellm.example.com`.

### Benefits
- Single API for multiple model backends
- OpenAI-compatible endpoint
- Usage tracking via Langfuse (optional)

## Next Steps

- [Web Applications](/learn/web-apps/) - Deploy web frontends for your AI services
- [GitOps & Automation](/learn/devops/) - Understand the deployment flow
- [Components](/components/) - See all available AI/ML components
