---
id: components-overview
title: Components Overview
sidebar_label: Overview
sidebar_position: 1
---

# Thinkube Components

Thinkube provides a comprehensive set of pre-configured components for building modern applications.

## Core Components

### Infrastructure
- **MicroK8s**: Lightweight Kubernetes distribution
- **Ingress Controller**: NGINX-based traffic routing
- **Cert Manager**: Automatic TLS certificate management
- **CoreDNS**: Internal DNS resolution

### Development Tools
- **Code Server**: Web-based VS Code IDE
- **Gitea**: Self-hosted Git service
- **ArgoCD**: GitOps continuous deployment
- **Harbor**: Container registry

### Databases
- **PostgreSQL**: Relational database with high availability
- **Redis**: In-memory data store
- **MongoDB**: Document database
- **Elasticsearch**: Search and analytics engine

### Monitoring & Logging
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Loki**: Log aggregation
- **Jaeger**: Distributed tracing

## AI/ML Components

### Notebooks & IDEs
- **JupyterHub**: Multi-user notebook server
- **RStudio**: Statistical computing environment
- **Zeppelin**: Data analytics notebook

### ML Platforms
- **MLflow**: ML lifecycle management
- **Kubeflow**: Machine learning workflows
- **Ray**: Distributed AI computing

### Vector Databases
- **Weaviate**: Vector search engine
- **Qdrant**: Neural search engine
- **Milvus**: Vector similarity search

## Application Services

### Message Queues
- **RabbitMQ**: Message broker
- **Kafka**: Event streaming platform
- **NATS**: Cloud-native messaging

### Storage
- **MinIO**: S3-compatible object storage
- **Longhorn**: Distributed block storage
- **NFS**: Network file system

### Security
- **Keycloak**: Identity and access management
- **Vault**: Secrets management
- **Falco**: Runtime security

## Quick Deploy

Each component can be deployed with a simple command:

```bash
# Deploy PostgreSQL
thinkube deploy postgresql

# Deploy with custom configuration
thinkube deploy postgresql --values custom-values.yaml
```

## Component Templates

All components come with:
- Pre-configured best practices
- Automatic TLS encryption
- Monitoring integration
- Backup strategies
- High availability options

## Next Steps

- [Deploy Your First Component](/docs/tutorials/deploy-component)
- [Custom Configuration](/docs/guides/configuration)
- [Component Integration](/docs/guides/integration)