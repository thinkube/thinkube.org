---
title: thinkube.yaml Spec
description: Deployment descriptor specification reference
---

The `thinkube.yaml` file is a static descriptor that tells Thinkube Control what containers an application has and how to deploy them.

## Core Principles

1. **Static Descriptor** — No templates, no conditionals, no variable substitutions
2. **Portable Applications** — No cloud-specific or Kubernetes-specific syntax, so applications can be deployed to other environments via future bridge adapters
3. **Simple** — No Kubernetes knowledge required
4. **Flexible** — Supports 1 to N containers
5. **Two Workload Types** — Always-on apps and scale-to-zero Knative services

## Schema

```yaml
apiVersion: thinkube.io/v1
kind: ThinkubeDeployment

spec:
  deployment:               # Deployment type and scaling (optional)
    type: string            # "app" (default) or "knative"
    minScale: number        # Knative: minimum pods (default: 0)
    maxScale: number        # Knative: maximum pods (default: 5)
    containerConcurrency: number  # Knative: max concurrent requests per pod (default: 0 = unlimited)
    timeoutSeconds: number  # Knative: request timeout in seconds (default: 300)

  containers:               # List of containers
    - name: string          # Container identifier
      build: string         # Build context path
      port: number          # Container port (optional)
      size: string          # Resource size (optional)
      health: string        # Health endpoint path (required for containers with ports)
      schedule: string      # Cron expression (optional)
      mounts:               # Storage mounts (optional)
        - string            # Format: "storage-name:/mount/path"
      gpu:                  # GPU requirements (optional)
        count: number
        memory: string
      capabilities: [string] # Special capabilities (optional)
      test:                 # Test configuration (optional)
        enabled: boolean
        command: string
        image: string
      migrations:           # Migration configuration (optional)
        tool: string
        auto: boolean

  routes:                   # HTTP routing (optional)
    - path: string
      to: string

  services: [string]        # Platform services (optional)

  dependencies:             # External service dependencies (optional)
    - name: string          # Dependency identifier
      type: string          # Template type or service class
      env: string           # Environment variable to inject with resolved URL

  env:                      # Configurable environment variables (optional)
    - name: string          # Variable name
      description: string   # Help text shown in deployment UI
      default: string       # Default value (optional)
```

**Note:** There is no `metadata.name` field. The application name is provided by the user at deploy time through the Thinkube Control UI. The platform injects it as the `APP_NAME` environment variable.

## Deployment Type

Controls how the application is deployed. Optional section; defaults to `type: app`.

### type

- `"app"` (default): Always-on Kubernetes Deployment + Service + HTTPRoute. The application runs continuously.
- `"knative"`: Knative Service with scale-to-zero capability. The application scales down to zero pods when idle and scales up on demand.

Apps are for services that must always be running (model servers, UIs, databases). Knative is for stateless processing services that can scale to zero when idle.

#### Knative Portability Constraints

Knative services are designed to be portable to cloud serverless platforms (e.g., AWS Lambda). To guarantee this portability, the following constraints are enforced when `type: knative`:

| Constraint | Reason |
|-----------|--------|
| Single container only | Serverless functions run one process |
| No `gpu` | Serverless platforms have no GPU support |
| No `mounts` | No persistent filesystem in serverless |
| No `storage` service | No POSIX mounts in serverless (database, cache, queue are allowed — they map to managed cloud services) |
| No `migrations` | No startup hooks in serverless |
| No `schedule` | Serverless uses event triggers, not cron |
| No `capabilities` | `large-uploads` exceeds serverless payload limits |
| `timeoutSeconds` ≤ 900 | Serverless platforms cap request duration at 15 minutes |

Applications that need GPU, persistent storage, multiple containers, or other advanced features must use `type: app`.

### minScale (Knative only)

Minimum number of pods. Default: `0` (scale to zero when idle). Set to `1` for services that need to be always available but still benefit from Knative auto-scaling.

### maxScale (Knative only)

Maximum number of pods. Default: `5`. Caps resource usage under load.

### containerConcurrency (Knative only)

Maximum concurrent requests per pod. Default: `0` (unlimited). Set to `1` for CPU-heavy processing (one request at a time per pod). Knative's activator queues excess requests when all pods are at capacity.

### timeoutSeconds (Knative only)

