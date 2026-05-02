---
title: Unlock AI Models
description: Create a Hugging Face token for accessing AI models
---

Thinkube uses Hugging Face to download AI models for local inference, including LLMs, embedding models, and other ML components.

## Why Hugging Face Token is Required

- **Model Access**: Download models like Llama, Mistral, and embedding models
- **Gated Models**: Access models that require agreement to terms of use
- **Rate Limits**: Authenticated requests have higher rate limits
- **Private Models**: Access your private or organization models

## Step 1: Create Account

1. Go to [huggingface.co](https://huggingface.co)
2. Click **Sign Up** and create a free account

## Step 2: Create Access Token

1. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Click **New token**
3. Name it `Thinkube`
4. Select **Read** access (sufficient for downloading models)
5. Click **Generate token**
6. **Copy the token immediately**

## Step 3: Accept Model Licenses

Some models require accepting their license before downloading:

1. Visit the model page (e.g., [meta-llama/Llama-3.2-3B](https://huggingface.co/meta-llama/Llama-3.2-3B))
2. Click **Agree and access repository**
3. Repeat for any gated models you plan to use

## What You Need for Installation

| Item | Example | Where to Find |
|------|---------|---------------|
| Access Token | `hf_xxxxxxxxxxxx` | Settings → Access Tokens |

## How It's Used

Thinkube stores your token and uses it to:
- Download LLM models for local inference (Ollama, vLLM)
- Pull embedding models for RAG pipelines
- Access model weights during container builds

## Next Steps

Once you have your Hugging Face token:
1. Continue with the [Thinkube installation](./overview)
2. The installer will prompt for your token during setup
