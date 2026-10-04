---
title: CLI Tools in Code Server
description: Pre-configured command-line tools and Python SDKs available in your Thinkube development environment.
---

Every Thinkube Code Server comes with CLI tools and Python SDKs pre-configured to talk to platform services. Credentials and endpoints are set up automatically — open a terminal and start using them.

## Quick check

Run the built-in test to verify everything is working:

```bash
# Bash / Zsh
./test-cli-tools.sh

# Fish
fish test-cli-tools.fish

# Verbose mode (show full output on failure)
./test-cli-tools.sh -v
```

## Environment variables

All service credentials are injected as environment variables. They're sourced automatically when you open a terminal.

```bash
# See all service variables
cat ~/.config/thinkube/service-env-cs.sh
```

Variables are managed by the platform — when you install or remove optional components, the environment is updated automatically.

---

## Core tools

These are always available in every Code Server instance.

### Kubernetes

```bash
# Cluster info
kubectl cluster-info
kubectl get pods -A

# Interactive dashboard (terminal UI)
k9s
```

### Git and GitHub

```bash
# Git is pre-configured with your username and email
git config --get user.name

# GitHub CLI — authenticated
gh repo list
gh pr list

# Gitea CLI (internal Git server)
tea repo list
```

### ArgoCD and Argo Workflows

```bash
# ArgoCD — GitOps deployments
argocd app list
argocd app get <app-name>

# Argo Workflows — CI/CD pipelines
argo list -n argo
argo get -n argo <workflow-name>
```

### Harbor container registry

```bash
# Registry is pre-configured for podman/docker
# Pull images directly
podman pull registry.thinkube.com/library/python:3.12

# Copy images between registries
crane copy source/image:tag registry.thinkube.com/library/image:tag
```

### DevPI (Python package index)

```bash
# pip and uv are configured to use the internal DevPI mirror
pip install <package>
uv pip install <package>

# DevPI CLI for managing packages
devpi use $DEVPI_URL
devpi login $DEVPI_USERNAME --password=$DEVPI_PASSWORD
devpi use $DEVPI_INDEX
```

### PostgreSQL

```python
import psycopg2, os
conn = psycopg2.connect(
    host=os.environ["POSTGRES_HOST"],
    port=os.environ.get("POSTGRES_PORT", 5432),
    database=os.environ["POSTGRES_DB"],
    user=os.environ["POSTGRES_USER"],
    password=os.environ["POSTGRES_PASSWORD"],
)
```

Or from the command line:

```bash
psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB
```

### SeaweedFS (S3-compatible storage)

```python
import boto3, os
s3 = boto3.client(
    "s3",
    endpoint_url=os.environ["SEAWEEDFS_S3_ENDPOINT"],
    aws_access_key_id=os.environ["SEAWEEDFS_ACCESS_KEY"],
    aws_secret_access_key=os.environ["SEAWEEDFS_SECRET_KEY"],
    verify=False,
)
s3.list_buckets()
```

---

## Optional data services

Available when the corresponding component is installed via the Control Panel.

### Valkey (Redis-compatible cache)

```python
import redis, os
r = redis.Redis(
    host=os.environ["VALKEY_HOST"],
    port=int(os.environ.get("VALKEY_PORT", 6379)),
    password=os.environ.get("VALKEY_PASSWORD", ""),
    decode_responses=True,
)
r.ping()
r.set("key", "value")
r.get("key")
```

Or with `redis-cli`:

```bash
redis-cli -h $VALKEY_HOST -p $VALKEY_PORT -a $VALKEY_PASSWORD
```

### Qdrant (vector database)

```python
from qdrant_client import QdrantClient
import os

client = QdrantClient(
    url=os.environ["QDRANT_URL"],
    port=443,
    https=True,
    verify=False,
)
client.get_collections()
```

### ClickHouse (analytics database)

```python
import clickhouse_connect, os
client = clickhouse_connect.get_client(
    host=os.environ["CLICKHOUSE_HOST"],
    port=int(os.environ.get("CLICKHOUSE_HTTP_PORT", 443)),
    username=os.environ["CLICKHOUSE_USER"],
    password=os.environ["CLICKHOUSE_PASSWORD"],
    secure=True,
    verify=False,
)
result = client.query("SELECT 1")
```

### NATS (messaging)

```python
import nats, asyncio, os

async def main():
    nc = await nats.connect(os.environ["NATS_URL"], tls=None)
    await nc.publish("my.subject", b"hello")
    await nc.close()

asyncio.run(main())
```

Or with the `nats` CLI:

```bash
nats pub my.subject "hello" --server $NATS_URL
nats sub my.subject --server $NATS_URL
```

### Chroma (vector database)

```python
import chromadb, os

client = chromadb.HttpClient(
    host=os.environ["CHROMA_API_URL"].replace("https://", "").replace("http://", ""),
    port=443,
    ssl=True,
    headers={"X-Chroma-Token": os.environ["CHROMA_AUTH_TOKEN"]},
)
client.heartbeat()
```

### OpenSearch (search and analytics)

```python
from opensearchpy import OpenSearch
import os

client = OpenSearch(
    [os.environ["OPENSEARCH_URL"]],
    http_auth=(os.environ["OPENSEARCH_USER"], os.environ["OPENSEARCH_PASSWORD"]),
    use_ssl=True,
    verify_certs=False,
)
client.info()
```

