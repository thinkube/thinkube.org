---
title: App Templates
description: Deploy applications from pre-configured templates
---

Templates are pre-configured application blueprints that let you deploy complete applications with one click. No Dockerfiles to write, no Kubernetes manifests to manage — just pick a template, give it a name, and deploy.

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

Templates are GitHub repositories containing plain, runnable code:
- **manifest.yaml** — Template metadata and parameters
- **thinkube.yaml** — Deployment descriptor
- **Source code** — Application code (plain files, no template syntax)
- **Dockerfile(s)** — Container build instructions

When you deploy:
1. Thinkube Control clones the template repository
2. Argo Workflows builds container images with Kaniko
3. Images push to Harbor registry
4. ArgoCD deploys via GitOps
5. SSL certificates auto-configure

Your application is available at `https://<app-name>.<your-domain>` within minutes.

## Template Lifecycle

Templates enable a seamless development workflow:

1. **Deploy** — Pick a platform template, give it a name, deploy
2. **Develop** — Edit your app in code-server, push to Gitea, iterate fast
3. **Publish** — When ready, publish your app as a new template in your GitHub org

Since templates are plain code (no template syntax), the app you develop IS the template. Publishing just pushes it to GitHub and registers it in your template catalog.

## Available Templates

### Web Applications

#### tkt-webapp-vue-fastapi
**Vue.js + FastAPI Web Application**

Full-stack web application with Vue.js frontend and FastAPI backend, PostgreSQL database, and API documentation.

- **Deployment type**: app (always-on)
- **Parameters**: None
- **Tags**: webapp, vue, fastapi, fullstack, database

### AI / ML Inference

#### tkt-tensorrt-llm-harmony
**TensorRT-LLM Inference Server**

NVIDIA TensorRT-LLM optimized inference loading models directly from MLflow Model Registry.

- **Deployment type**: app (always-on)
- **Parameters**:
  - `model_id` — Select from downloaded TensorRT models in model catalog
- **Tags**: ai, llm, tensorrt-llm, nvidia, inference, gpu, mlflow

#### tkt-text-embeddings
**Text Embeddings Server (TEI + MLflow)**

High-performance text embeddings using Hugging Face TEI (Rust), loading models from MLflow Model Registry.

- **Deployment type**: app (always-on)
- **Parameters**:
  - `model_id` — Select from downloaded embedding models in model catalog
- **Tags**: ai, embeddings, rag, mlflow, text-embeddings, tei

#### tkt-vllm-gradio
**vLLM Inference Server**

High-performance text generation with vLLM engine and Gradio UI. Requires RTX 3090+ GPU.

- **Deployment type**: app (always-on)
- **Parameters**:
  - `model_id` — Hugging Face model ID (e.g., mistralai/Mistral-7B-Instruct-v0.2)
- **Secrets**:
  - `HF_TOKEN` — Hugging Face token (required, for gated models)
- **Tags**: ai, llm, vllm, gradio, inference, gpu

#### tkt-stable-diffusion
**Stable Diffusion Image Generator**

AI image generation with Stable Diffusion models. Requires RTX 3090+ GPU.

- **Deployment type**: app (always-on)
- **Parameters**:
  - `model_id` — Hugging Face model ID (default: stabilityai/stable-diffusion-xl-base-1.0)
- **Secrets**:
  - `HF_TOKEN` — Hugging Face token (optional, for gated models)
- **Tags**: ai, stable-diffusion, image-generation, gradio, gpu

### Knative (Scale-to-Zero)

#### tkt-knative-demo
**Knative Demo — Scale-to-Zero Test Service**

A minimal Knative service for testing scale-to-zero deployments. Returns a configurable greeting, simulates processing delay, and reports its own scaling state.

- **Deployment type**: knative (scale-to-zero)
- **Parameters**: None
- **Environment variables**:
  - `GREETING` — Greeting message (default: "Hello from Knative!")
  - `SIMULATE_WORK_MS` — Simulated processing delay in ms (default: "100")
