---
title: Node Setup
description: Prepare Ubuntu nodes for Thinkube installation
---

Before running the Thinkube installer, you need to prepare your Ubuntu nodes. The node-setup script automates this process, configuring networking, SSH access, and system requirements.

## Quick Start

Run this command on each Ubuntu node that will be part of your Thinkube cluster:

```bash
curl -sSL https://raw.githubusercontent.com/thinkube/node-setup/main/bootstrap.sh | sudo bash
```

## What the Script Does

### System Configuration
- Verifies Ubuntu 24.04 LTS (Noble Numbat)
- Updates system packages
- Configures timezone and locale settings
- Sets up system limits for production workloads

### Network Setup
- Configures static IP addresses (optional)
- Sets up hostname resolution
- Configures firewall rules for Kubernetes
- Enables IP forwarding for container networking

### SSH Configuration
- Installs OpenSSH server
- Configures SSH for key-based authentication
- Sets up sudo access for the admin user
- Disables root SSH login for security

### Container Runtime
- Installs containerd as the container runtime
- Configures containerd for Kubernetes
- Sets up required kernel modules
- Configures cgroup drivers

### Kubernetes Prerequisites
- Disables swap (required by Kubernetes)
- Installs required packages (curl, gnupg, etc.)
- Configures kernel parameters for Kubernetes
- Sets up bridge networking

## Manual Setup Options

If you prefer to configure nodes manually or need custom settings:

### 1. Create Admin User

```bash
# Create a user with sudo privileges
sudo adduser thinkube
sudo usermod -aG sudo thinkube
```

### 2. Configure SSH

```bash
# Install OpenSSH server
sudo apt update
sudo apt install openssh-server -y

# Start and enable SSH
sudo systemctl enable ssh
sudo systemctl start ssh
```

### 3. Set Static IP (Optional)

Edit `/etc/netplan/00-installer-config.yaml`:

```yaml
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: false
      addresses:
        - 192.168.1.100/24
      gateway4: 192.168.1.1
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```

Apply the configuration:

```bash
sudo netplan apply
```

### 4. Disable Swap

```bash
# Disable swap
sudo swapoff -a

# Remove swap entry from /etc/fstab
sudo sed -i '/swap/d' /etc/fstab
```

### 5. Configure Kernel Modules

```bash
# Load required modules
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter

# Set kernel parameters
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

sudo sysctl --system
```

## System Requirements

### Minimum Requirements
- **OS**: Ubuntu 24.04 LTS (Noble Numbat)
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disk**: 20 GB
- **Network**: Static IP or DHCP reservation

### Recommended Requirements
- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Disk**: 50+ GB SSD
- **Network**: Gigabit Ethernet

### For AI/ML Workloads
- **CPU**: 8+ cores
- **RAM**: 32+ GB
- **GPU**: NVIDIA GPU with CUDA support
- **Disk**: 100+ GB NVMe SSD

## Network Requirements

### Required Ports

The following ports must be accessible between nodes:

| Port | Protocol | Purpose |
|------|----------|---------|
| 22 | TCP | SSH access |
| 6443 | TCP | Kubernetes API |
| 10250 | TCP | Kubelet API |
| 10251 | TCP | kube-scheduler |
| 10252 | TCP | kube-controller-manager |
| 10255 | TCP | Read-only Kubelet API |
| 2379-2380 | TCP | etcd server client API |
| 30000-32767 | TCP | NodePort Services |

### Firewall Configuration

If using UFW (Ubuntu Firewall):

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow Kubernetes API
sudo ufw allow 6443/tcp

# Allow pod network
sudo ufw allow from 10.0.0.0/8

# Enable firewall
sudo ufw enable
```

## Verification

After running the setup script, verify the node is ready:

### Check System Status

```bash
# Verify Ubuntu version
lsb_release -a

# Check swap is disabled
free -h | grep -i swap

# Verify kernel modules
lsmod | grep br_netfilter
lsmod | grep overlay

# Check IP forwarding
sysctl net.ipv4.ip_forward
```

### Test SSH Access

From your control machine:

```bash
# Test SSH connection
ssh thinkube@<node-ip>

# Verify sudo access
sudo -l
```

## Troubleshooting

### SSH Connection Refused

```bash
# Check SSH service status
sudo systemctl status ssh

# Check firewall rules
sudo ufw status

# Verify SSH configuration
sudo grep -E '^(PermitRootLogin|PubkeyAuthentication|PasswordAuthentication)' /etc/ssh/sshd_config
```

### Network Issues

```bash
# Check network configuration
ip addr show
ip route show

# Test connectivity
ping -c 4 8.8.8.8
```

### Swap Not Disabled

```bash
# Force disable all swap
sudo swapoff -a

# Remove swap file
sudo rm /swap.img

# Update grub
sudo update-grub
```

## Next Steps

Once all nodes are prepared:

1. Note the IP addresses of all nodes
2. Ensure you can SSH into each node
3. Run the [Thinkube Installer](./overview) from your control machine
4. The installer will detect and configure the prepared nodes

## Advanced Configuration

### Custom Network CIDR

If your network uses a different subnet:

```bash
# Edit the script before running
curl -sSL https://raw.githubusercontent.com/thinkube/node-setup/main/bootstrap.sh -o setup.sh
nano setup.sh  # Edit NETWORK_CIDR variable
sudo bash setup.sh
```

### Proxy Configuration

For environments behind a proxy:

```bash
# Set proxy environment variables
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080
export NO_PROXY=localhost,127.0.0.1,10.0.0.0/8

# Run the setup script
curl -sSL https://raw.githubusercontent.com/thinkube/node-setup/main/bootstrap.sh | sudo -E bash
```

### Air-Gapped Installation

For environments without internet access, download the script and dependencies first:

```bash
# On a machine with internet
curl -sSL https://raw.githubusercontent.com/thinkube/node-setup/main/bootstrap.sh -o setup.sh
curl -sSL https://raw.githubusercontent.com/thinkube/node-setup/main/offline-bundle.tar.gz -o offline-bundle.tar.gz

# Transfer to target nodes and run
scp setup.sh offline-bundle.tar.gz user@node:/tmp/
ssh user@node
cd /tmp && sudo bash setup.sh --offline
```