Maximum time in seconds a request can run before being terminated. Default: `300` (5 minutes). Increase for long-running operations (e.g., `600` for document processing, `1800` for heavy batch jobs).

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

### health

Health check endpoint path. Required for all containers that expose a port.

Standard value: `/health`

### mounts

Storage volume mounts. Format: `"storage-name:/mount/path"`. Storage must be declared in the `services` section.

Example: `"uploads:/data/uploads"`

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

### migrations

Database migration configuration for Python/FastAPI backends using Alembic.

```yaml
migrations:
  tool: alembic    # Currently only alembic is supported
  auto: true       # Generate migrations on deploy (default: true)
```

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

## Dependencies

External service dependencies — other deployed templates or platform services that this application needs. At deploy time, Thinkube Control resolves each dependency to a running service URL and injects it as the declared environment variable. If a dependency isn't deployed, deployment fails with a clear error.

```yaml
dependencies:
  - name: embeddings
    type: text-embeddings
    env: EMBEDDINGS_URL
  - name: ollama
    type: ollama
    env: OLLAMA_URL
```

| Field | Description |
|-------|-------------|
| `name` | Human-readable identifier, used in UI and error messages |
| `type` | Template type or service class to match against deployed services |
| `env` | Environment variable name to inject with the resolved URL |

## Environment Variables

Configurable environment variables surfaced in the Thinkube Control deployment UI. Users can override defaults at deploy time. Injected into all containers in the deployment.

```yaml
env:
  - name: GREETING
    description: "Greeting message returned by the service"
    default: "Hello from Knative!"
  - name: BATCH_SIZE
    description: "Number of items to process per batch"
    default: "8"
```

If no default is provided, the variable is required at deploy time. Dependency-wired env vars (from the `dependencies` section) take precedence over same-name entries here.

## Examples

### Minimal Application

```yaml
apiVersion: thinkube.io/v1
kind: ThinkubeDeployment

spec:
  containers:
    - name: app
      build: .
      port: 3000
      health: /health
```

### Web Application with Database

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
      test:
        enabled: true
        command: "pytest --cov=app"
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
    - name: demo
      build: .
      port: 8080
      size: small
      health: /health

  env:
    - name: GREETING
      description: "Greeting message returned by the service"
      default: "Hello from Knative!"
    - name: SIMULATE_WORK_MS
      description: "Milliseconds of simulated processing per request"
      default: "100"

  routes:
    - path: /
      to: demo
```

### ML/AI Application with GPU

```yaml
apiVersion: thinkube.io/v1
kind: ThinkubeDeployment

spec:
  containers:
    - name: inference
      build: .
      port: 7860
      size: xlarge
      health: /health
      gpu:
        count: 1
        memory: "20Gi"

  routes:
    - path: /
      to: inference
```

### Complex Multi-Container Application

```yaml
apiVersion: thinkube.io/v1
kind: ThinkubeDeployment

spec:
  containers:
    - name: api
      build: ./api
      port: 8000
      size: medium
      health: /health

    - name: webapp
      build: ./webapp
      port: 3000
      health: /health

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

### Deployment Types

- `type: app` (default): Creates Kubernetes Deployment + Service + HTTPRoute. The application runs continuously.
- `type: knative`: Creates a Knative Service with DomainMapping. The application scales to zero when idle and scales up on demand. Knative's activator queues requests when pods are scaling up.

### Health Checks

All containers with ports must expose a `/health` endpoint.

### Dependency Resolution

When dependencies are declared, Thinkube Control looks up deployed services matching the `type`, resolves the internal cluster URL, and injects it as the declared environment variable. Deployment fails with a clear error if a dependency is not found.

### TLS Certificates

HTTPS is automatically enabled using platform wildcard certificates.

### CI/CD Testing

When tests are configured:
- Tests run before container builds
- Failed tests prevent deployment
- Test results reported to Thinkube Control

## What is NOT in thinkube.yaml

These are intentionally excluded from the descriptor:

- Application name (provided at deploy time, injected as `APP_NAME` env var)
- Variable substitutions or template syntax (`{{ }}`, `{% %}`)
- Kubernetes-specific configurations (resource limits, node selectors, etc.)
- Deployment strategies (rolling update, blue-green, etc.)
- Service mesh configurations
- Command overrides (use Dockerfile `CMD`)
- Multi-region deployments

These concerns are handled by Dockerfiles (for container-level configuration) and Thinkube Control (for deployment orchestration).
