---
title: Networking
description: How the overlay network enables remote access and how traffic flows between nodes, pods, and clients
sidebar_position: 3
---

Thinkube nodes sit on the same local network. The encrypted overlay network exists so **you** can reach the platform from anywhere — your laptop at home, at work, at a coffee shop — without port forwarding, VPN configuration, or exposing services to the public internet.

Thinkube supports two overlay providers: **ZeroTier** (software-defined L2 networking) and **Tailscale** (WireGuard-based mesh VPN). You choose your provider during installation; the installer handles setup on all nodes and client devices automatically.

### Why the overlay is on every node

The overlay serves different purposes depending on the provider:

**ZeroTier mode:** The Envoy Gateway's VIP addresses live on the overlay interface. Every `*.yourdomain.com` request resolves to a VIP on the overlay. Cilium L2 LB announces these VIPs via ARP on the overlay subnet.

**Tailscale mode:** The Tailscale Kubernetes Operator exposes services as tailnet devices with `100.x.x.x` IPs. Your laptop reaches services via WireGuard. Worker nodes and pods access services via the control plane's LAN IP using kube-proxy and `externalIPs`.

In both modes, the overlay carries the Kubernetes API route. The API server binds to a dummy interface (`k8s0` at `172.16.0.1`), and workers reach it via a static route through the control plane's LAN IP.

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

**Subnet routes:** The control plane advertises the LAN CIDR (e.g., `192.168.1.0/24`) as a Tailscale subnet route, so external clients on the tailnet can reach nodes by their LAN IPs. The route must be approved once in the Tailscale admin console. Clients need `--accept-routes`.

### Provider Comparison

| Feature | ZeroTier | Tailscale |
|---------|----------|-----------|
| IP assignment | Static from your CIDR | Auto-assigned `100.x.x.x` |
| Interface name | `zt*` | `tailscale0` |
| Free tier | 25 nodes | 100 devices |
| Configuration | Network ID + API token | Auth key |

The installer configures the chosen provider during installation, assigns overlay IPs, and verifies connectivity between all nodes. See [Overlay Network Setup](/installation/overlay-network/) for credential setup.

### Service Exposure

**ZeroTier mode:** Cilium L2 LB assigns VIPs from a pool on the overlay subnet (e.g., `192.168.191.200`–`.210`). The control plane responds to ARP requests for these VIPs, making LoadBalancer services directly reachable from any machine on the overlay.

**Tailscale mode:** The Tailscale Kubernetes Operator assigns each LoadBalancer service a tailnet IP (`100.x.x.x`). The operator deploys a proxy pod per service that bridges WireGuard traffic to the backend. Additionally, a `ClusterIP` service with `externalIPs` set to the control plane's LAN IP makes the gateway reachable at the LAN address via kube-proxy iptables DNAT.

## The k8s0 Dummy Interface

The Kubernetes API server binds to a dummy interface (`k8s0`) with a fixed IP (`172.16.0.1/32`) instead of a physical network interface. This makes the cluster location-independent — you can unplug the machine, move it to a different network, and the API server address doesn't change.

| Interface | IP | Purpose |
|-----------|-----|---------|
| `k8s0` | `172.16.0.1` | Kubernetes API server (stable, location-independent) |
| `zt*` or `tailscale0` | Overlay IP | Overlay network (inter-node communication) |
| `enP*` / `wlP*` / `eth*` | DHCP | Physical network (internet access) |

Worker nodes reach `172.16.0.1` via a static route through the control plane's LAN IP (`ip route replace 172.16.0.1/32 via <control_plane_lan_ip>`), managed by a systemd oneshot service. The kubelet, kubectl, and all in-cluster clients use this address.

## Cilium CNI

