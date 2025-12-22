---
title: AI Models
description: Mirror and manage AI models with MLflow
---

The AI Models page lets you mirror pre-optimized models from HuggingFace to your MLflow model registry for local inference.

## MLflow Initialization

Before mirroring models, you must initialize MLflow by logging in through your browser. This creates your user account in MLflow and enables authentication.

If you see the "MLflow Initialization Required" banner:
1. Click "Initialize MLflow"
2. Log in with your Keycloak credentials
3. Return to this page

## Available Models

The table displays available models with:

| Column | Description |
|--------|-------------|
| **Model** | Name, description, and fine-tuned badge if applicable |
| **Size** | Model size (e.g., 7B, 20B) |
| **Quantization** | Quantization format (e.g., FP16, AWQ, INT8) |
| **Server Type** | Compatible inference servers (TensorRT-LLM, TEI, etc.) |
| **Status** | Current mirror status |

## Model Status

| Status | Description |
|--------|-------------|
| **Registered** | Fine-tuned model ready to use |
| **Mirrored** | Model downloaded and available in MLflow |
| **Mirroring** | Download in progress |
| **Pending** | Mirror job queued |
| **Failed** | Mirror job failed |
| **Not Mirrored** | Model not yet downloaded |

## Mirroring Models

1. Find the model you want in the table
2. Click "Mirror" to start the download
3. Click "Monitor" to watch progress in Argo Workflows
4. Once complete, the model is available for deployment

## Actions

| Action | Description |
|--------|-------------|
| **Mirror** | Start downloading the model to MLflow |
| **Monitor** | View download progress in Argo Workflows |
| **Retry** | Retry a failed mirror operation |
| **Reset** | Clear the mirror job status |
| **Delete** | Remove model from MLflow (allows re-download) |

## Fine-tuned Models

Models you fine-tune in JupyterHub appear automatically with the "Fine-tuned" badge. These models are already registered in MLflow and show as "Registered" status.

## Using Mirrored Models

Once mirrored, deploy models using templates:
- **tkt-tensorrt-llm-harmony** - For LLM models with TensorRT-LLM
- **tkt-text-embeddings** - For embedding models with TEI

See [Templates](/thinkube-control/templates/) for deployment instructions.
