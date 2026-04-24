---
title: Networking
description: How Thinkube connects nodes, routes traffic, and secures communication across the cluster
sidebar_position: 3
---

Thinkube builds a location-independent Kubernetes cluster on top of a ZeroTier overlay network. Nodes can be in different buildings, cities, or continents — the networking layer makes them behave as if they share a switch.

## Network Layers

```d2
Internet: {
  Client: Browser / CLI
}

ZeroTier Overlay: {
  Node A: Control Plane {
    k8s0: "k8s0 (172.16.0.1)"
    zt: "zt* (192.168.191.50)"
    VIPs: "VIPs (.200–.210)"
  }
  Node B: Worker {
    zt2: "zt* (192.168.191.10)"
  }
}

Kubernetes: {
  Cilium: CNI (VXLAN)
  Gateway: Envoy Gateway
  DNS: CoreDNS
  LB: "Cilium L2 LB"
}

Internet.Client -> ZeroTier Overlay.Node A.VIPs: HTTPS
ZeroTier Overlay.Node A.VIPs -> Kubernetes.Gateway
ZeroTier Overlay.Node A.zt -> ZeroTier Overlay.Node B.zt2: encrypted
Kubernetes.Cilium -> ZeroTier Overlay.Node A.k8s0
Kubernetes.Cilium -> ZeroTier Overlay.Node B.zt2
```

## ZeroTier Overlay

ZeroTier creates a virtual L2 Ethernet network across all nodes. Every node gets an IP on the same `/24` subnet (e.g., `192.168.191.0/24`), and all traffic between members is encrypted with AES-256-GCM using Curve25519 key exchange with perfect forward secrecy.

| Property | Value |
|----------|-------|
| Encryption | AES-256-GCM, end-to-end |
| Key exchange | Curve25519 with PFS |
| Topology | Peer-to-peer (relay fallback) |
| MTU | 2800 |
| Subnet | Configurable `/24` (e.g., `192.168.191.0/24`) |

The installer configures ZeroTier during [node setup](/installation/node-setup/), assigns the overlay IP, and authorizes the node via the ZeroTier API.

### VIP Addresses

The control plane node's ZeroTier member is assigned the MetalLB VIP range (e.g., `.200`–`.210`) as secondary IPs. This makes LoadBalancer services directly reachable from any machine on the ZeroTier network without additional routing.

```
# Control plane ZeroTier interface
192.168.191.50/24    ← node address
192.168.191.200/24   ← primary gateway VIP
192.168.191.201/24   ← secondary VIP
...
192.168.191.210/24   ← last VIP
```

## The k8s0 Dummy Interface

The Kubernetes API server binds to a dummy interface (`k8s0`) with a fixed IP (`172.16.0.1/32`) instead of a physical network interface. This makes the cluster location-independent — you can unplug the machine, move it to a different network, and the API server address doesn't change.

| Interface | IP | Purpose |
|-----------|-----|---------|
| `k8s0` | `172.16.0.1` | Kubernetes API server (stable, location-independent) |
| `zt*` | `192.168.191.x` | ZeroTier overlay (inter-node communication) |
| `enP*` / `wlP*` / `eth*` | DHCP | Physical network (internet access) |

Worker nodes reach `172.16.0.1` via a ZeroTier managed route. The kubelet, kubectl, and all in-cluster clients use this address.

## Cilium CNI

