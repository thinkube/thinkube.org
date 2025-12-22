---
title: Dashboard
description: Monitor and manage all platform services
---

The Dashboard is your central view of all platform services. Monitor health, manage service state, and track GPU utilization.

## Service Overview

The dashboard displays all services organized by category:
- **Core** - Essential platform services (Gitea, Harbor, ArgoCD, etc.)
- **AI/ML** - AI and machine learning services (Ollama, vLLM, JupyterHub, etc.)
- **Databases** - Data storage services (PostgreSQL, Valkey, ClickHouse, etc.)
- **Monitoring** - Observability services (Prometheus, Perses, Langfuse, etc.)

## Service Cards

Each service card shows:
- **Status indicator** - Healthy (green), unhealthy (red), or disabled (gray)
- **Service name and description**
- **Quick actions** - Open, restart, enable/disable
- **Health check button** - Trigger manual health check

## Favorites

Star services to add them to your favorites view. Favorites appear on the main dashboard and can be reordered with drag-and-drop.

## GPU Metrics

Real-time GPU utilization displayed at the top of the dashboard:
- GPU memory usage
- GPU compute utilization
- Temperature
- Per-GPU breakdown for multi-GPU systems

## Service Actions

### Health Check
Click the health check button to verify a service is responding. Shows response time and any error messages.

### Restart
Restart a service that's misbehaving. Requires confirmation to prevent accidental restarts.

### Enable/Disable
Toggle services on or off. Disabled services don't consume resources but remain configured for easy re-enablement.

### View Details
Click a service card to see detailed information:
- Pod status and logs
- Resource usage
- Configuration
- Connected services

## Compact Mode

Toggle compact mode to show more services on screen with smaller cards - useful for monitoring many services at once.

## Sync Services

Click "Sync Services" to refresh the service list from Kubernetes. Use this after deploying new services or if the dashboard seems out of date.
