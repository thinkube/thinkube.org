---
title: Creating Templates
description: Build your own Thinkube application templates
---

Templates are GitHub repositories containing plain, runnable application code. No special templating syntax — your code reads configuration from environment variables, and the platform injects everything at build and deploy time.

## Philosophy

**Many Simple Templates > One Complex Template**

- Each template does one thing well
- Most templates need 0-2 additional parameters
- Be opinionated about technology choices
- Clone and customize, don't over-configure

## Template Structure

A template repository contains plain files:

```
my-template/
├── manifest.yaml          # Template metadata and parameters
├── thinkube.yaml          # Deployment descriptor
├── backend/
│   ├── Dockerfile         # Plain Dockerfile (uses ARG for registry)
│   ├── main.py            # Plain Python (reads env vars)
│   └── ...
├── frontend/
│   ├── Dockerfile
│   └── ...
└── README.md
```

There are no `.jinja` files. The template IS runnable code.

## Step 1: Create manifest.yaml

The manifest defines what your template is and what parameters it needs.

```yaml
apiVersion: thinkube.io/v1
kind: TemplateManifest
metadata:
  name: my-webapp
  title: My Web Application
  description: Full-stack web app with FastAPI and Vue.js
  tags: ["webapp", "vue", "fastapi", "fullstack"]

parameters: []  # Start with zero - add only if essential
```

### Adding Parameters (Only When Necessary)

Parameters are collected in the deployment UI and injected as environment variables at runtime. Only add parameters that fundamentally change the template:

```yaml
parameters:
  - name: model_id
    type: choice
    description: Select a model from the catalog
    dynamic_source: "model_catalog"
    filter:
      server_type: "tensorrt"
      is_downloaded: true
```

Your code reads the parameter as an env var:
```python
MODEL_ID = os.environ.get("MODEL_ID", "default-model")
```

**When to add a parameter:**
- Changes fundamental architecture
- Affects 5+ files when toggled
- Adds/removes major dependencies

**When NOT to add a parameter:**
- Version selections (be opinionated)
- Runtime configuration (use `env:` in thinkube.yaml)
- Style preferences (users can change after)

### Secrets

Declare required API keys and credentials:

```yaml
secrets:
  - name: HF_TOKEN
    description: Hugging Face token for gated models
    required: true
```

Secrets are encrypted at rest, managed in Thinkube Control UI, and injected as environment variables.

## Step 2: Create thinkube.yaml

The deployment descriptor tells Thinkube Control what containers to build and how to deploy them. It is a static file — no variable substitutions.

### Always-On Application (default)

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

For stateless processing services that should scale to zero when idle:

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

Use `type: app` (the default) for services that must always be running. Use `type: knative` for stateless processing that benefits from scale-to-zero.

### Container Options

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Container identifier | `backend`, `worker` |
| `build` | Build context path | `./backend`, `.` |
| `port` | Container port | `8000` |
| `health` | Health endpoint path (required for containers with ports) | `/health` |
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

GPU containers automatically get:
- **`/mlflow-models` mount** — All models from MLflow Model Registry
- **MLflow credentials** — `MLFLOW_AUTH_USERNAME`, `MLFLOW_AUTH_PASSWORD`, etc.

### Dependencies

Declare dependencies on other deployed services. Thinkube Control resolves each one to a running cluster URL and injects it as the declared environment variable. Deployment fails if a dependency is not found.

```yaml
dependencies:
  - name: embeddings
    type: text-embeddings
    env: EMBEDDINGS_URL
```

### Environment Variables

Declare configurable environment variables that are surfaced in the deployment UI:

```yaml
env:
  - name: BATCH_SIZE
    description: "Number of items to process per batch"
    default: "8"
```

### Platform Services

| Service | Environment Variable |
|---------|---------------------|
| `database` | `DATABASE_URL` |
| `cache` | `CACHE_URL`, `REDIS_URL` |
| `queue` | `QUEUE_URL` |

### Testing

```yaml
containers:
  - name: backend
    build: ./backend
    port: 8000
    health: /health
    test:
      enabled: true
      command: "pytest -v"
```

### Database Migrations

```yaml
containers:
  - name: backend
    migrations:
      tool: alembic
      auto: true
```

## Step 3: Write Your Code

Your code is plain — no template syntax. Read all configuration from environment variables.

### Python

```python
import os

APP_NAME = os.environ.get("APP_NAME", "")
DOMAIN = os.environ.get("DOMAIN_NAME", "")
MODEL_ID = os.environ.get("MODEL_ID", "default-model")
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "8"))
```

### Dockerfiles

Use `ARG CONTAINER_REGISTRY` for base images. The platform provides the value at build time:

```dockerfile
ARG CONTAINER_REGISTRY
FROM ${CONTAINER_REGISTRY}/library/python-base:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Health Checks

All containers with ports must expose `/health`:

```python
@app.get("/health")
def health():
    return {"status": "healthy"}
```

## Step 4: Push and Deploy

1. Push to a GitHub repository
2. In Thinkube Control, go to Templates
3. Enter your repository URL
4. Deploy and verify

## Development Workflow

The natural way to build templates:

1. **Start from a template** — Deploy an existing template via Thinkube Control
2. **Develop your app** — Edit code in code-server, push to Gitea, iterate fast
3. **Publish as template** — When ready, click "Publish as Template" in the UI

Since there's no template syntax in your code, the app you developed IS the template. Publishing just pushes it to your GitHub org and registers it in your template catalog.

## From App to Template

Because templates are plain code, converting a deployed app into a reusable template is trivial:

1. Your app already has `manifest.yaml` and `thinkube.yaml` (they came with the original template)
2. Your code already reads env vars (it had to, for the platform to work)
3. Your Dockerfiles already use `ARG CONTAINER_REGISTRY` (the build system requires it)

There's nothing to "extract" or "generalize." The code is already template-ready.

## Best Practices

### Do

- Start with zero parameters
- Be opinionated about technology choices
- Use clear, descriptive template names
- Include working example code
- Read all configuration from environment variables

### Don't

- Add template syntax (`{{ }}`) to your code
- Create "configurable everything" templates
- Add parameters for runtime configuration
- Hardcode domain-specific values

## Reference

- [Template Manifest Spec](/thinkube-control/spec-manifest/) — Full manifest.yaml specification
- [Platform Environment Variables](/thinkube-control/spec-variables/) — All available variables
- [thinkube.yaml Spec](/thinkube-control/spec-thinkube-yaml/) — Deployment descriptor specification
