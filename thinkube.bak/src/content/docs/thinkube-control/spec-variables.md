---
title: Platform Environment Variables
description: Environment variables available to deployed applications
---

Thinkube injects environment variables into every deployed application. Your code reads these at runtime — no template processing or variable substitution is involved.

## Platform Variables

Automatically injected into every container. Always available.

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_NAME` | Application name (from deploy time) | `my-app` |
| `APP_TITLE` | Human-readable title | `My App` |
| `DOMAIN_NAME` | Platform domain | `thinkube.com` |
| `APP_URL` | Full application URL | `https://my-app.thinkube.com` |
| `FRONTEND_URL` | Same as APP_URL | `https://my-app.thinkube.com` |
| `API_BASE_URL` | API base URL | `https://my-app.thinkube.com/api` |
| `CONTAINER_REGISTRY` | Harbor registry URL | `registry.thinkube.com` |

### Authentication Variables

| Variable | Description |
|----------|-------------|
| `KEYCLOAK_URL` | Keycloak base URL |
| `KEYCLOAK_REALM` | Keycloak realm (`thinkube`) |
| `KEYCLOAK_CLIENT_ID` | OAuth2 client ID for this app |

### Usage in Code

```python
import os

APP_NAME = os.environ.get("APP_NAME", "")
DOMAIN = os.environ.get("DOMAIN_NAME", "")
REGISTRY = os.environ.get("CONTAINER_REGISTRY", "")
```

## Build Arguments

Injected at build time via Docker `ARG`. Available in Dockerfiles only.

| Build Arg | Description | Example |
|-----------|-------------|---------|
| `CONTAINER_REGISTRY` | Harbor registry URL | `registry.thinkube.com` |

### Usage in Dockerfiles

```dockerfile
ARG CONTAINER_REGISTRY
FROM ${CONTAINER_REGISTRY}/library/python-base:3.12-slim
```

The platform passes `--build-arg CONTAINER_REGISTRY=...` to every Kaniko build automatically.

## Service Variables

Injected when the corresponding service is declared in `thinkube.yaml`:

```yaml
services:
  - database
  - cache
```

| Service | Variables |
|---------|-----------|
| `database` | `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DATABASE` |
| `cache` | `CACHE_URL`, `REDIS_URL` |
| `queue` | `QUEUE_URL` |

## Dependency Variables

Injected when dependencies are declared in `thinkube.yaml`. The platform resolves each dependency to a running service URL:

```yaml
dependencies:
  - name: embeddings
    type: text-embeddings
    env: EMBEDDINGS_URL
```

The `env` field becomes the variable name. Deployment fails if the dependency is not found.

## User-Configurable Variables

Declared in `thinkube.yaml` under `env:`. These are surfaced in the deployment UI where users can override defaults:

```yaml
env:
  - name: BATCH_SIZE
    description: "Items per batch"
    default: "8"
```

### Usage in Code

```python
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "8"))
```

## Manifest Parameter Variables

Parameters declared in `manifest.yaml` (e.g., `model_id`) are injected as uppercase environment variables at deploy time:

| Manifest Parameter | Environment Variable |
|-------------------|---------------------|
| `model_id` | `MODEL_ID` |
| `enable_websockets` | `ENABLE_WEBSOCKETS` |

### Usage in Code

```python
MODEL_ID = os.environ.get("MODEL_ID", "default-model")
```

## GPU / MLflow Variables

Automatically injected when a container has `gpu` configuration:

| Variable | Description |
|----------|-------------|
| `MLFLOW_AUTH_USERNAME` | MLflow API username |
| `MLFLOW_AUTH_PASSWORD` | MLflow API password |
| `MLFLOW_KEYCLOAK_TOKEN_URL` | Keycloak token endpoint |
| `MLFLOW_KEYCLOAK_CLIENT_ID` | MLflow OAuth client ID |
| `MLFLOW_CLIENT_SECRET` | MLflow OAuth client secret |
| `SEAWEEDFS_PASSWORD` | S3 storage access key |

GPU containers also get `/mlflow-models` mounted with all models from MLflow Model Registry.

## Summary

All configuration flows through environment variables. There is no template processing or variable substitution in your application code:

| Source | When Injected | Example |
|--------|--------------|---------|
| Platform variables | Always | `APP_NAME`, `DOMAIN_NAME` |
| Build args | At build time | `CONTAINER_REGISTRY` in Dockerfiles |
| Service variables | When service declared | `DATABASE_URL` |
| Dependency variables | When dependency declared | `EMBEDDINGS_URL` |
| User-configurable | When env declared | `BATCH_SIZE` |
| Manifest parameters | When parameter provided | `MODEL_ID` |
| GPU/MLflow | When gpu configured | `MLFLOW_AUTH_USERNAME` |
