---
title: Control Panel
description: Central dashboard for managing your Thinkube platform
---

Thinkube Control is the central management interface for your entire platform. It provides a unified dashboard to monitor services, deploy applications, manage your container registry, and configure your infrastructure.

## Features

### [Dashboard](./dashboard)
Monitor all platform services in one place. View service health, GPU utilization, and system status. Enable, disable, or restart services. Organize favorites with drag-and-drop.

### [Templates](./templates)
Deploy applications with one click. Browse available templates, provide a project name, and watch the deployment in real-time. No Kubernetes knowledge required.

### [Container Registry](./registry)
Manage your Harbor container registry. View images, check build status, and manage repositories.

### [AI Models](./models)
Integration with MLflow model registry. Browse registered models, view versions, and deploy models to inference endpoints.

### [Optional Components](./components)
Install and configure additional platform services. Enable vector databases, monitoring tools, and other optional components.

## Access

Thinkube Control is available at `https://control.<your-domain>` after installation. Authentication is handled through Keycloak SSO - the same credentials you use for all platform services.

## MCP Server — manage from Claude Code

Thinkube Control exposes an MCP (Model Context Protocol) server that connects directly to Claude Code. From your terminal, you can ask Claude to:

- Deploy or redeploy a template
- Load or unload a model onto your GPU
- Check service status and restart services
- Browse the model catalog and image registry
- Install or remove add-ons

No dashboard clicking, no SSH, no kubectl. You describe what you want, and Claude executes it through the Thinkube Control API. The MCP server is available automatically in any Claude Code session running on your platform.
