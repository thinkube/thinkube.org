---
title: Templates
description: Deploy applications from pre-configured templates
---

Templates are pre-configured application blueprints that let you deploy complete applications with one click. No Dockerfiles to write, no Kubernetes manifests to manage - just pick a template, give it a name, and deploy.

## Why thinkube.yaml?

Traditional Kubernetes deployments require hundreds of lines of YAML across multiple files. Thinkube simplifies this dramatically:

| | thinkube.yaml | Kubernetes + Helm |
|---|---|---|
| **Web app + database** | ~15 lines | ~200+ lines |
| **Files required** | 1 | 6-10 (Deployment, Service, Ingress, PVC, Secret, ConfigMap...) |
| **SSL certificates** | Automatic | Manual cert-manager setup |
| **Database connection** | `services: [database]` | StatefulSet + Secret + init scripts |
| **Learning curve** | Minutes | Weeks |

You describe **what** you want. Thinkube handles **how** to deploy it.

## Philosophy

**Many Simple Templates > One Complex Template**

- Each template does one thing well
- Most templates need 0-2 additional parameters
- Opinionated about technology choices
- Clone and customize, don't over-configure

## How Templates Work

Templates are GitHub repositories containing:
- **manifest.yaml** - Template metadata and parameters
- **thinkube.yaml** - Deployment descriptor
- **Source code** - Application code with Jinja2 templates
- **Dockerfile(s)** - Container build instructions

When you deploy:
1. Thinkube Control clones the template
2. Copier processes `.jinja` files with your parameters
3. Argo Workflows builds container images with Kaniko
4. Images push to Harbor registry
5. ArgoCD deploys via GitOps
6. SSL certificates auto-configure

Your application is available at `https://<project-name>.<your-domain>` within minutes.

## Available Templates

### tkt-webapp-vue-fastapi
**Vue.js + FastAPI Web Application**

Full-stack web application with Vue.js frontend and FastAPI backend, PostgreSQL database, and API documentation.

- **Parameters**: None - this template includes everything!
- **Tags**: webapp, vue, fastapi, fullstack, database

### tkt-tensorrt-llm-harmony
**TensorRT-LLM Inference Server**

NVIDIA TensorRT-LLM optimized inference loading models directly from MLflow Model Registry.

- **Parameters**:
  - `model_id` - Select from downloaded TensorRT models in model catalog
- **Tags**: ai, llm, tensorrt-llm, nvidia, inference, gpu, mlflow

### tkt-text-embeddings
**Text Embeddings Server (TEI + MLflow)**

High-performance text embeddings using Hugging Face TEI (Rust), loading models from MLflow Model Registry.

- **Parameters**:
  - `model_id` - Select from downloaded embedding models in model catalog
- **Tags**: ai, embeddings, rag, mlflow, text-embeddings, tei

### tkt-stable-diffusion
**Stable Diffusion Image Generator**

AI image generation with Stable Diffusion models. Requires RTX 3090+ GPU.

- **Parameters**:
  - `model_id` - Hugging Face model ID (default: stabilityai/stable-diffusion-xl-base-1.0)
- **Secrets**:
  - `HF_TOKEN` - Hugging Face token (optional, for gated models)
- **Tags**: ai, stable-diffusion, image-generation, gradio, gpu

## Template Manifest (manifest.yaml)

Defines template metadata and parameters:

```yaml
apiVersion: thinkube.io/v1
kind: TemplateManifest
metadata:
  name: tkt-webapp-vue-fastapi
  title: Vue.js + FastAPI Web Application
  description: Full-stack web application with Vue.js frontend and FastAPI backend
  tags: ["webapp", "vue", "fastapi", "fullstack", "database"]

parameters: []  # Most templates need zero additional parameters!
```

### Standard Parameters (Always Available)

Every template automatically receives:
- `project_name` - Application name (lowercase-hyphenated)
- `project_description` - Brief description
- `author_name` - Developer name
- `author_email` - Developer email

### Domain Variables

Platform-specific values injected automatically:
- `domain_name` - Your platform domain
- `container_registry` - Harbor registry URL
- `admin_username` - Platform admin username

## Deployment Descriptor (thinkube.yaml)

Defines what containers your application has and how to deploy them:

```yaml
apiVersion: thinkube.io/v1
kind: ThinkubeDeployment
metadata:
  name: "{{ project_name }}"

spec:
  containers:
    - name: backend
      build: ./backend
      port: 8000
      size: medium
      migrations:
        tool: alembic
        auto: true

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

### Container Configuration

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Container identifier | `backend`, `worker` |
| `build` | Build context path | `./backend`, `.` |
| `port` | Container port | `8000` |
| `size` | Resource size | `small`, `medium`, `large`, `xlarge` |
| `schedule` | Cron expression (for jobs) | `"0 * * * *"` |

### GPU Configuration

For ML/AI workloads:

```yaml
containers:
  - name: inference
    build: .
    port: 7860
    size: xlarge
    gpu:
      count: 1
      memory: "20Gi"
```

**Automatic MLflow Model Access**: GPU containers automatically receive:

- **`/mlflow-models` mount** - JuiceFS volume with all models from MLflow Model Registry
- **MLflow credentials** - Environment variables for MLflow API access:
  - `MLFLOW_AUTH_USERNAME`, `MLFLOW_AUTH_PASSWORD`
  - `MLFLOW_KEYCLOAK_TOKEN_URL`, `MLFLOW_KEYCLOAK_CLIENT_ID`, `MLFLOW_CLIENT_SECRET`
  - `SEAWEEDFS_PASSWORD` (for S3 access)

This means your inference container can load models directly from `/mlflow-models/<model-name>/<version>/` without any additional configuration.

### Resource Sizes

| Size | Memory | CPU | Use Case |
|------|--------|-----|----------|
| `small` | 256Mi | 100m | Basic web apps, microservices |
| `medium` | 512Mi | 500m | Standard applications |
| `large` | 1Gi | 1000m | Resource-intensive apps |
| `xlarge` | 80Gi | - | ML/AI workloads, LLMs |

### Platform Services

Declare required services - environment variables injected automatically:

| Service | Provides |
|---------|----------|
| `database` | PostgreSQL (`DATABASE_URL`) |
| `cache` | Valkey/Redis (`CACHE_URL`, `REDIS_URL`) |
| `queue` | Valkey/Redis queue (`QUEUE_URL`) |

### Database Migrations

Automatic Alembic migration support for Python/FastAPI backends:

```yaml
containers:
  - name: backend
    migrations:
      tool: alembic
      auto: true     # generate on deploy
```

### Testing Configuration

Tests run before container builds:

```yaml
containers:
  - name: backend
    test:
      enabled: true
      command: "pytest -v"
```

## Secrets Management

Templates can declare required secrets:

```yaml
secrets:
  - name: HF_TOKEN
    description: Hugging Face API token for gated models
    required: true
```

Secrets are:
- Encrypted at rest
- Managed in Thinkube Control UI
- Injected as environment variables
- Never exposed in logs or Git

## Deploying a Template

1. **Browse templates** in Thinkube Control or enter a GitHub URL
2. **Configure** - Provide project name and any required parameters
3. **Deploy** - Click deploy and watch real-time progress
4. **Access** - Your app is live at `https://<project-name>.<your-domain>`
