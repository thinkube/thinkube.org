---
title: GitOps & Automation
description: Understand how Thinkube automates deployments
---

Learn how Thinkube's GitOps architecture automatically builds and deploys your applications.

## The Automation Stack

Thinkube uses an Argo-based toolchain:

| Component | Role |
|-----------|------|
| **Gitea** | Self-hosted Git repositories |
| **Argo Workflows** | CI/CD pipeline orchestration |
| **Kaniko** | Container image building (no Docker daemon) |
| **Harbor** | Container image registry |
| **ArgoCD** | GitOps deployment to Kubernetes |

## How It Works

When you push code to Gitea, the automation chain triggers:

```
Git Push → Argo Workflow → Kaniko Build → Harbor → ArgoCD → Running App
```

### Step by Step

1. **Git Push** - You push to `gitea.example.com/thinkube-deployments/my-app`
2. **Webhook Fires** - Gitea notifies Argo Workflows
3. **Tests Run** - If enabled, tests execute in containers
4. **Kaniko Builds** - Container images are built in-cluster (no Docker needed)
5. **Harbor Stores** - Images push to `registry.example.com/thinkube/my-app`
6. **Git Updated** - Webhook adapter updates the deployment manifest in Git
7. **ArgoCD Syncs** - Detects the Git change and deploys new images

**Total time: 2-20 minutes** depending on build complexity.

## Viewing Your Pipelines

### Argo Workflows

Access `https://argo.example.com` to see:
- Running and completed workflows
- Build logs for each step
- Test results

### ArgoCD

Access `https://argocd.example.com` to see:
- Application sync status
- Deployed resources
- Sync history

### Thinkube Control

The CI/CD dashboard shows the complete pipeline with all stages in one view.

## The GitOps Model

All deployments are driven by Git:

- **Gitea** stores your application code and Kubernetes manifests
- **ArgoCD** watches Git and applies changes to the cluster
- **No manual kubectl** - everything flows through Git

### Benefits

- **Audit trail** - Every change is a Git commit
- **Rollback** - Revert to any previous commit
- **Reproducible** - Git is the source of truth

## Monitoring (Optional)

Enable optional monitoring components:

| Component | Purpose |
|-----------|---------|
| **Prometheus** | Metrics collection |
| **Perses** | Dashboard visualization |

## Next Steps

- [Web Applications](/learn/web-apps/) - Deploy your first app
- [AI & Machine Learning](/learn/ai-ml/) - GPU workloads
- [Components](/components/) - All available services
