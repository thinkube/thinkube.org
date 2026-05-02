---
title: Networking
description: How the overlay network enables remote access and how traffic flows between nodes, pods, and clients
sidebar_position: 3
---

Thinkube nodes sit on the same local network. The encrypted overlay network exists so **you** can reach the platform from anywhere — your laptop at home, at work, at a coffee shop — without port forwarding, VPN configuration, or exposing services to the public internet.

Thinkube supports two overlay providers: **ZeroTier** (software-defined L2 networking) and **Tailscale** (WireGuard-based mesh VPN). You choose your provider during installation; the installer handles setup on all nodes and client devices automatically.

### Why the overlay is on every node

The Envoy Gateway's VIP addresses live on the overlay interface. Every `*.yourdomain.com` request — whether from your laptop or from a pod running on a worker node — resolves to a VIP on the overlay. Without the overlay, worker nodes couldn't reach platform services by domain name.

The overlay also carries the Kubernetes API route. The API server binds to a dummy interface (`k8s0` at `172.16.0.1`), and workers reach it via a static route through the control plane's overlay IP. This makes the API address stable regardless of which physical network the machine is on.

## Network Layers

```d2
Your Laptop: {
  browser: "Browser / CLI"
}

LAN: "Local Network" {
  control: "Control Plane (tkspark)" {
    k8s0: "k8s0 (172.16.0.1)"
    lan_ip: "LAN IP"
  }
  worker: "Worker Node" {
    lan_ip2: "LAN IP"
  }
  control.lan_ip -> worker.lan_ip2: "Cilium VXLAN\n(pod traffic)"
}

Overlay: "Overlay Network (ZeroTier / Tailscale)" {
  cp_overlay: "Control Plane\n.50"
  vips: "VIPs\n.200–.210"
  w_overlay: "Worker\n.10"
  cp_overlay -> vips
}

Kubernetes: {
  Gateway: "Envoy Gateway\n*.yourdomain.com"
  Cilium: "Cilium CNI"
  DNS: "CoreDNS"
}

Your Laptop.browser -> Overlay.vips: "HTTPS from anywhere"
Overlay.w_overlay -> Overlay.vips: "pods reach *.yourdomain.com"
Overlay.vips -> Kubernetes.Gateway
LAN.worker.lan_ip2 -> Overlay.cp_overlay: "172.16.0.1 route\n(k8s API)"
```

## Overlay Providers

### ZeroTier

ZeroTier creates a virtual L2 Ethernet network across all nodes. Every node gets a static IP on the same `/24` subnet (e.g., `192.168.191.0/24`), and all traffic between members is encrypted with AES-256-GCM using Curve25519 key exchange with perfect forward secrecy.

| Property | Value |
|----------|-------|
| Encryption | AES-256-GCM, end-to-end |
| Key exchange | Curve25519 with PFS |
| Topology | Peer-to-peer (relay fallback) |
| MTU | 2800 |
| Subnet | Configurable `/24` (e.g., `192.168.191.0/24`) |

### Tailscale

Tailscale builds a WireGuard mesh between all nodes. IPs are auto-assigned from the `100.x.x.x` CGNAT range. All traffic is encrypted with WireGuard (ChaCha20-Poly1305).

| Property | Value |
|----------|-------|
| Encryption | WireGuard (ChaCha20-Poly1305) |
| Key exchange | Noise protocol framework |
| Topology | Peer-to-peer (DERP relay fallback) |
| MTU | ~1280 (WireGuard overhead) |
| Subnet | Auto-assigned `100.x.x.x/32` per node |

### Provider Comparison

| Feature | ZeroTier | Tailscale |
|---------|----------|-----------|
| IP assignment | Static from your CIDR | Auto-assigned `100.x.x.x` |
| Interface name | `zt*` | `tailscale0` |
| Free tier | 25 nodes | 100 devices |
| Configuration | Network ID + API token | Auth key |

The installer configures the chosen provider during installation, assigns overlay IPs, and verifies connectivity between all nodes. See [Overlay Network Setup](/installation/overlay-network/) for credential setup.

### VIP Addresses

The control plane node's overlay interface is assigned the MetalLB VIP range (e.g., `.200`–`.210`) as secondary IPs. This makes LoadBalancer services directly reachable from any machine on the overlay network without additional routing.

```
# Control plane overlay interface (ZeroTier example)
192.168.191.50/24    <- node address
192.168.191.200/24   <- primary gateway VIP
192.168.191.201/24   <- secondary VIP
...
192.168.191.210/24   <- last VIP
```

## The k8s0 Dummy Interface

