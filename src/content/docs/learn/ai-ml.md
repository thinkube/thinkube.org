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

Deploy inference backends, mirror models, and access them through the LLM Gateway — a unified API compatible with both OpenAI and Anthropic SDKs.

### Inference Backends

| Backend | Deployed as | Best for |
|---------|-------------|----------|
| **TensorRT-LLM** | Template (`tkt-tensorrt-llm-harmony`) | Maximum performance with pre-optimized models |
| **vLLM** | Template (`tkt-vllm-gradio`) | Flexible inference, supports most HuggingFace models |
| **Ollama** | Optional Component | Lightweight GGUF models for development and testing |

Templates include a Gradio chat UI for interactive testing. Ollama runs as a platform service accessible only through the gateway.

### Other AI Templates

| Template | Description | GPU Memory |
|----------|-------------|------------|
| `tkt-stable-diffusion` | Image generation | ~20GB |
| `tkt-text-embeddings` | Text embeddings service | ~8GB |

See the **[LLM Gateway playbook](/learn/llm-gateway/)** for a step-by-step guide to mirroring models, deploying backends, and calling them through the API.

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

## LLM Gateway

The LLM Gateway at `https://llm.yourdomain.com` provides a single API for all your locally-running models.

- **OpenAI-compatible** — `POST /v1/chat/completions`
- **Anthropic-compatible** — `POST /v1/messages`
- **Automatic routing** — use the model ID from the catalog, the gateway finds the right backend
- **Reasoning separation** — thinking models return reasoning in a separate field

See the **[LLM Gateway playbook](/learn/llm-gateway/)** for complete setup and usage instructions.

## Next Steps

- [LLM Gateway](/learn/llm-gateway/) - Mirror models and call them through the API
- [Web Applications](/learn/web-apps/) - Deploy web frontends for your AI services
- [GitOps & Automation](/learn/devops/) - Understand the deployment flow
- [Components](/components/) - See all available AI/ML components
