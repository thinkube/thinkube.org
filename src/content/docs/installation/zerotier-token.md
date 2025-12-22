---
title: ZeroTier Setup
description: Create a ZeroTier network for secure remote access to your Thinkube cluster
---

ZeroTier provides secure overlay networking, allowing you to access your Thinkube cluster from anywhere without exposing ports to the internet.

## Why ZeroTier

- **Remote Access**: Access your cluster from anywhere as if you were on your local network
- **No Port Forwarding**: No need to expose your home router to the internet
- **Encrypted**: All traffic is encrypted end-to-end
- **Free Tier**: Up to 25 nodes on the free plan (more than enough for Thinkube)

## Step 1: Create Account

1. Go to [my.zerotier.com](https://my.zerotier.com)
2. Sign up for a free account

## Step 2: Create Network

1. Click **Create A Network**
2. A new network is created with a random 16-character Network ID
3. Note this **Network ID** - you'll need it for the installer

## Step 3: Configure Network

1. Click on your network to open settings
2. Under **Settings**:
   - Give it a name (e.g., "Thinkube")
   - Set **Access Control** to "Private" (recommended)
3. Under **Advanced** → **IPv4 Auto-Assign**:
   - Choose an IP range (e.g., `10.147.17.0/24`)
   - Note this range - it's your ZeroTier CIDR

## Step 4: Create API Token

The installer uses an API token to automatically authorize nodes:

1. Go to [my.zerotier.com/account](https://my.zerotier.com/account)
2. Scroll to **API Access Tokens**
3. Click **New Token**
4. Name it `Thinkube` and click **Generate**
5. **Copy the token immediately** - it won't be shown again

## What You Need for Installation

Have these ready for the Thinkube installer:

| Item | Example | Where to Find |
|------|---------|---------------|
| Network ID | `a1b2c3d4e5f6g7h8` | Network list on my.zerotier.com |
| API Token | `zt_xxxxxxxxxxxx` | Account → API Access Tokens |
| Network CIDR | `10.147.17.0/24` | Network → IPv4 Auto-Assign |

## How It's Used

The node-setup bootstrap script will:
1. Install ZeroTier on each node
2. Join your network using the Network ID
3. Authorize the node via the API token
4. Configure the overlay IP address

The Thinkube installer will:
1. Discover nodes on your ZeroTier network
2. Use overlay IPs for cluster communication
3. Configure ingress to be accessible via ZeroTier

## Next Steps

Once you have your ZeroTier credentials:
1. Run the [node-setup bootstrap script](./node-setup) on each node
2. Continue with the [Thinkube installation](./overview)
