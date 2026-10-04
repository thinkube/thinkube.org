---
title: "tk-llm Python SDK"
description: Python SDK for managing and consuming local LLMs through the thinkube LLM Gateway.
---

> Manage and consume your local LLMs programmatically from Jupyter notebooks, scripts, or deployed apps.

## Installation

```bash
pip install tk-llm            # core SDK (httpx + pydantic)
pip install tk-llm[openai]    # adds OpenAI client convenience
```

The package is hosted on the platform's private DevPI index and available to all user workloads.

## Quick start — chat completions

The simplest way to call your local LLMs:

```python
from tk_llm import get_openai_client

client = get_openai_client()
response = client.chat.completions.create(
    model="Qwen/Qwen3.5-4B",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(response.choices[0].message.content)
```

This returns a standard `openai.OpenAI` client pointed at your gateway. It auto-discovers the gateway URL from the `LLM_GATEWAY_URL` environment variable (set automatically in deployed templates) and handles authentication via the `THINKUBE_API_TOKEN` env var.

You can also pass values explicitly:

```python
client = get_openai_client(
    gateway_url="https://llm.yourdomain.com",
    api_token="tk_your_token_here",
    tier="performance",  # prefer high-throughput backends
)
```

## Managing models

The `LLMClient` gives you programmatic access to the management API — list models, check GPU resources, load and unload models:

```python
from tk_llm import LLMClient

llm = LLMClient()

# List available models
models = llm.list_models(state="available")
for m in models.models:
    print(f"{m.id} [{m.state}] {m.params_b or '?'}B params")

# Check GPU resources
gpu = llm.gpu_status()
print(f"GPU memory: {gpu.used_memory_gb:.1f}/{gpu.total_memory_gb:.1f} GB")
print(f"Can load more: {gpu.can_accept_new_model}")

# Load a model
result = llm.load_model("Qwen/Qwen3.5-4B", tier="flexible")
print(result.message)

# Check load options before loading
options = llm.get_load_options("Qwen/Qwen3.5-4B")
print(f"Estimated memory: {options.estimated_memory_gb:.1f} GB")
for backend in options.compatible_backends:
    print(f"  Backend: {backend.name} ({backend.type}) - {backend.status}")

# Unload when done
llm.unload_model("Qwen/Qwen3.5-4B")
```

## Async support

For use in async frameworks (FastAPI, async notebooks):

```python
from tk_llm import AsyncLLMClient

async with AsyncLLMClient() as llm:
    models = await llm.list_models()
    gpu = await llm.gpu_status()
    await llm.load_model("Qwen/Qwen3.5-4B")
```

## Listing and filtering models

```python
from tk_llm import LLMClient

llm = LLMClient()

# All models
all_models = llm.list_models()
print(f"{all_models.total} total, {all_models.available} loaded, {all_models.deployable} ready to load")

# Filter by state
loaded = llm.list_models(state="available")
ready = llm.list_models(state="deployable")

# Filter by backend type
ollama_models = llm.list_models(server_type="ollama")
vllm_models = llm.list_models(server_type="vllm")
```

## Inspecting backends and GPUs

```python
from tk_llm import LLMClient

llm = LLMClient()

# List inference backends
backends = llm.list_backends()
for b in backends.backends:
    print(f"{b.name} ({b.type}) on {b.node} - {b.status}")

# GPU status per node
gpu = llm.gpu_status()
for node in gpu.nodes:
    print(f"{node.name}: {node.gpu_product}")
    print(f"  Memory: {node.used_memory_gb:.1f}/{node.total_memory_gb:.1f} GB")
    print(f"  Slots: {node.available_slots}/{node.total_slots} available")
    for alloc in node.allocations:
        print(f"  Loaded: {alloc.model_id} ({alloc.estimated_memory_gb:.1f} GB)")
```

## Configuration

| Environment variable | Description | Default |
|---------------------|-------------|---------|
| `LLM_GATEWAY_URL` | LLM proxy URL | Auto-discovered from cluster DNS |
| `THINKUBE_API_TOKEN` | API token (`tk_...`) or JWT | None |

All settings can also be passed directly to `LLMClient()`, `AsyncLLMClient()`, or `get_openai_client()`.

## API reference

### Client methods

| Method | Description | Returns |
|--------|-------------|---------|
| `list_models(state?, server_type?)` | List all models, optionally filtered | `ModelsListResponse` |
| `get_model_status(model_id)` | Detailed status of a model | `ModelStatusResponse` |
| `resolve_model(model, tier?)` | Resolve model alias to backend URL | `ModelResolveResponse` |
| `get_load_options(model_id)` | Compatible backends and GPU info | `LoadOptionsResponse` |
| `load_model(model_id, tier?, backend?, node?, ...)` | Load a model | `ModelLoadResponse` |
| `unload_model(model_id, force?)` | Unload a model | `ModelLoadResponse` |
| `list_backends()` | List inference backends | `BackendsListResponse` |
| `gpu_status()` | GPU resources across all nodes | `GPUStatusResponse` |
| `refresh()` | Force re-discovery of models and backends | `RefreshResponse` |
| `openai_client(tier?)` | Get a pre-configured OpenAI client | `openai.OpenAI` |

### Convenience functions

| Function | Description | Returns |
|----------|-------------|---------|
| `get_openai_client(gateway_url?, api_token?, tier?)` | Pre-configured OpenAI client | `openai.OpenAI` |
| `get_async_openai_client(gateway_url?, api_token?, tier?)` | Pre-configured async OpenAI client | `openai.AsyncOpenAI` |

### Exceptions

| Exception | When |
|-----------|------|
| `LLMError` | Base exception for all SDK errors |
| `AuthError` | Authentication failed (401/403) |
| `NotFoundError` | Model or resource not found (404) |
| `GatewayError` | Backend or gateway error (5xx) |

Source: [github.com/thinkube/tk-llm](https://github.com/thinkube/tk-llm)
