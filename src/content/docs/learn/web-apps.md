---
title: Web Applications
description: Build and deploy web applications on Thinkube
---

Deploy web applications from templates - just pick a template, name your app, and Thinkube handles the rest.

## How It Works

1. **Pick a template** - Choose from available templates (e.g., Vue + FastAPI)
2. **Provide basic info** - App name, domain
3. **Deploy** - Thinkube creates your project and starts the CI/CD pipeline
4. **Customize** - Modify the generated code for your needs

That's it. No Kubernetes knowledge required.

## Deploying Your First App

### From Thinkube Control

1. Open `https://control.example.com`
2. Click **Deploy Application**
3. Select a template (e.g., `tkt-webapp-vue-fastapi`)
4. Enter:
   - **App name**: `my-project`
   - **Domain**: `example.com`
5. Click **Deploy**

Thinkube automatically:
- Creates your project with all files
- Pushes to Gitea (your self-hosted Git)
- Builds container images via Argo Workflows
- Deploys via ArgoCD

**Time: 2-10 minutes** for the initial build.

### Accessing Your App

Once deployed:
- **Your app**: `https://my-project.example.com`
- **Your code**: `https://gitea.example.com/thinkube-deployments/my-project`

## Available Templates

| Template | Description |
|----------|-------------|
| `tkt-webapp-vue-fastapi` | Vue.js frontend + FastAPI backend + PostgreSQL |
| `tkt-vllm-gradio` | LLM inference with Gradio UI (GPU) |
| `tkt-stable-diffusion` | Image generation with Stable Diffusion (GPU) |
| `tkt-text-embeddings` | Text embeddings service (GPU) |

## Modifying Your App

After deployment, your code lives in Gitea. To make changes:

### Option 1: Code Server (Browser-based)

1. Open `https://code.example.com`
2. Navigate to your project in `/home/thinkube/shared-code/my-project`
3. Edit files
4. Commit and push - automatic rebuild and deploy

### Option 2: Clone Locally

```bash
git clone https://gitea.example.com/thinkube-deployments/my-project.git
cd my-project

# Make your changes
# ...

# Push to trigger rebuild
git push
```

Every push triggers the CI/CD pipeline automatically.

## Monitoring

- **Build progress**: `https://argo.example.com` (Argo Workflows)
- **Deployment status**: `https://argocd.example.com` (ArgoCD)
- **CI/CD pipeline**: Thinkube Control UI

## Next Steps

- [AI & Machine Learning](/learn/ai-ml/) - Deploy GPU-powered AI apps
- [GitOps & Automation](/learn/devops/) - Understand the automation
- [Components](/components/) - See all available services
