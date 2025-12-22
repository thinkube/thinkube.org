---
title: Creating Templates
description: Build your own Thinkube application templates
---

This guide walks you through creating a Thinkube template. Templates are GitHub repositories that define deployable applications.

## Philosophy

**Many Simple Templates > One Complex Template**

- Each template does one thing well
- Most templates need 0-2 additional parameters
- Be opinionated about technology choices
- Clone and customize, don't over-configure

## Template Structure

A template repository contains:

```
my-template/
├── manifest.yaml          # Template metadata and parameters
├── thinkube.yaml          # Deployment descriptor
├── backend/
│   ├── Dockerfile
│   ├── main.py.jinja      # Source files with Jinja2 templates
│   └── ...
├── frontend/
│   ├── Dockerfile
│   └── ...
└── README.md.jinja
```

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

Only add parameters that fundamentally change the template structure:

```yaml
parameters:
  - name: enable_websockets
    type: bool
    description: Include WebSocket support?
    default: false
```

**When to add a parameter:**
- Changes fundamental architecture
- Affects 5+ files when toggled
- Adds/removes major dependencies
- Security boundary decision

**When NOT to add a parameter:**
- Version selections (be opinionated)
- Runtime configuration (use environment variables)
- Style preferences (users can change after)

### Parameter Types

| Type | Use Case | Example |
|------|----------|---------|
| `bool` | Yes/No decisions | `enable_auth: true` |
| `str` | Text input (rarely needed) | `api_prefix: "/api/v1"` |
| `int` | Numbers (rarely needed) | `worker_count: 4` |
| `choice` | Selection from options | `auth_provider: "keycloak"` |

### Dynamic Model Selection

For AI templates, use dynamic choices from the model catalog:

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

### Secrets

Declare required API keys and credentials:

```yaml
secrets:
  - name: HF_TOKEN
    description: Hugging Face token for gated models
    required: true

  - name: SLACK_WEBHOOK
    description: Optional Slack notifications
    required: false
```

Secrets are:
- Encrypted at rest
- Managed in Thinkube Control UI
- Injected as environment variables
- Never exposed in logs or Git

## Step 2: Create thinkube.yaml

The deployment descriptor tells Thinkube Control what containers to build and how to deploy them.

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

### Container Options

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

GPU containers automatically get:
- **`/mlflow-models` mount** - All models from MLflow Model Registry
- **MLflow credentials** - `MLFLOW_AUTH_USERNAME`, `MLFLOW_AUTH_PASSWORD`, etc.

Your container can load models from `/mlflow-models/<model-name>/<version>/`.

### Testing

Configure tests that run before builds:

```yaml
containers:
  - name: backend
    build: ./backend
    port: 8000
    test:
      enabled: true
      command: "pytest -v"
```

### Database Migrations

For Python/FastAPI backends using Alembic:

```yaml
containers:
  - name: backend
    migrations:
      tool: alembic  # Currently only alembic is supported
      auto: true     # Generate on deploy
```

### Platform Services

| Service | Environment Variable |
|---------|---------------------|
| `database` | `DATABASE_URL` |
| `cache` | `CACHE_URL`, `REDIS_URL` |
| `queue` | `QUEUE_URL` |

## Step 3: Use Template Variables

Files ending in `.jinja` are processed with Copier. Use these variables:

### Standard Parameters (Always Available)

| Variable | Description |
|----------|-------------|
| `{{ project_name }}` | Application name (lowercase-hyphenated) |
| `{{ project_description }}` | Brief description |
| `{{ author_name }}` | Developer name |
| `{{ author_email }}` | Developer email |

### Domain Variables

| Variable | Description |
|----------|-------------|
| `{{ domain_name }}` | Platform domain |
| `{{ container_registry }}` | Harbor registry URL |
| `{{ admin_username }}` | Platform admin username |

### Example Usage

**Python file (server.py.jinja):**
```python
APP_NAME = "{{ project_name }}"
DOMAIN = "{{ domain_name }}"
```

**Dockerfile (Dockerfile.jinja):**
```dockerfile
FROM {{ container_registry }}/library/python:3.12-slim
LABEL maintainer="{{ author_name }} <{{ author_email }}>"
```

**Config file (config.yaml.jinja):**
```yaml
app:
  name: {{ project_name }}
  host: {{ project_name }}.{{ domain_name }}
```

### Important: thinkube.yaml is Static

Only `{{ project_name }}` is allowed in thinkube.yaml:

```yaml
metadata:
  name: "{{ project_name }}"  # OK

spec:
  containers:
    - image: {{ registry }}/...  # NOT ALLOWED
```

## Step 4: Create Dockerfiles

Each container needs a Dockerfile. Use the platform registry for base images:

```dockerfile
# Dockerfile.jinja
FROM {{ container_registry }}/library/python:3.12-slim

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

## Step 5: Test Your Template

1. Push to a GitHub repository
2. In Thinkube Control, go to Templates
3. Enter your repository URL
4. Deploy and verify

## Best Practices

### Do

- Start with zero parameters
- Be opinionated about technology choices
- Use clear, descriptive template names
- Include working example code
- Document what the template provides

### Don't

- Create "configurable everything" templates
- Add parameters for runtime configuration
- Use conditionals in thinkube.yaml
- Hardcode domain-specific values

## Reference

- [Template Manifest Spec](/thinkube-control/spec-manifest/) - Full manifest.yaml specification
- [Template Variables Spec](/thinkube-control/spec-variables/) - All available variables
- [thinkube.yaml Spec](/thinkube-control/spec-thinkube-yaml/) - Deployment descriptor specification
