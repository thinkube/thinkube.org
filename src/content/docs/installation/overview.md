---
title: Installing Thinkube
description: Complete guide to installing Thinkube with visual walkthrough
---

## Prerequisites

### Phase 1: Node Preparation

Before running the Thinkube installer, prepare your Ubuntu nodes using the node-setup script:

```bash
curl -sSL https://raw.githubusercontent.com/thinkube/node-setup/main/bootstrap.sh | sudo bash
```

This script prepares your nodes for remote installation by configuring networking and SSH access. See [Node Setup Documentation](./node-setup) for details.

### Phase 2: Thinkube Installation

Once nodes are prepared, run the Thinkube installer desktop application.

## Installation Walkthrough

### Step 1: Welcome Screen

![Welcome Screen](./images/01-welcome.png)

The installer welcomes you to Thinkube, your AI-focused Kubernetes homelab platform. It outlines three main phases:
- System requirements check
- Cluster configuration  
- Automated deployment

Click **Get Started** to begin.

### Step 2: System Requirements Check

![System Requirements](./images/02-system-requirements.png)

The installer automatically checks your control node for:

**Required (Must Pass):**
- Ubuntu 24.04.x LTS (Noble Numbat)
- Non-root user with sudo access
- OpenSSH Server installed and running
- Internet connectivity
- Sufficient disk space in home directory

