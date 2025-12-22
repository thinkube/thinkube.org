---
title: Optional Components
description: Extend Thinkube with AI, data, and infrastructure services
---

Optional Components lets you extend your Thinkube installation with additional services. Each component is installed via Ansible playbooks and integrates with the platform's SSO and networking.

## AI & Machine Learning

Components for building and operating AI applications.

### Vector Databases

Store and search embeddings for RAG (Retrieval-Augmented Generation) applications.

| Component | Description | AI Lifecycle Role |
|-----------|-------------|-------------------|
| **Qdrant** | High-performance vector database optimized for similarity search | Store document embeddings for RAG, semantic search, and recommendation systems |
| **Weaviate** | Vector database with GraphQL API and built-in vectorization modules | RAG applications needing schema-based vector storage with hybrid search |
| **Chroma** | Lightweight embedding database with simple Python API | Quick prototyping of RAG pipelines in JupyterHub |

### LLM Infrastructure

Services for running and managing large language models.

| Component | Description | AI Lifecycle Role |
|-----------|-------------|-------------------|
| **LiteLLM** | Unified API proxy for multiple LLM providers with cost tracking and rate limiting | Route requests to local models (TensorRT-LLM, Ollama) through a single OpenAI-compatible endpoint |
| **Ollama** | Local LLM inference server with GPU acceleration | Run smaller models locally for development and testing before deploying optimized TensorRT versions |
| **Langfuse** | LLM observability platform for tracing, monitoring, and evaluating AI applications | Debug prompts, track token usage, measure response quality, and identify performance bottlenecks |

### Data Annotation

Tools for creating training datasets.

| Component | Description | AI Lifecycle Role |
|-----------|-------------|-------------------|
| **Argilla** | NLP/LLM data annotation and curation platform | Label training data, curate RLHF datasets, and evaluate model outputs for fine-tuning |

## Data & Storage

Databases and caches for application data.

| Component | Description | Use Case |
|-----------|-------------|----------|
| **OpenSearch** | Distributed search and analytics engine | Full-text search, log aggregation, and analytics dashboards |
| **ClickHouse** | Real-time analytics database for OLAP workloads | Store and query large volumes of telemetry, metrics, and event data |
| **Valkey** | Redis-compatible in-memory data store | Caching, session storage, and real-time leaderboards |
| **PgAdmin** | Web-based PostgreSQL administration tool | Manage application databases, run queries, and monitor performance |

## Monitoring & Observability

Tools for understanding system behavior.

| Component | Description | Use Case |
|-----------|-------------|----------|
| **Prometheus** | Metrics collection and time-series database | Collect GPU utilization, inference latency, and application metrics |
| **Perses** | Dashboard visualization platform | Create dashboards for monitoring AI workloads and cluster health |

## Infrastructure & Platform

Core platform capabilities.

| Component | Description | Use Case |
|-----------|-------------|----------|
| **Knative** | Serverless platform for Kubernetes | Scale-to-zero inference endpoints, event-driven model serving |
| **NATS** | High-performance messaging system with JetStream | Pub/sub messaging for multi-agent systems, event-driven AI pipelines |

## Installation

Each component card shows:
- **Status** - Installed or not installed
- **Requirements** - Other components that must be installed first

To install:
1. Ensure all requirements are met (listed on the card)
2. Click "Install"
3. Monitor progress in the terminal output

Installation runs Ansible playbooks that configure the component, create Kubernetes resources, and integrate with Keycloak SSO.

## Component Dependencies

Some components require others to be installed first:

| Component | Requirements |
|-----------|--------------|
| Perses | Keycloak, Prometheus |
| PgAdmin | PostgreSQL, Keycloak |
| Weaviate | Harbor |
| Chroma | Harbor |
| LiteLLM | Harbor, Keycloak, PostgreSQL, SeaweedFS |
| Argilla | Harbor, Keycloak, OpenSearch, Valkey |
| Langfuse | PostgreSQL, Keycloak, ClickHouse, Valkey |
| Ollama | Harbor |

Core platform services (Keycloak, Harbor, PostgreSQL, SeaweedFS) are always available as they're part of the base installation.
