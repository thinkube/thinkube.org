---
title: Node Setup
description: Prepare Ubuntu nodes for Thinkube installation
---

Before running the Thinkube installer, prepare each Ubuntu node using the bootstrap script.

## Prerequisites

Before running the script, have ready:
- [ZeroTier Network ID and API Token](./zerotier-token)
- Ubuntu 24.04 LTS installed on each node
- Internet connectivity

## Run the Bootstrap Script

On each node that will be part of your cluster:

```bash
curl -sSL https://raw.githubusercontent.com/thinkube/tk-node-setup/main/bootstrap.sh | sudo bash
```

The script will interactively:
1. Detect your network configuration
2. Install and configure ZeroTier
3. Join your ZeroTier network
4. Authorize the node automatically
5. Configure a static IP address
6. Set up an admin user for Ansible
7. Configure SSH for remote access

## What the Script Configures

### Networking
- ZeroTier overlay network for remote access
- Static IP assignment (local and overlay)
- Hostname configuration

### System
- Ubuntu 24.04 LTS verification
- Admin user with sudo access
- SSH key-based authentication
- Required kernel modules for Kubernetes

## Verification

After running the script, verify the node is ready:

```bash
# Check ZeroTier status
sudo zerotier-cli status
sudo zerotier-cli listnetworks

# Verify SSH access (from another machine)
ssh thinkube@<zerotier-ip>
```

## Next Steps

Once all nodes are prepared:
1. Note the ZeroTier IP addresses of all nodes
2. Ensure you can SSH into each node via ZeroTier
3. Run the [Thinkube Installer](./overview)