Thinkube uses [Cilium](https://cilium.io/) as the Container Network Interface (CNI). Cilium provides pod networking, network policies, and load balancing using eBPF.

### Configuration

Cilium's kube-proxy replacement mode differs between overlay providers:

| Setting | ZeroTier | Tailscale | Reason |
|---------|----------|-----------|--------|
| `kubeProxyReplacement` | `true` | `false` | See below |
| `kube-proxy` | Not installed | Installed | Required when Cilium doesn't replace it |
| `hostPort.enabled` | (included in KPR) | `true` | Explicit — KPR=false disables it by default |
| `nodePort.enabled` | (included in KPR) | `true` | Explicit — KPR=false disables it by default |
| `devices` | `k8s0 en+ eth+ wl+ bond+` | Same | Exclude overlay interfaces from BPF |
| `socketLB.hostNamespaceOnly` | `true` | `true` | Required for Tailscale operator compatibility |
| `encryption.enabled` | `false` | `false` | Overlay already encrypts inter-node traffic |
| `l2announcements.enabled` | `true` | `false` | ZeroTier uses Cilium L2 LB; Tailscale uses operator |

### Why kube-proxy Replacement Differs by Overlay Provider

**ZeroTier mode** uses `kubeProxyReplacement: true` — Cilium handles all service routing in BPF. LoadBalancer VIPs live on the ZeroTier L2 overlay, and Cilium L2 LB assigns and announces them via ARP. Everything stays within the L2 domain, so Cilium's BPF DNAT works correctly. kube-proxy is not installed (skipped during `kubeadm init`).

**Tailscale mode** uses `kubeProxyReplacement: false` — because Cilium's BPF intercepts traffic to Tailscale-assigned LoadBalancer IPs (`100.x.x.x`) on worker nodes. It recognizes these as service IPs and attempts to DNAT them locally, but the Tailscale proxy pod isn't on the worker — so the traffic is dropped instead of being forwarded through the WireGuard tunnel.

With `kubeProxyReplacement: false`, Cilium disables all service routing BPF in pod namespaces (Socket LB is fully off). This means pods on worker nodes have no way to reach services without kube-proxy. **kube-proxy is therefore required** — it provides iptables-based service DNAT so pods on any node can reach ClusterIP and LoadBalancer services.

Additionally, `hostPort` and `nodePort` BPF are disabled by default when `kubeProxyReplacement: false`. They must be enabled explicitly via `hostPort.enabled: true` and `nodePort.enabled: true` in the Cilium helm values.

### Why Overlay Interfaces Are Excluded from Cilium Devices

Cilium auto-detects network interfaces and attaches eBPF programs (`cil_from_netdev`) to process incoming traffic. When attached to overlay interfaces (ZeroTier's `zt*` or Tailscale's `tailscale0`), this BPF program intercepts packets destined for LoadBalancer VIPs and blackholes them instead of letting them reach backend pods.

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

All traffic enters the cluster through Envoy Gateway, which implements the Kubernetes Gateway API. A single `thinkube-gateway` resource handles both HTTP/HTTPS (via HTTPRoute) and TCP services (via TCPRoute).

### Listeners

| Port | Protocol | Purpose |
|------|----------|---------|
| 80 | HTTP | Redirect to HTTPS |
| 443 | HTTPS | TLS termination with wildcard cert (`*.yourdomain.com`) |
| 2222 | TCP | Gitea SSH |
| 4222 | TCP | NATS |
| 5432 | TCP | PostgreSQL |
| 6379 | TCP | Valkey |
| 9000 | TCP | ClickHouse |

Services like ArgoCD, Gitea, JupyterHub, and Harbor all share this gateway. Each gets a subdomain (e.g., `argocd.yourdomain.com`) routed by hostname.

### Provider-Specific Configuration

**ZeroTier mode:** The gateway's LoadBalancer service gets a VIP from the Cilium L2 pool. No special pod configuration is needed.

**Tailscale mode:** The gateway runs with `hostNetwork: true` on the control plane node, binding ports directly on the host's network interfaces. This makes it accessible via the LAN IP even when Cilium VXLAN is disrupted. Key configuration:

| Setting | Value | Reason |
|---------|-------|--------|
| `hostNetwork` | `true` | LAN-reachable without VXLAN dependency |
| `dnsPolicy` | `ClusterFirstWithHostNet` | Cluster DNS works in host network namespace |
| `--base-id 1` | Envoy extra arg | Avoids shared memory collision with cilium-envoy (base-id 0) |
| `nodeSelector` | Control plane | Pinned to the node DNS resolves to |
| `strategy` | `Recreate` | hostNetwork prevents rolling updates (port conflicts) |

The `envoy-gateway-lan` Service with `externalIPs` set to the control plane's LAN IP provides kube-proxy DNAT rules, so pods and hosts on any node can reach `<lan_ip>:443`. Envoy Gateway shifts privileged ports by 10000 internally (80 → 10080, 443 → 10443), so the Service uses these shifted targetPorts.

### Knative Services

Knative services (serverless workloads) use `DomainMapping` to route through the same `thinkube-gateway` on port 443. They share the wildcard certificate and scale to zero when idle.

## Load Balancing

**ZeroTier mode** uses Cilium L2 LB. The control plane responds to ARP requests for VIPs on the overlay subnet:

```yaml
# CiliumLoadBalancerIPPool
blocks:
  - start: "192.168.191.200"
    stop: "192.168.191.210"
```

**Tailscale mode** uses two mechanisms:

1. **Tailscale Kubernetes Operator** — Each `LoadBalancer` service with `loadBalancerClass: tailscale` gets a tailnet IP (`100.x.x.x`). The operator deploys a proxy pod that bridges WireGuard traffic to the service's backend pods. This is how external clients (your laptop) reach services.

2. **kube-proxy `externalIPs`** — A `ClusterIP` service with `externalIPs` set to the control plane's LAN IP. kube-proxy installs iptables DNAT rules on every node, so traffic to `<lan_ip>:<port>` is forwarded to the gateway pod. This is how pods and host processes (kubelet, containerd) reach services.

## DNS

### Architecture

Thinkube uses a two-layer DNS architecture:

1. **CoreDNS** (in-cluster) — resolves `*.svc.cluster.local` for pod-to-pod service discovery. Forwards all other queries to BIND9.

2. **BIND9** (deployed as a pod) — the authoritative DNS server for `*.yourdomain.com`. Runs with `hostNetwork: true` on the control plane, binding port 53 on the host's LAN IP. Returns the gateway IP for all `*.yourdomain.com` queries.

### Split DNS (Tailscale mode)

In Tailscale mode, BIND9 runs two containers to serve different zone data to different clients:

| Container | Port | Wildcard resolves to | Clients |
|-----------|------|---------------------|---------|
| `bind9` (internal) | 53 (hostPort) | Control plane LAN IP | Pods, worker hosts |
| `bind9-external` | 5353 | Tailscale gateway IP | External Tailscale clients |

The `bind9-external` LoadBalancer service (`loadBalancerClass: tailscale`) exposes port 53 on the tailnet, mapped to container port 5353. Tailscale split DNS (configured via the Tailscale API) forwards `yourdomain.com` queries from external clients to this service.

In ZeroTier mode, a single container serves all clients with the wildcard resolving to the overlay VIP.

### Node DNS Configuration

Worker nodes and the control plane use `systemd-resolved` with the BIND9 hostPort as their primary DNS server:

- **Kubernetes nodes:** `DNS=<control_plane_lan_ip>` in `/etc/systemd/resolved.conf.d/10-thinkube.conf`
- **Pods:** CoreDNS at the standard cluster DNS IP, which forwards to BIND9
- **Tailscale mode:** `Domains=~yourdomain.com` restricts BIND9 to domain queries only; all other queries use fallback DNS (8.8.8.8)

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

| Port | Protocol | Purpose | Nodes |
|------|----------|---------|-------|
| 22 | TCP | SSH | All |
| 6443 | TCP | Kubernetes API | Control plane |
| 2379-2380 | TCP | etcd | Control plane |
| 10250 | TCP | Kubelet | All |
| 10257 | TCP | kube-controller-manager | Control plane |
| 10259 | TCP | kube-scheduler | Control plane |
| 4240 | TCP | Cilium health | All |
| 8472 | UDP | Cilium VXLAN | All |
| 53 | TCP/UDP | DNS (BIND9 hostPort) | Control plane |
| 10080 | TCP | Envoy Gateway HTTP (Tailscale only) | Control plane |
| 10443 | TCP | Envoy Gateway HTTPS (Tailscale only) | Control plane |

The overlay interface (`zt+` for ZeroTier, `tailscale0` for Tailscale) is allowed for all traffic in both directions — it's a trusted overlay network where all members are authorized nodes.

## Multi-Node Networking

All nodes are expected to be on the same local network. Workers join the cluster with their LAN IP as `INTERNAL-IP`, and pod-to-pod traffic flows directly over the LAN through Cilium's VXLAN encapsulation — the overlay is not in the data path for pod traffic.

The overlay serves different purposes on worker nodes depending on the provider:

**ZeroTier mode:**
1. **VIP reachability** — pods reach the gateway VIP on the overlay interface via Cilium L2 LB
2. **API server route** — `172.16.0.1` is routed via the control plane's LAN IP

**Tailscale mode:**
1. **Tailnet connectivity** — external clients reach services via WireGuard tunnel
2. **API server route** — `172.16.0.1` is routed via the control plane's LAN IP
3. **Service access** — pods and hosts reach `*.yourdomain.com` via kube-proxy `externalIPs` DNAT to the control plane's LAN IP

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

**ZeroTier mode:**

| From | To | Path |
|------|----|------|
| Your laptop | Service (HTTPS) | Laptop → ZeroTier → VIP:443 → Envoy → Pod |
| Pod on worker | `*.yourdomain.com` | Pod → ZeroTier → VIP:443 → Envoy → Pod |
| Pod on Node A | Pod on Node B | Pod → Cilium VXLAN (LAN) → Node B → Pod |
| Worker kubelet | API server | `172.16.0.1:6443` → Static route → Control plane LAN IP |

**Tailscale mode:**

| From | To | Path |
|------|----|------|
| Your laptop | Service (HTTPS) | Laptop → WireGuard → Tailscale LB IP:443 → TS proxy → Envoy → Pod |
| Pod on worker | `*.yourdomain.com` | Pod → kube-proxy DNAT (externalIP:443 → LAN IP:10443) → Envoy → Pod |
| Worker kubelet | `*.yourdomain.com` | kubelet → kube-proxy DNAT (externalIP:443 → LAN IP:10443) → Envoy |
| Pod on Node A | Pod on Node B | Pod → Cilium VXLAN (LAN) → Node B → Pod |
| Worker kubelet | API server | `172.16.0.1:6443` → Static route → Control plane LAN IP |

## Next Steps

- [Multi-Architecture Support](/architecture/multi-architecture/) — How ARM64 and AMD64 nodes coexist
- [Overlay Network Setup](/installation/overlay-network/) — Set up ZeroTier or Tailscale
- [Components](/components/) — Available platform services