Thinkube uses [Cilium](https://cilium.io/) as the Container Network Interface (CNI), deployed automatically by the Canonical k8s snap. Cilium provides pod networking, network policies, and load balancing using eBPF.

### Configuration

| Setting | Value | Reason |
|---------|-------|--------|
| `kube-proxy-replacement` | `false` | kube-proxy handles service DNAT via iptables |
| `devices` | `k8s0 en+ eth+ wl+ bond+` | Exclude ZeroTier from BPF (see below) |
| `enable-wireguard` | `false` | ZeroTier already encrypts inter-node traffic |
| `bpf-lb-sock` | `true` | Socket-level load balancing for local services |

### Why ZeroTier Is Excluded from Cilium Devices

Cilium auto-detects network interfaces and attaches eBPF programs (`cil_from_netdev`) to process incoming traffic. When attached to the ZeroTier interface, this BPF program intercepts packets destined for LoadBalancer VIPs and blackholes them instead of letting kube-proxy DNAT them to backend pods.

This is a known issue ([cilium/cilium#44982](https://github.com/cilium/cilium/issues/44982)) affecting overlay VPN interfaces (WireGuard, ZeroTier). The fix is to explicitly set `devices` to include only physical and cluster interfaces, excluding `zt*`.

### ZeroTier Peer Path Isolation

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

This forces ZeroTier to discover peers only via physical interfaces (LAN or WAN), keeping the overlay network stable regardless of Kubernetes networking state. The configuration is applied automatically during node setup and the add-node flow.

### Why WireGuard Is Not Enabled

Cilium supports transparent WireGuard encryption for pod-to-pod traffic between nodes. Thinkube does **not** enable this because:

1. **Redundant**: ZeroTier already provides AES-256-GCM encryption on all inter-node traffic
2. **Breaks pod networking**: When the control plane uses a dummy interface (`k8s0` at `172.16.0.1`), WireGuard tunnel negotiation between nodes fails, breaking cross-node pod connectivity
3. **MTU overhead**: WireGuard reduces MTU to 1420 inside ZeroTier's already-reduced 2800

## Gateway and Ingress

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

The VIP range is derived from inventory variables (`metallb_ip_start_octet` and `metallb_ip_end_octet`) combined with the ZeroTier subnet prefix.

## DNS

### Internal (CoreDNS)

CoreDNS provides in-cluster DNS resolution. Services are accessible at `<name>.<namespace>.svc.cluster.local`.

### External

The ZeroTier subnet's DNS IP (e.g., `192.168.191.205`) is assigned to a CoreDNS LoadBalancer service, making cluster DNS available to all nodes on the overlay for resolving `*.yourdomain.com` to the gateway VIP.

## TLS Certificates

Thinkube uses a wildcard certificate for `*.yourdomain.com`, managed by `acme.sh` on the host. The certificate is copied into per-namespace Kubernetes secrets (`tls-<domain>`) and referenced by the gateway.

| Component | How TLS works |
|-----------|--------------|
| Client → Gateway | TLS terminated at Envoy with wildcard cert |
| Gateway → Pods | Plain HTTP (encrypted by ZeroTier if cross-node) |
| Node → Node | Encrypted by ZeroTier overlay |
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

The ZeroTier interface (`zt+`) is allowed for all traffic in both directions — it's a trusted overlay network where all members are authorized nodes.

## Multi-Node Networking

When worker nodes join the cluster:

1. **ZeroTier connects them** to the overlay network with a unique IP
2. **k8s joins them** as worker nodes with their local LAN IP as `INTERNAL-IP`
3. **Cilium establishes VXLAN tunnels** between nodes for pod-to-pod traffic
4. **Cilium L2 LB** continues to ARP-respond on the control plane for VIPs

Pod traffic between nodes flows through Cilium's VXLAN encapsulation, which uses each node's `INTERNAL-IP`. If nodes are on different LANs, the underlying IP connectivity is provided by ZeroTier — but Cilium itself doesn't need to know about ZeroTier.

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
| External client | Service (HTTPS) | Client → ZeroTier → VIP:443 → Envoy → Pod |
| Pod on Node A | Pod on Node B | Pod → Cilium VXLAN → Node B → Pod |
| kubectl (any node) | API server | kubectl → `172.16.0.1:6443` (via ZeroTier if remote) |
| Worker node | LoadBalancer VIP | Cilium socket LB → DNAT to pod IP → VXLAN if cross-node |

## Next Steps

- [Multi-Architecture Support](/architecture/multi-architecture/) — How ARM64 and AMD64 nodes coexist
- [ZeroTier Setup](/installation/zerotier-token/) — Create your overlay network
- [Components](/components/) — Available platform services
