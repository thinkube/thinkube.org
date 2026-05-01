---
title: Overlay Network Setup
description: Set up ZeroTier or Tailscale for secure remote access to your Thinkube cluster
---

Thinkube requires an overlay network for secure inter-node communication and remote access. You choose one of two supported providers during installation:

| Provider | Type | IP Assignment | Free Tier |
|----------|------|---------------|-----------|
| **ZeroTier** | Software-defined L2 network | Static IPs from your network's CIDR | Up to 25 nodes |
| **Tailscale** | WireGuard-based mesh VPN | Auto-assigned from `100.x.x.x` | Up to 100 devices |

The installer handles installation and configuration of your chosen provider on all nodes automatically. You only need to create an account and generate credentials.

---

## Option A: ZeroTier

ZeroTier creates a virtual L2 Ethernet network with end-to-end AES-256-GCM encryption.

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

The Thinkube installer will automatically:
1. Install ZeroTier on each node
2. Join your network using the Network ID
3. Authorize the node via the API token
4. Assign overlay IP addresses
5. Verify connectivity between all nodes

---

## Option B: Tailscale

Tailscale uses WireGuard tunnels with automatic key management. IPs are auto-assigned from the `100.x.x.x` CGNAT range.

### Step 1: Create Account

1. Go to [login.tailscale.com](https://login.tailscale.com)
2. Sign up for a free account

### Step 2: Create Auth Key

1. Go to **Settings** → **Keys** → **Auth keys**
2. Click **Generate auth key**
3. Enable **Reusable** (so the same key works for multiple nodes)
4. Set an expiration (90 days recommended)
5. Click **Generate key**
6. **Copy the key immediately** — it won't be shown again

### Step 3: Create API Token

The installer uses an API token to approve advertised routes (needed for MetalLB VIP routing):

1. Go to **Settings** → **Keys** → **API access tokens**
2. Click **Generate access token**
3. Name it `Thinkube` and set an expiration
4. **Copy the token immediately** — it won't be shown again

### What You Need for Installation (Tailscale)

| Item | Example | Where to Find |
|------|---------|---------------|
| Auth Key | `tskey-auth-xxxxxxxxxxxx` | Settings → Keys → Auth keys |
| API Token | `tskey-api-xxxxxxxxxxxx` | Settings → Keys → API access tokens |

### How It's Used

The Thinkube installer will automatically:
1. Install Tailscale on each node
2. Authenticate using your auth key
3. Discover the auto-assigned `100.x.x.x` IPs
4. Verify connectivity between all nodes

---

## Next Steps

Once you have your overlay network credentials:
1. Ensure your nodes meet the [prerequisites](./node-setup)
2. Continue with the [Thinkube installation](./overview)
