---
title: thinkube.yaml Spec
description: Deployment descriptor specification reference
---

The `thinkube.yaml` file is a static descriptor that tells Thinkube Control what containers an application has and how to deploy them.

## Core Principles

1. **Static Descriptor** - Not a template with conditionals
2. **Cloud Agnostic** - Works on-premise and cloud
3. **Simple** - No Kubernetes knowledge required
4. **Flexible** - Supports 1 to N containers

## Schema

```yaml
apiVersion: thinkube.io/v1
kind: ThinkubeDeployment
metadata:
  name: string              # Application name

spec:
  containers:               # List of containers
    - name: string          # Container identifier
      build: string         # Build context path
      port: number          # Container port (optional)
      size: string          # Resource size (optional)
      schedule: string      # Cron expression (optional)
      gpu:                  # GPU requirements (optional)
        count: number
        memory: string
      test:                 # Test configuration (optional)
        enabled: boolean
        command: string
        image: string
      migrations:           # Migration configuration (optional)
        tool: string
        auto: boolean
      capabilities: [string] # Special capabilities (optional)

  routes:                   # HTTP routing (optional)
    - path: string
      to: string

  services: [string]        # Platform services (optional)
```

## Container Fields

### name

Unique identifier for the container. Used in routing and references.

Examples: `backend`, `frontend`, `worker`, `api`

### build

Path to build context relative to project root.

Examples: `"."`, `"./backend"`, `"./services/api"`

### port

TCP port the container listens on. Optional for workers/jobs.

Range: 1-65535

### size

Resource allocation hint.

| Size | Memory | CPU | Use Case |
|------|--------|-----|----------|
| `small` | 256Mi | 100m | Basic web apps, microservices |
| `medium` | 512Mi | 500m | Standard applications |
| `large` | 1Gi | 1000m | Resource-intensive apps |
| `xlarge` | 80Gi | - | ML/AI workloads, LLMs |

### schedule

Cron expression for scheduled containers. Container will not have persistent pods.

Example: `"0 * * * *"` (hourly), `"0 2 * * *"` (daily at 2am)


### gpu

GPU resource requirements for ML/AI workloads.

```yaml
gpu:
  count: 1         # Number of GPUs (required)
  memory: "20Gi"   # Minimum memory per GPU (required)
```

Both fields are mandatory. Platform behavior:
- Allocates specified number of GPUs
- Ensures each GPU has minimum memory
- Prefers lower-capability GPUs that meet requirements

**Automatic MLflow Model Access**: When `gpu` is defined, the platform automatically:

1. **Mounts MLflow models** at `/mlflow-models` via JuiceFS
   - All models from MLflow Model Registry are accessible
   - Path format: `/mlflow-models/<model-name>/<version>/`

2. **Injects MLflow credentials** as environment variables:
   - `MLFLOW_AUTH_USERNAME`, `MLFLOW_AUTH_PASSWORD`
   - `MLFLOW_KEYCLOAK_TOKEN_URL`, `MLFLOW_KEYCLOAK_CLIENT_ID`, `MLFLOW_CLIENT_SECRET`
   - `SEAWEEDFS_PASSWORD` (S3 storage access)

This allows inference containers to load models directly from disk without downloading.

### test

Test configuration for CI/CD pipelines. Tests run before container builds.

```yaml
test:
  enabled: true              # Run tests (default: false)
  command: "pytest -v"       # Test command (required when enabled)
  image: "custom/runner:1"   # Optional image override
```

Default test images:
- Python: `registry.{domain}/library/python-base:3.11-slim`
- Node.js: `registry.{domain}/library/node-base:18-alpine`

### migrations

Database migration configuration for Python/FastAPI backends using Alembic.

```yaml
migrations:
  tool: alembic    # Currently only alembic is supported
  auto: true       # Generate migrations on deploy (default: true)
```

When configured, Thinkube will:
1. Set up database connection for migration generation
2. Run `alembic revision --autogenerate` during deployment
3. Commit generated migrations to the repository

### capabilities

Special container capabilities.

| Capability | Description |
|------------|-------------|
| `large-uploads` | Configure nginx for uploads up to 1GB |

## Routes

HTTP ingress routing rules. Paths are matched in order (most specific first).

```yaml
routes:
  - path: /api
    to: backend
  - path: /ws
    to: backend
  - path: /
    to: frontend
```

## Services

Platform services the application requires. Environment variables are auto-injected.

| Service | Environment Variable |
|---------|---------------------|
| `database` | `DATABASE_URL` |
| `cache` | `CACHE_URL`, `REDIS_URL` |
| `queue` | `QUEUE_URL` |

## Substitutions

Only these substitutions are allowed in thinkube.yaml:

| Variable | Usage |
|----------|-------|
| `{{ project_name }}` | In metadata.name only |

## Examples

### Minimal Application

```yaml
apiVersion: thinkube.io/v1
kind: ThinkubeDeployment
metadata:
  name: "{{ project_name }}"

spec:
  containers:
    - name: app
      build: .
      port: 3000
```

### Web Application with Database

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
      test:
        enabled: true
        command: "pytest --cov=app"
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

### ML/AI Application with GPU

```yaml
apiVersion: thinkube.io/v1
kind: ThinkubeDeployment
metadata:
  name: "{{ project_name }}"

spec:
  containers:
    - name: inference
      build: .
      port: 7860
      size: xlarge
      gpu:
        count: 1
        memory: "20Gi"
      test:
        enabled: false

  routes:
    - path: /
      to: inference
```

### Complex Multi-Container Application

```yaml
apiVersion: thinkube.io/v1
kind: ThinkubeDeployment
metadata:
  name: "{{ project_name }}"

spec:
  containers:
    - name: api
      build: ./api
      port: 8000
      size: medium

    - name: webapp
      build: ./webapp
      port: 3000

    - name: worker
      build: ./worker
      size: large

    - name: scheduler
      build: ./scheduler
      schedule: "*/15 * * * *"

  routes:
    - path: /api
      to: api
    - path: /
      to: webapp

  services:
    - database
    - cache
    - queue
```

## Platform Behavior

### Health Checks

All containers with ports must expose `/health` endpoint.

### TLS Certificates

HTTPS is automatically enabled using platform wildcard certificates.

### CI/CD Testing

When tests are configured:
- Tests run before container builds
- Failed tests prevent deployment
- Test results reported to Thinkube Control

## What is NOT Supported

- Conditional logic (`{% if %}` statements)
- Complex Kubernetes configurations
- Cloud-specific settings
- Deployment strategies
- Service mesh configurations
- Raw environment variables (use Dockerfile ENV)
- Command overrides (use Dockerfile CMD)
- Multi-region deployments

These are handled by Dockerfiles, Thinkube Control, or future Cloud Bridge.
