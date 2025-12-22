---
title: Template Variables Spec
description: Variables available in Thinkube templates
---

This reference documents all variables available to templates during Copier processing.

## Variable Categories

### Standard Parameters

Provided for every template deployment:

| Variable | Description | Example |
|----------|-------------|---------|
| `project_name` | Application name (lowercase-hyphenated) | `my-app` |
| `project_description` | Brief description | `My awesome application` |
| `author_name` | Developer/deployer name | `John Doe` |
| `author_email` | Developer/deployer email | `john@example.com` |

### Domain Variables

Installation-specific values from the platform:

| Variable | Description | Example |
|----------|-------------|---------|
| `domain_name` | Platform domain | `thinkube.com` |
| `container_registry` | Harbor registry URL | `registry.thinkube.com` |
| `admin_username` | Platform admin username | `tkadmin` |

### Template-Specific Parameters

Additional parameters defined in `manifest.yaml` become available as variables.

## Usage Examples

### Python Code (.py.jinja)

```python
# server.py.jinja
APP_NAME = "{{ project_name }}"
APP_DESCRIPTION = "{{ project_description }}"
DOMAIN = "{{ domain_name }}"
AUTHOR = "{{ author_name }} <{{ author_email }}>"
```

### Dockerfiles (.Dockerfile.jinja)

```dockerfile
# Dockerfile.jinja
FROM {{ container_registry }}/library/python:3.12-slim
LABEL maintainer="{{ author_name }} <{{ author_email }}>"
LABEL description="{{ project_description }}"
```

### YAML Files (.yaml.jinja)

```yaml
# config.yaml.jinja
app:
  name: {{ project_name }}
  host: {{ project_name }}.{{ domain_name }}
  registry: {{ container_registry }}
```

### Markdown (.md.jinja)

```markdown
# {{ project_name }}

{{ project_description }}

## Author
{{ author_name }} ({{ author_email }})

## Access
https://{{ project_name }}.{{ domain_name }}
```

## Important Rules

### Only .jinja Files Are Processed

Files without the `.jinja` extension are copied as-is without variable substitution.

| File | Processed? |
|------|------------|
| `main.py.jinja` | Yes - becomes `main.py` |
| `main.py` | No - copied unchanged |
| `Dockerfile.jinja` | Yes - becomes `Dockerfile` |
| `Dockerfile` | No - copied unchanged |

### thinkube.yaml is Static

The deployment descriptor does **not** support Jinja2 templates except for one substitution:

| Allowed | Not Allowed |
|---------|-------------|
| `{{ project_name }}` in metadata.name | Any other variable |

```yaml
# thinkube.yaml - CORRECT
metadata:
  name: "{{ project_name }}"  # OK

# thinkube.yaml - WRONG
spec:
  containers:
    - image: {{ container_registry }}/...  # NOT ALLOWED
```

### Variable Names Are Case-Sensitive

Use exact names as documented:

| Correct | Incorrect |
|---------|-----------|
| `{{ container_registry }}` | `{{ harbor_registry }}` |
| `{{ domain_name }}` | `{{ domain }}` |
| `{{ project_name }}` | `{{ projectName }}` |

### No Custom Variables

Only the documented variables are available. You cannot define your own variables outside of manifest.yaml parameters.

## Common Mistakes

### Wrong Variable Names

```python
# WRONG
registry = "{{ harbor_registry }}"
domain = "{{ domain }}"

# CORRECT
registry = "{{ container_registry }}"
domain = "{{ domain_name }}"
```

### Variables in thinkube.yaml

```yaml
# WRONG - thinkube.yaml doesn't support these
spec:
  containers:
    - name: backend
      image: {{ container_registry }}/{{ project_name }}/backend

# CORRECT - Use Dockerfile.jinja instead
# In Dockerfile.jinja:
FROM {{ container_registry }}/library/python:3.12-slim
```

### Missing .jinja Extension

```
# WRONG - File won't be processed
config.yaml          # Variables like {{ domain_name }} stay as literal text

# CORRECT - File will be processed
config.yaml.jinja    # Variables are substituted, output is config.yaml
```
