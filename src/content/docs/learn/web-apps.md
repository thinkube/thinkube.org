---
title: Web Applications
description: Build and deploy modern web applications with Thinkube
---

Learn how to build and deploy modern web applications with integrated CI/CD, databases, and monitoring.

## Overview

This learning path covers everything you need to deploy production-ready web applications on Thinkube.

## What You'll Build

By the end of this path, you'll have:
- A full-stack web application deployed on Thinkube
- PostgreSQL database with automatic backups
- Redis for caching and sessions
- Automatic TLS certificates
- CI/CD pipeline with GitHub Actions
- Monitoring and logging

## Prerequisites

- Basic understanding of web development
- Familiarity with Git
- A GitHub account

## Module 1: Deploy Your First App

Start with a simple static website to understand the basics.

### Steps:
1. Create a `thinkube.yaml` file
2. Configure your domain
3. Deploy using the CLI
4. Access your application

## Module 2: Add a Database

Learn how to connect PostgreSQL to your application.

### Topics:
- Deploy PostgreSQL
- Configure connection strings
- Set up automatic backups
- Implement migrations

## Module 3: Implement Caching

Speed up your application with Redis.

### Topics:
- Deploy Redis
- Configure session storage
- Implement caching strategies
- Monitor cache performance

## Module 4: Set Up CI/CD

Automate deployments with GitHub Actions.

### Topics:
- Configure GitHub repository
- Set up deployment workflows
- Implement testing pipelines
- Configure staging environments

## Module 5: Production Best Practices

Prepare your application for production traffic.

### Topics:
- Configure health checks
- Set up monitoring
- Implement logging
- Configure auto-scaling

## Example Application

Here's a complete example of deploying a Vue.js + FastAPI application:

```yaml
# thinkube.yaml
name: my-webapp
type: webapp
image: myapp:latest
domain: app.example.com
env:
  - DATABASE_URL: postgresql://db:5432/myapp
  - REDIS_URL: redis://cache:6379
resources:
  memory: 1Gi
  cpu: 1000m
services:
  - postgresql
  - redis
```

## Next Steps

After completing this path, explore:
- [AI & Machine Learning](/learn/ai-ml/)
- [DevOps Platform](/learn/devops/)
- [Advanced Topics](/learn/advanced/)