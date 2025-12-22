---
id: components-overview
title: Components Overview
sidebar_label: Overview
sidebar_position: 1
---

Thinkube provides pre-configured components organized into core (always installed) and optional services.

## Core Components

### Infrastructure
- **Kubernetes (k8s-snap)**: Canonical's production-grade Kubernetes
- **Ingress Controller**: NGINX-based traffic routing
- **ACME Certificates**: Automatic TLS via Let's Encrypt
- **CoreDNS**: Internal and external DNS resolution

### Development Tools
- **Code Server**: Web-based VS Code IDE
- **Gitea**: Self-hosted Git service
- **ArgoCD**: GitOps continuous deployment
- **Harbor**: Container registry
- **Argo Workflows**: Workflow orchestration

### Storage
- **SeaweedFS**: S3-compatible distributed object storage
- **JuiceFS**: POSIX-compatible distributed filesystem
- **PostgreSQL**: Relational database with high availability

### Platform Services
- **Keycloak**: Identity and access management (SSO/OAuth2)
- **Thinkube Control**: Central management UI
- **JupyterHub**: Multi-user notebook server
- **MLflow**: ML experiment tracking and model registry
- **DevPi**: Python package server

### GPU Support
- **NVIDIA GPU Operator**: Automatic GPU driver and runtime management

## Optional Components

### AI/ML Services
- **LiteLLM**: LLM gateway for routing to local models
- **Ollama**: Local LLM inference server
- **Langfuse**: LLM observability and prompt management
- **Argilla**: Data labeling for NLP
- **CVAT**: Computer vision annotation tool

### Vector Databases
- **Qdrant**: Vector similarity search
- **Weaviate**: Vector search engine
- **Chroma**: Embedding database

### Data Services
- **ClickHouse**: Column-oriented analytics database
- **OpenSearch**: Search and analytics engine
- **Valkey**: In-memory data store (Redis-compatible)
- **NATS**: Cloud-native messaging

### Monitoring
- **Prometheus**: Metrics collection
- **Perses**: Dashboard visualization (Grafana alternative)

### Utilities
- **PgAdmin**: PostgreSQL administration
- **Knative**: Serverless workloads

## Deployment

Core components are installed automatically during Thinkube setup. Optional components can be enabled via the Thinkube Control UI or Ansible playbooks:

```bash
# Via Ansible (from /tmp/thinkube-installer)
ANSIBLE_BECOME_PASSWORD='password' ~/.venv/bin/ansible-playbook \
  -i inventory/inventory.yaml \
  ansible/40_thinkube/optional/SERVICE_NAME/00_install.yaml
```

## Component Features

All components include:
- Pre-configured best practices
- Automatic TLS encryption via ACME
- Keycloak SSO integration
- Prometheus metrics export
- Persistent storage on JuiceFS/SeaweedFS

## Next Steps

- [Architecture Overview](/architecture/) - Understand how components integrate
- [Installation Guide](/installation/overview/) - Deploy Thinkube
- [Learning Paths](/learn/overview/) - Tutorials for common use cases