**Tools (Will Install if Missing):**
- Git
- OpenSSH Client
- Python Virtual Environment
- Ansible (in user's venv)

Green checkmarks indicate passed requirements. The installer will offer to install any missing tools.

### Step 3: Administrator Access

![Administrator Access](./images/03-admin-access.png)

Enter your sudo password for the current user. This allows the installer to:
- Configure SSH access between servers
- Install missing tools
- Set up your environment
- Configure system services

The installer will NOT store your password.

### Step 4: Server Discovery - Network Mode

![Server Discovery](./images/04-server-discovery.png)

Choose how to discover your servers:

- **Overlay Network (ZeroTier)** - **RECOMMENDED**: The best choice for homelab setups
- **Local Network** - Basic option for local-only access

### Why ZeroTier Overlay is Recommended

ZeroTier creates a secure virtual network that makes your homelab accessible from anywhere in the world, as if you were on your local network. This is ideal for:

- **Work from Anywhere**: Access your development environment from a coffee shop, office, or while traveling
- **No Port Forwarding**: Avoid exposing your home router to the internet
- **Enterprise Security**: Military-grade encryption for all connections
- **Simple Setup**: No complex VPN configurations or firewall rules
- **Persistent Access**: Your laptop stays connected to your homelab wherever you go
- **Free for Homelabs**: ZeroTier's free tier supports up to 10 nodes - enough for a typical Thinkube setup (2-3 cluster nodes + a few laptops/devices)

**How it Works**: 
- Your cluster nodes remain on your local network for high-speed communication
- ZeroTier creates a secure overlay network on top
- Your laptop joins this overlay network from anywhere
- You access your services (Control Panel, Code-Server, etc.) as if you were home
- No public internet exposure - only devices you authorize can connect

If using ZeroTier, enter your ZeroTier Network CIDR (found in ZeroTier Central).

### Step 5: Server Discovery - Results

![Discovered Servers](./images/05-discovered-servers.png)

The installer shows discovered servers with:
- IP address
- Hostname (if available)
- Operating system details
- SSH status

Click **Select** to choose servers for your cluster. You can select multiple servers.

![Selected Servers](./images/06-selected-servers.png)

Selected servers show green "Selected" badges. Click **Continue with X Servers** when ready.

### Step 6: SSH Connectivity Check

**IMPORTANT**: Before proceeding, you must test SSL connectivity. This is a mandatory step to verify all systems are accessible before starting the MicroK8s configuration. The installer will prompt you to test connectivity to each node.

### Step 7: SSH Setup

![SSH Setup Running](./images/07-ssh-setup.png)

The installer configures passwordless SSH between all selected servers. A popup shows the Ansible playbook execution in real-time. This process:
- Generates SSH keys if needed
- Distributes keys between nodes
- Verifies connectivity

![SSH Setup Complete](./images/08-ssh-complete.png)

Once complete, all servers show "connected" status. The installer confirms "SSH Setup Complete!" with passwordless access configured.

![SSH Test Results](./images/09-ssh-test-results.png)

A test summary shows the number of tasks completed and execution time. Click **Continue** to proceed.

### Step 8: Hardware Detection

![Hardware Detection](./images/10-hardware-detection.png)

The installer detects hardware on each node, displaying:
- **CPU**: Number of cores
- **RAM**: Total memory in GB
- **Disk**: Available storage in GB
- **GPU**: Graphics cards detected (if any)

The **Cluster Capacity Summary** shows total resources across all nodes.

### Step 9: Kubernetes Role Assignment

![Role Assignment](./images/11-role-assignment.png)

Assign roles to your servers:

**Control Plane Node:**
- Manages Kubernetes API and cluster state
- Requires minimum 4 CPU cores and 8GB RAM
- Can also run workloads in single-node setups
- Must be baremetal (no VM support)

**Worker Nodes:**
- Optional additional nodes for running workloads
- GPU-equipped nodes ideal for AI/ML tasks

The installer shows hardware specs and GPU availability for each node to help you decide.

### Step 10: Cluster Configuration

![Cluster Configuration](./images/12-cluster-config.png)

Configure your cluster settings:

**Basic Settings:**
- **Cluster Name**: A name for your Thinkube cluster
- **Domain Name**: Your domain (e.g., example.com)
- **Cloudflare API Token (REQUIRED)**: For valid SSL certificates
  - Why required: All Thinkube services need valid SSL certificates to function
  - Self-signed certificates break SSO, webhooks, and cause browser security issues
  - Uses acme.sh with DNS challenge to generate Let's Encrypt certificates
  - Certificates generated immediately during installation
  - [See Cloudflare Token Setup Guide](./cloudflare-token)

**ZeroTier Configuration:**
- **Network ID**: Your 16-character ZeroTier network ID
- **API Token**: For automatic node authorization

**GitHub Integration (Required):**
- **Personal Access Token**: Powers Thinkube's GitOps workflow
  - Why required: Core to how Thinkube operates
  - Creates repositories for your application deployments
  - Manages CI/CD workflows and build pipelines
  - Provides container registry access for storing images
  - Required permissions: `repo`, `workflow`, `packages:write`
  - [See GitHub Token Setup Guide](./github-token)
- **Organization/Username**: Where deployment repositories will be created

![Configuration Validated](./images/13-config-validated.png)

The installer validates tokens in real-time, showing green checkmarks and access confirmations.

### Step 11: Network Configuration

![Network Configuration](./images/14-network-config.png)

Configure advanced network settings:

**Ingress IP Configuration:**
- **Primary Ingress IP**: For main services (Control Panel, Gitea, etc.)
- **Secondary Ingress IP**: For Knative/serverless workloads

**DNS Configuration:**
- **CoreDNS External IP**: For cluster DNS resolution

**MetalLB IP Range:**
- Define a range of IPs for load balancer services

The configuration shows:
- ZeroTier and Kubernetes cluster CIDRs
- IP ranges for MetalLB
- Server assignments with their IPs and roles

### Step 12: Review Configuration

![Review Configuration](./images/15-review-config.png)

Review your complete configuration:

**Cluster Settings:**
- Cluster name and domain
- Admin username
- Network mode

**Node Assignments:**
- Each server with hardware specs
- Network addresses (ZeroTier and local)
- Assigned roles
- GPU availability

**Generated Ansible Inventory:**
Options to copy, download, or view the generated inventory file for manual execution if needed.

Click **Start Deployment** to begin installation.

### Step 13: Deployment Progress

![Deployment Running](./images/16-deployment-progress.png)

The deployment runs in phases:
1. **Initial Setup** - Environment and network configuration
2. **Kubernetes** - MicroK8s installation and cluster setup

A popup shows real-time Ansible playbook output. You can expand it to see detailed task execution.

### Step 14: Deployment Complete

![Deployment Complete](./images/17-deployment-complete.png)

When deployment completes successfully:
- Both phases show green checkmarks
- Progress bar shows 100% complete
- Success message with celebration emoji

Click **View Cluster Details** to see your deployed services.

## What's Next?

Your Thinkube platform is now installed! You can:

1. Access the Control Panel at `https://control.<your-domain>`
2. Deploy your first application from templates
3. Access code-server at `https://code.<your-domain>` for development
4. Explore optional services installation

## Hardware Requirements

Based on the installer's hardware detection:
- **Minimum**: 4 CPU cores, 8GB RAM for control plane
- **Recommended**: 16+ cores, 64GB+ RAM for comfortable operation
- **AI Workloads**: 32+ cores, 128GB+ RAM, NVIDIA GPU with 24GB+ VRAM

## Troubleshooting

If issues occur:
1. Check the live output in installer popups for specific errors
2. Verify all requirements passed in Step 2
3. Ensure network connectivity between nodes
4. Validate GitHub and ZeroTier tokens
5. Check firewall rules aren't blocking required ports

## Next Steps

1. Access your Control Panel at `https://control.<your-domain>`
2. Deploy your first application from templates
3. Access code-server at `https://code.<your-domain>` for development
4. Explore optional services installation