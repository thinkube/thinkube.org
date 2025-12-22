---
title: Template Manifest Spec
description: manifest.yaml specification reference
---

The `manifest.yaml` file defines template metadata and parameters. Located in the root of each template repository.

## Schema

```yaml
apiVersion: thinkube.io/v1
kind: TemplateManifest
metadata:
  name: string          # Template identifier (lowercase-hyphenated)
  title: string         # Human-readable title
  description: string   # What this template provides
  tags: [string]        # Categories for discovery

parameters: []          # Additional parameters (usually 0-2)
secrets: []             # Required secrets for the application
```

## Standard Parameters

These are automatically available in every template (do not define in manifest.yaml):

| Parameter | Description |
|-----------|-------------|
| `project_name` | Application name (lowercase-hyphenated) |
| `project_description` | Brief description |
| `author_name` | Developer name |
| `author_email` | Developer email |

## Parameter Types

### bool

Yes/No decisions:

```yaml
- name: enable_websockets
  type: bool
  description: Include WebSocket support?
  default: false
```

### str

Text input with optional validation:

```yaml
- name: api_prefix
  type: str
  description: API route prefix
  default: "/api/v1"
  pattern: "^/[a-zA-Z][a-zA-Z0-9/_-]*$"
```

### int

Numeric values with optional bounds:

```yaml
- name: worker_count
  type: int
  description: Number of worker processes
  default: 4
  min: 1
  max: 16
```

### choice

Selection from static options:

```yaml
- name: auth_provider
  type: choice
  description: Authentication provider
  choices: ["keycloak", "auth0"]
  default: "keycloak"
```

Dynamic choices from model catalog:

```yaml
- name: model_id
  type: choice
  description: Select a downloaded model
  dynamic_source: "model_catalog"
  filter:
    server_type: "tensorrt"
    is_downloaded: true
  default: "nvidia/Phi-4-multimodal-instruct-FP4"
```

## Secrets

Declare required API keys and credentials:

```yaml
secrets:
  - name: OPENAI_API_KEY
    description: OpenAI API key for GPT models
    required: true

  - name: SLACK_WEBHOOK_URL
    description: Slack webhook for notifications
    required: false
```

### How Secrets Work

1. **Declaration**: Templates declare secrets in manifest.yaml
2. **Management**: Admins add secrets through Thinkube Control UI
3. **Injection**: Secrets are created as Kubernetes Secrets and mounted via `envFrom`
4. **Access**: Applications read secrets as environment variables

### Security

- Encrypted at rest using Fernet symmetric encryption
- Each application only gets its declared secrets
- Never exposed in Git repositories or logs
- Requires authentication to access

## Parameter Guidelines

### When to Add a Parameter

- Fundamentally changes template structure
- Affects 5+ files when toggled
- Adds/removes major dependencies
- Security boundary decision

### When NOT to Add a Parameter

- Version selections (be opinionated)
- Style/theme preferences
- Performance tuning values
- Runtime configuration
- Feature flags (add in code)

## Examples

### Simple Template (No Parameters)

```yaml
apiVersion: thinkube.io/v1
kind: TemplateManifest
metadata:
  name: fastapi-crud
  title: FastAPI CRUD API
  description: REST API with PostgreSQL and CRUD operations
  tags: ["api", "database", "crud", "rest"]

parameters: []
```

### AI Template (One Parameter + Secret)

```yaml
apiVersion: thinkube.io/v1
kind: TemplateManifest
metadata:
  name: ai-chatbot
  title: AI Chatbot Interface
  description: Chat interface for LLM interactions
  tags: ["ai", "chat", "llm", "webapp"]

parameters:
  - name: enable_history
    type: bool
    description: Store conversation history in database?
    default: true

secrets:
  - name: ANTHROPIC_API_KEY
    description: Anthropic API key for Claude models
    required: true
```

### Inference Template (Dynamic Model Selection)

```yaml
apiVersion: thinkube.io/v1
kind: TemplateManifest
metadata:
  name: tensorrt-inference
  title: TensorRT-LLM Inference Server
  description: High-performance LLM inference with TensorRT
  tags: ["ai", "llm", "tensorrt", "inference", "gpu"]

parameters:
  - name: model_id
    type: choice
    description: Select a model from the catalog
    dynamic_source: "model_catalog"
    filter:
      server_type: "tensorrt"
      is_downloaded: true

secrets:
  - name: HF_TOKEN
    description: Hugging Face token for gated models
    required: false
```

## Anti-Patterns

### Too Many Parameters

```yaml
# DON'T do this
parameters:
  - name: python_version      # Be opinionated!
  - name: database_type       # Pick one!
  - name: frontend_framework  # Separate templates!
  - name: enable_redis        # Just include it!
  - name: api_rate_limit      # Runtime config!
```

### Configuration Parameters

```yaml
# DON'T do this - use config files or env vars
parameters:
  - name: max_upload_size
  - name: session_timeout
  - name: smtp_server
```
