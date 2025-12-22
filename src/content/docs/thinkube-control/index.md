---
title: Thinkube Control
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

## Future: MCP Server

Thinkube Control is evolving into an MCP (Model Context Protocol) server, enabling:
- Natural language control of platform services
- LLM-based platform management
- Autonomous platform operations
- Integration with Claude and other AI assistants

This will allow you to manage your infrastructure through conversation - ask Claude to deploy an application, check service health, or scale resources.
