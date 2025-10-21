---
id: quick-start
title: Quick Start
sidebar_position: 1
---

# Quick Start Guide

Get Thinkube up and running in minutes with this comprehensive guide.

## What is Thinkube?

Thinkube is a home-based development platform built on Kubernetes, designed to simplify deployment without requiring Kubernetes expertise. It provides a complete development environment with integrated CI/CD, monitoring, and AI-ready components.

## Prerequisites

Before starting, you need:

- **Two Ubuntu 24.04.2 systems** (node1 and node2) with:
  - sudo access on both machines
  - Internet access for package installation
  - At least 8GB RAM and 50GB disk space per node

- **GitHub Personal Access Token** with these permissions:
  - `repo` (Full control of private repositories)
  - `admin:ssh_signing_key` (Manage SSH signing keys)
  - `admin:public_key` (Manage public keys)

## Installation

### Step 1: Download and Run the Installer

On your first node (node1), download and run the installer:

```bash
# Download the installer
wget https://raw.githubusercontent.com/thinkube/thinkube/main/installer/install.sh

# Make it executable
chmod +x install.sh

# Run the installer
./install.sh
```

The installer will:
1. Install required system packages
2. Configure SSH keys
3. Set up GitHub authentication
4. Clone the Thinkube repository
5. Initialize the deployment environment

### Step 2: Configure Your Environment

After installation, configure your deployment:

```bash
cd ~/thinkube

# Edit the inventory file with your settings
nano inventory/inventory.yaml
```

Key settings to configure:
- `domain_name`: Your domain (e.g., `thinkube.local`)
- `admin_username`: Administrator username (default: `tkadmin`)
- `admin_password`: Strong password for admin access
- Node IP addresses and hostnames

### Step 3: Deploy Thinkube

Run the deployment playbook:

```bash
./scripts/run_ansible.sh ansible/10_network/10_setup_network.yaml
./scripts/run_ansible.sh ansible/20_kubernetes/10_setup_microk8s.yaml
./scripts/run_ansible.sh ansible/40_thinkube/core/infrastructure/10_deploy.yaml
```

This will:
- Configure network settings
- Install MicroK8s Kubernetes
- Deploy core Thinkube components
- Set up ingress and TLS certificates

### Step 4: Access Thinkube

Once deployment is complete, access Thinkube at:

```
https://control.YOUR_DOMAIN
```

Log in with the admin credentials you configured.

## What's Next?

- **Deploy an Application**: Use the web interface to deploy your first application
- **Explore Components**: Check out available [components](/docs/components)
- **Learn More**: Read the [architecture documentation](/docs/architecture)

## Quick Commands

```bash
# Check cluster status
microk8s status

# View running pods
microk8s kubectl get pods --all-namespaces

# Check Thinkube services
microk8s kubectl get svc -n thinkube

# View logs
microk8s kubectl logs -n thinkube deployment/thinkube-control
```

## Troubleshooting

### Installation Issues

If the installer fails:
1. Check internet connectivity
2. Verify GitHub token permissions
3. Review logs in `/tmp/thinkube-install.log`

### Deployment Issues

If deployment fails:
1. Check node connectivity: `ping node2`
2. Verify SSH access: `ssh node2`
3. Review Ansible logs in `/tmp/thinkube-deployments/`

### Service Issues

If services aren't accessible:
1. Check ingress: `microk8s kubectl get ingress --all-namespaces`
2. Verify DNS resolution: `nslookup control.YOUR_DOMAIN`
3. Check certificates: `microk8s kubectl get cert --all-namespaces`

## Getting Help

- **Documentation**: Browse the full [documentation](/docs)
- **GitHub Issues**: Report issues on [GitHub](https://github.com/thinkube/thinkube/issues)
- **Discussions**: Join the [community discussions](https://github.com/thinkube/thinkube/discussions)