- **Tags**: knative, demo, testing, scale-to-zero

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

Every deployment automatically receives these as environment variables:
- `APP_NAME` — Application name
- `APP_TITLE` — Human-readable title
- `DOMAIN_NAME` — Platform domain
- `CONTAINER_REGISTRY` — Harbor registry URL (also available as Docker build arg)

### Domain Variables

Platform-specific values injected automatically as environment variables:
- `APP_URL` — Full application URL
- `KEYCLOAK_URL` — Authentication endpoint
- `KEYCLOAK_CLIENT_ID` — OAuth2 client ID

## Deployment Descriptor (thinkube.yaml)

Defines what containers your application has and how to deploy them. This is a static file — no variable substitutions. There are two deployment types:

- **`app`** (default) — Always-on Kubernetes Deployment, for services that must run continuously
- **`knative`** — Scale-to-zero Knative Service, for stateless processing that can idle

### Always-On Application

```yaml
apiVersion: thinkube.io/v1
kind: ThinkubeDeployment

spec:
  containers:
    - name: backend
      build: ./backend
      port: 8000
      size: medium
      health: /health
      migrations:
        tool: alembic
        auto: true

    - name: frontend
      build: ./frontend
      port: 80
      health: /health

  routes:
    - path: /api
      to: backend
    - path: /
      to: frontend

  services:
    - database
```

### Knative Scale-to-Zero Service

```yaml
apiVersion: thinkube.io/v1
kind: ThinkubeDeployment

spec:
  deployment:
    type: knative
    minScale: 0
    maxScale: 3
    containerConcurrency: 5
    timeoutSeconds: 30

  containers:
    - name: api
      build: .
      port: 8080
      size: small
      health: /health

  env:
    - name: GREETING
      description: "Greeting message returned by the service"
      default: "Hello from Knative!"

  routes:
    - path: /
      to: api
```

### Container Configuration

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Container identifier | `backend`, `worker` |
| `build` | Build context path | `./backend`, `.` |
| `port` | Container port | `8000` |
| `health` | Health endpoint (required for containers with ports) | `/health` |
| `size` | Resource size | `small`, `medium`, `large`, `xlarge` |
| `schedule` | Cron expression (for jobs) | `"0 * * * *"` |
| `mounts` | Storage volume mounts | `"uploads:/data/uploads"` |

### GPU Configuration

For ML/AI workloads:

```yaml
containers:
  - name: inference
    build: .
    port: 7860
    size: xlarge
    health: /health
    gpu:
      count: 1
      memory: "20Gi"
```

**Automatic MLflow Model Access**: GPU containers automatically receive:

- **`/mlflow-models` mount** — JuiceFS volume with all models from MLflow Model Registry
- **MLflow credentials** — Environment variables for MLflow API access

### Resource Sizes

| Size | Memory | CPU | Use Case |
|------|--------|-----|----------|
| `small` | 256Mi | 100m | Basic web apps, microservices |
| `medium` | 512Mi | 500m | Standard applications |
| `large` | 1Gi | 1000m | Resource-intensive apps |
| `xlarge` | 80Gi | - | ML/AI workloads, LLMs |

### Dependencies

Declare dependencies on other deployed services. Thinkube Control resolves each dependency to a running cluster URL and injects it as the declared environment variable:

```yaml
dependencies:
  - name: embeddings
    type: text-embeddings
    env: EMBEDDINGS_URL
```

Deployment fails if a dependency is not found.

### Environment Variables

Declare configurable environment variables surfaced in the deployment UI:

```yaml
env:
  - name: BATCH_SIZE
    description: "Number of items to process per batch"
    default: "8"
```

### Platform Services

Declare required services — environment variables injected automatically:

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
2. **Configure** — Provide app name and any required parameters
3. **Deploy** — Click deploy and watch real-time progress
4. **Access** — Your app is live at `https://<app-name>.<your-domain>`