### Weaviate (vector database)

```python
import weaviate
from weaviate.auth import AuthApiKey
import os

client = weaviate.connect_to_weaviate_cloud(
    cluster_url=os.environ["WEAVIATE_URL"],
    auth_credentials=AuthApiKey(os.environ["WEAVIATE_API_KEY"]),
    skip_init_checks=True,
)
client.is_ready()
client.close()
```

---

## Optional ML/AI services

### Argilla (data annotation)

```python
import argilla, os

client = argilla.Argilla(
    api_url=os.environ["ARGILLA_API_URL"],
    api_key=os.environ["ARGILLA_API_KEY"],
)
print(client.me.username)
```

### MLflow (experiment tracking)

MLflow requires a one-time browser login to initialize your user. Visit your MLflow URL and log in with Keycloak, then:

```bash
# Get an authentication token
source ~/mlflow-auth.sh
```

```python
import mlflow

mlflow.set_tracking_uri(os.environ["MLFLOW_TRACKING_URI"])
mlflow.search_experiments()
```

### LiteLLM (LLM gateway)

```bash
# Health check
curl -sk -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  $LITELLM_ENDPOINT/health

# List available models
curl -sk -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  $LITELLM_ENDPOINT/v1/models
```

Use it as an OpenAI-compatible endpoint in any SDK:

```python
from openai import OpenAI

client = OpenAI(
    base_url=os.environ["LITELLM_ENDPOINT"] + "/v1",
    api_key=os.environ["LITELLM_MASTER_KEY"],
)
```

### Langfuse (LLM observability)

```python
from langfuse import Langfuse
import configparser

config = configparser.ConfigParser()
config.read("~/.langfuse/credentials")

langfuse = Langfuse(
    public_key=config["langfuse"]["public_key"],
    secret_key=config["langfuse"]["secret_key"],
    host=config["langfuse"]["host"],
)
langfuse.auth_check()
```

Or use the environment variables directly:

```python
from langfuse import Langfuse
import os

langfuse = Langfuse(
    public_key=os.environ["LANGFUSE_PUBLIC_KEY"],
    secret_key=os.environ["LANGFUSE_SECRET_KEY"],
    host=os.environ["LANGFUSE_HOST"],
)
```

### Perses (observability dashboards)

```bash
# Login
percli login $PERSES_URL --insecure-skip-tls-verify \
  -u $PERSES_USER -p $PERSES_PASSWORD

# List dashboards
percli get dashboards --project gpu
```

### CVAT (computer vision annotation)

```bash
cvat-cli --server-host $CVAT_API_URL \
  --auth "$CVAT_USERNAME:$CVAT_PASSWORD" \
  task ls
```

---

## Environment variable reference

### Core services

| Variable | Description |
|----------|-------------|
| `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | PostgreSQL connection |
| `SEAWEEDFS_S3_ENDPOINT`, `SEAWEEDFS_ACCESS_KEY`, `SEAWEEDFS_SECRET_KEY` | S3-compatible storage |
| `DEVPI_URL`, `DEVPI_INDEX`, `DEVPI_USERNAME`, `DEVPI_PASSWORD` | Python package index |
| `GITEA_URL` | Internal Git server |
| `ARGO_WEB_URL`, `ARGO_GRPC_URL`, `ARGO_NAMESPACE` | Argo Workflows |
| `ARGOCD_WEB_URL`, `ARGOCD_GRPC_URL` | ArgoCD |
| `MLFLOW_TRACKING_URI`, `MLFLOW_AUTH_USERNAME`, `MLFLOW_AUTH_PASSWORD` | MLflow tracking |

### Optional data services

| Variable | Description |
|----------|-------------|
| `VALKEY_HOST`, `VALKEY_PORT`, `VALKEY_PASSWORD` | Redis-compatible cache |
| `QDRANT_URL` | Qdrant vector database |
| `CLICKHOUSE_HOST`, `CLICKHOUSE_HTTP_PORT`, `CLICKHOUSE_USER`, `CLICKHOUSE_PASSWORD`, `CLICKHOUSE_URL` | ClickHouse analytics |
| `NATS_URL` | NATS messaging |
| `CHROMA_API_URL`, `CHROMA_AUTH_TOKEN` | Chroma vector database |
| `OPENSEARCH_URL`, `OPENSEARCH_HOST`, `OPENSEARCH_PORT`, `OPENSEARCH_USER`, `OPENSEARCH_PASSWORD` | OpenSearch |
| `WEAVIATE_URL`, `WEAVIATE_GRPC_URL`, `WEAVIATE_API_KEY` | Weaviate vector database |

### Optional ML/AI services

| Variable | Description |
|----------|-------------|
| `ARGILLA_API_URL`, `ARGILLA_API_KEY` | Argilla annotation |
| `LITELLM_ENDPOINT`, `LITELLM_MASTER_KEY` | LLM gateway |
| `LANGFUSE_HOST`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY` | LLM observability |
| `PERSES_URL`, `PERSES_USER`, `PERSES_PASSWORD` | Perses dashboards |
| `PROMETHEUS_URL`, `ALERTMANAGER_URL` | Monitoring |