The Kubernetes API server binds to a dummy interface (`k8s0`) with a fixed IP (`172.16.0.1/32`) instead of a physical network interface. This makes the cluster location-independent — you can unplug the machine, move it to a different network, and the API server address doesn't change.

| Interface | IP | Purpose |
|-----------|-----|---------|
| `k8s0` | `172.16.0.1` | Kubernetes API server (stable, location-independent) |
| `zt*` or `tailscale0` | Overlay IP | Overlay network (inter-node communication) |
| `enP*` / `wlP*` / `eth*` | DHCP | Physical network (internet access) |

Worker nodes reach `172.16.0.1` via a managed route on the overlay network. The kubelet, kubectl, and all in-cluster clients use this address.

## Cilium CNI

Thinkube uses [Cilium](https://cilium.io/) as the Container Network Interface (CNI), deployed automatically by the Canonical k8s snap. Cilium provides pod networking, network policies, and load balancing using eBPF.

### Configuration

| Setting | Value | Reason |
|---------|-------|--------|
| `kube-proxy-replacement` | `false` | kube-proxy handles service DNAT via iptables |
| `devices` | `k8s0 en+ eth+ wl+ bond+` | Exclude overlay interfaces from BPF (see below) |
| `enable-wireguard` | `false` | Overlay provider already encrypts inter-node traffic |
| `bpf-lb-sock` | `true` | Socket-level load balancing for local services |

### Why Overlay Interfaces Are Excluded from Cilium Devices

Cilium auto-detects network interfaces and attaches eBPF programs (`cil_from_netdev`) to process incoming traffic. When attached to overlay interfaces (ZeroTier's `zt*` or Tailscale's `tailscale0`), this BPF program intercepts packets destined for LoadBalancer VIPs and blackholes them instead of letting kube-proxy DNAT them to backend pods.

This is a known issue ([cilium/cilium#44982](https://github.com/cilium/cilium/issues/44982)) affecting overlay VPN interfaces. The fix is to explicitly set `devices` to include only physical and cluster interfaces, excluding overlay interfaces.

### Overlay Peer Path Isolation

#### ZeroTier

ZeroTier automatically discovers the best UDP path between peers by probing all local network interfaces. On Kubernetes nodes, this can include virtual interfaces created by Cilium (`cilium_host`, `cilium_net`), container bridges (`cni-podman0`), and pod veth pairs — leading to peer paths routed through the CNI network (e.g., `10.1.x.x`) instead of the physical LAN.

When Cilium's networking is briefly disrupted (during node joins, DaemonSet rollouts, or CNI reconfiguration), these virtual peer paths break, causing ZeroTier connectivity loss and SSH failures for Ansible playbooks that target overlay IPs.

Thinkube prevents this by configuring `/var/lib/zerotier-one/local.conf` on every node:

```json
{
  "settings": {
    "interfacePrefixBlacklist": ["cilium", "cni", "lxc", "veth"]
  }
}
```

This forces ZeroTier to discover peers only via physical interfaces (LAN or WAN), keeping the overlay network stable regardless of Kubernetes networking state.

#### Tailscale

Tailscale uses a similar peer discovery mechanism (STUN/DERP) but does not probe arbitrary local interfaces in the same way. No additional interface exclusion is needed for Tailscale.

Both configurations are applied automatically during installation and the add-node flow.

### Why Cilium WireGuard Is Not Enabled

Cilium supports transparent WireGuard encryption for pod-to-pod traffic between nodes. Thinkube does **not** enable this because:

1. **Redundant**: The overlay provider (ZeroTier or Tailscale) already encrypts all inter-node traffic
2. **Breaks pod networking**: When the control plane uses a dummy interface (`k8s0` at `172.16.0.1`), WireGuard tunnel negotiation between nodes fails, breaking cross-node pod connectivity
3. **MTU overhead**: Additional WireGuard encapsulation further reduces MTU inside the overlay's already-reduced MTU

## Gateway

All HTTP/HTTPS traffic enters the cluster through Envoy Gateway, which implements the Kubernetes Gateway API.

### thinkube-gateway

The primary gateway terminates TLS using a wildcard certificate (`*.yourdomain.com`) and routes traffic to services via HTTPRoute resources.

| Property | Value |
|----------|-------|
| VIP | `192.168.191.200` |
| Ports | 80 (HTTP → redirect), 443 (HTTPS) |
| TLS | Wildcard cert, terminate at gateway |
| Backend protocol | HTTP (plain) to pods |

Services like ArgoCD, Gitea, JupyterHub, and Harbor are all served through this single gateway. Each gets a subdomain (e.g., `argocd.yourdomain.com`) routed by hostname.

### thinkube-tcp-gateway

Non-HTTP services use a separate TCP gateway for protocol passthrough:

| Service | Port | Protocol |
|---------|------|----------|
| Gitea SSH | 2222 | TCP |
| NATS | 4222 | TCP |
| PostgreSQL | 5432 | TCP |
| Valkey | 6379 | TCP |
| ClickHouse | 9000 | TCP |

### Knative Services

Knative services (serverless workloads) use `DomainMapping` to route through the same `thinkube-gateway` on port 443. They share the wildcard certificate and scale to zero when idle.

## Load Balancing

Thinkube uses Cilium's built-in L2 load balancer (which replaced MetalLB). In L2 mode, the control plane node responds to ARP requests for VIP addresses, directing traffic to itself.

```yaml
# Configured via k8s set
load-balancer:
  enabled: true
  l2-mode: true
  cidrs:
    - 192.168.191.200-192.168.191.210
```

The VIP range is derived from inventory variables (`metallb_ip_start_octet` and `metallb_ip_end_octet`) combined with the overlay subnet prefix.

## DNS

### Internal (CoreDNS)

CoreDNS provides in-cluster DNS resolution. Services are accessible at `<name>.<namespace>.svc.cluster.local`.

### External

An IP from the overlay subnet (e.g., `192.168.191.205`) is assigned to a CoreDNS LoadBalancer service, making cluster DNS available to all nodes on the overlay for resolving `*.yourdomain.com` to the gateway VIP.

## TLS Certificates

Thinkube uses a wildcard certificate for `*.yourdomain.com`, managed by `acme.sh` on the host. The certificate is copied into per-namespace Kubernetes secrets (`tls-<domain>`) and referenced by the gateway.

| Component | How TLS works |
|-----------|--------------|
| Client → Gateway | TLS terminated at Envoy with wildcard cert |
| Gateway → Pods | Plain HTTP (encrypted by overlay if cross-node) |
| Node → Node | Encrypted by overlay provider |
| kubectl → API | TLS to `172.16.0.1:6443` (k8s-managed cert) |

There is no need for per-service TLS certificates or cert-manager. The wildcard cert covers all subdomains.

## Firewall (UFW)

All nodes run UFW with `default: deny (incoming)`. The k8s install playbook opens the required ports:

| Port | Protocol | Purpose |
|------|----------|---------|
| 22 | TCP | SSH |
| 6443 | TCP | Kubernetes API |
| 6400 | TCP | k8s cluster daemon |
| 10250 | TCP | Kubelet |
| 4240 | TCP | Cilium health |
| 8472 | UDP | Cilium VXLAN |

The overlay interface (`zt+` for ZeroTier, `tailscale0` for Tailscale) is allowed for all traffic in both directions — it's a trusted overlay network where all members are authorized nodes.

## Multi-Node Networking

All nodes are expected to be on the same local network. Workers join the cluster with their LAN IP as `INTERNAL-IP`, and pod-to-pod traffic flows directly over the LAN through Cilium's VXLAN encapsulation — the overlay is not in the data path for pod traffic.

The overlay serves two purposes on worker nodes:

1. **VIP reachability** — pods that call `https://mlflow.yourdomain.com` need to reach the gateway VIP, which lives on the overlay interface
2. **API server route** — `172.16.0.1` is routed via the control plane's overlay IP

```d2
Pod A (Node 1): {
  app: "10.1.0.88"
}
Cilium VXLAN: {
  encap: "Outer: node IPs\nInner: pod IPs"
}
Pod B (Node 2): {
  app: "10.1.29.45"
}

Pod A (Node 1).app -> Cilium VXLAN.encap -> Pod B (Node 2).app
```

### Traffic Flow Summary

| From | To | Path |
|------|----|------|
| Your laptop (remote) | Service (HTTPS) | Laptop → Overlay → VIP:443 → Envoy → Pod |
| Pod on worker | `*.yourdomain.com` | Pod → Overlay → VIP:443 → Envoy → Pod |
| Pod on Node A | Pod on Node B | Pod → Cilium VXLAN (LAN) → Node B → Pod |
| Worker kubelet | API server | `172.16.0.1:6443` → Overlay → Control plane |

## Next Steps

- [Multi-Architecture Support](/architecture/multi-architecture/) — How ARM64 and AMD64 nodes coexist
- [Overlay Network Setup](/installation/overlay-network/) — Set up ZeroTier or Tailscale
- [Components](/components/) — Available platform services
