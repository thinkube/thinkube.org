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

**Tailscale mode:** The Tailscale Kubernetes Operator exposes services as tailnet devices with `100.x.x.x` IPs. Your laptop reaches services via WireGuard. Nodes are tailnet members themselves, so pods and host processes reach `*.yourdomain.com` through the same tailnet IPs.

The Kubernetes API is **not** on the overlay in either mode. Every node carries the stable API address `172.16.0.1` locally (see [The Node-Local API VIP](#the-node-local-api-vip-k8s0) below), so the control-plane path never depends on the overlay or on any specific physical network.

## Network Layers

```d2
Your Laptop: {
  browser: "Browser / CLI"
}

LAN: "Local Network" {
  control: "Control Plane" {
    k8s0: "k8s0 (172.16.0.1)\nAPI server"
    lan_ip: "LAN IP"
  }
  worker: "Worker Node" {
    k8s0w: "k8s0 (172.16.0.1)\nlocal API proxy"
    lan_ip2: "LAN IP"
  }
  control.lan_ip -> worker.lan_ip2: "Cilium VXLAN\n(pod traffic)"
  worker.k8s0w -> control.lan_ip: "k8s API\n(node-local proxy)"
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

**Tailscale mode:** The Tailscale Kubernetes Operator assigns each LoadBalancer service a tailnet IP (`100.x.x.x`) and a MagicDNS name. The operator deploys a proxy pod per service that bridges WireGuard traffic to the backend. Cluster nodes are tailnet members themselves, so the same tailnet IPs work for pods and host processes — no separate LAN-side exposure path is needed.

## The Node-Local API VIP (k8s0)

The Kubernetes API has one stable address on every node: `172.16.0.1`. Each node — control plane and workers alike — carries a dummy interface (`k8s0`) with `172.16.0.1/32`, so the address means "the API server, however *this* node reaches it":

- **On the control plane**, the API server itself binds the address. `controlPlaneEndpoint`, the API server certificate, `cluster-info`, all kubeconfigs, and Cilium's `k8sServiceHost` are all `172.16.0.1` — nothing baked into the cluster references a physical network.
- **On workers**, a socket-activated proxy (`k8s-api-proxy`, using systemd's `systemd-socket-proxyd`) listens on `172.16.0.1:6443` and forwards to the control plane's current LAN IP. The kubelet, the Cilium agent, and `kubeadm join` all connect to the local address; only ordinary worker-to-control-plane LAN traffic crosses the wire.

This is the same pattern as kubespray's localhost load balancer and k0s's node-local load balancing — and it means the single-vs-multinode question never has to be answered at install time: every cluster is initialized the same way, and workers can be added at any point.

| Interface | IP | Purpose |
|-----------|-----|---------|
| `k8s0` | `172.16.0.1` | Kubernetes API (server on the control plane, local proxy on workers) |
| `zt*` or `tailscale0` | Overlay IP | Remote client access and service exposure |
| `enP*` / `wlP*` / `eth*` | DHCP | Physical network (LAN, internet access) |

### Stable Endpoint, Dynamic Node Identity

The architecture separates two layers deliberately:

- **The API endpoint** (everything above) is network-independent and never changes.
- **Node identity** — each node's `InternalIP`, set via kubelet's `--node-ip` — is the node's *real* LAN IP. Cilium's VXLAN tunnels and apiserver→kubelet traffic (`kubectl exec`/`logs`, metrics scraping on port 10250) target `InternalIP` directly and cannot ride a proxy, so it must be a genuinely reachable per-node address.

### Moving Between Networks

Because node identity is the only network-dependent layer, it self-heals at boot. A oneshot service (`thinkube-node-ip-sync`, ordered before the kubelet) runs on every node:

1. It rewrites kubelet's `--node-ip` from the current default route's source address. A control plane with no network at all falls back to `172.16.0.1`, which is harmless standalone.
2. On workers, it re-resolves the control plane's hostname via LLMNR (enabled on all nodes; Ubuntu ships it off) and repoints the API proxy if the control plane's LAN IP changed. If resolution fails, the last-known address is kept.

Moving a single-node Thinkube to a different network is therefore: shut down, plug in, boot. A whole-cluster move is: boot everything on the new network. No reconfiguration step is required — by design, since the tooling that runs playbooks lives *inside* the cluster and could never repair a cluster that is down because it moved.

## Cilium CNI

Thinkube uses [Cilium](https://cilium.io/) as the Container Network Interface (CNI). Cilium provides pod networking, network policies, and load balancing using eBPF.

### Configuration

Cilium runs in full kube-proxy replacement mode with both overlay providers — kube-proxy is never installed (`kubeadm init` skips the addon). The configuration is identical except for L2 announcements:

| Setting | Value | Reason |
|---------|-------|--------|
| `k8sServiceHost` | `172.16.0.1` | The node-local API VIP — resolves locally on every node |
| `kubeProxyReplacement` | `true` | Cilium handles all service routing in BPF |
| `devices` | `k8s0 en+ eth+ wl+ bond+` | Exclude overlay interfaces from BPF |
| `socketLB.hostNamespaceOnly` | `true` | Tailscale operator compatibility (see below) |
| `bpf.lbExternalClusterIP` | `true` | Allow external access to ClusterIP services |
| `ipam.mode` | `cluster-pool` (/23 per node) | 510 pod IPs per node, above kubelet's maxPods=500 |
| `encryption.enabled` | `false` | No second encryption layer (see [below](#why-cilium-wireguard-is-not-enabled)) |
| `l2announcements.enabled` | ZeroTier: `true`, Tailscale: `false` | ZeroTier uses Cilium L2 LB; Tailscale uses the operator |

### Tailscale Operator Compatibility

Cilium's eBPF socket-level load balancing intercepts `connect()` inside pod namespaces, bypassing nftables entirely — so the Tailscale proxy pods' DNAT rules never fire, making operator-exposed services unreachable from external tailnet devices. Restricting socket LB to the host namespace (`socketLB.hostNamespaceOnly: true`) re-enables the tc BPF path where netfilter hooks work (see [tailscale/tailscale#11552](https://github.com/tailscale/tailscale/issues/11552), [cilium/cilium#36491](https://github.com/cilium/cilium/issues/36491)). This keeps full kube-proxy replacement viable in Tailscale mode.

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

1. **Redundant**: Inter-node traffic on a trusted home LAN doesn't need a second encryption layer, and anything that leaves the LAN already rides the encrypted overlay
2. **MTU overhead**: Additional WireGuard encapsulation reduces the usable MTU, compounding with the overlay's already-reduced MTU for any tunneled path

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

**Tailscale mode:** The gateway is a regular pod; its LoadBalancer service uses `loadBalancerClass: tailscale`, so the operator gives it a tailnet IP and MagicDNS name (e.g., `<cluster>-gw.<tailnet>.ts.net`). All `*.yourdomain.com` queries resolve to that tailnet IP — for external clients and for cluster nodes and pods alike, since every node runs `tailscaled`.

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

**Tailscale mode** uses the Tailscale Kubernetes Operator: each `LoadBalancer` service with `loadBalancerClass: tailscale` gets a tailnet IP (`100.x.x.x`) and MagicDNS name. The operator deploys a proxy pod that bridges WireGuard traffic to the service's backend pods. External clients (your laptop) and cluster nodes reach services the same way — every node is a tailnet member.

## DNS

### Architecture

Thinkube uses a two-layer DNS architecture:

1. **CoreDNS** (in-cluster) — resolves `*.svc.cluster.local` for pod-to-pod service discovery. Forwards all other queries to BIND9.

2. **BIND9** (deployed as a pod) — the authoritative DNS server for `*.yourdomain.com`. Returns the gateway's address for all `*.yourdomain.com` queries and is exposed both in-cluster (for CoreDNS) and externally (for node hosts and remote clients).

### BIND9 Exposure (Tailscale mode)

BIND9 runs as a regular pod with two Services:

| Service | Type | Clients |
|---------|------|---------|
| `bind9-internal` | ClusterIP | CoreDNS forwards `yourdomain.com` queries here |
| `bind9-external` | LoadBalancer (`loadBalancerClass: tailscale`) | Node hosts and external tailnet clients |

The `bind9-external` service gets a tailnet IP and MagicDNS name (e.g., `<cluster>-dns.<tailnet>.ts.net`). Tailscale split DNS (configured via the Tailscale API) forwards `yourdomain.com` queries from external clients to it, and the wildcard resolves to the gateway's tailnet IP for all clients.

In ZeroTier mode, BIND9 serves all clients with the wildcard resolving to the overlay VIP.

### Node DNS Configuration

Cluster nodes use `systemd-resolved` with BIND9's external address as their domain DNS server (written to `/etc/systemd/resolved.conf.d/` by the node DNS playbook):

- **Kubernetes nodes:** `DNS=<bind9 external IP>` — the tailnet IP in Tailscale mode, the overlay VIP in ZeroTier mode
- **Pods:** CoreDNS at the standard cluster DNS IP, which forwards `yourdomain.com` to `bind9-internal`
- **Tailscale mode:** `Domains=~yourdomain.com` restricts BIND9 to platform-domain queries only; everything else uses fallback DNS (8.8.8.8)

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
| 6443 | TCP | Kubernetes API (server on control plane, node-local proxy on workers) | All |
| 2379-2380 | TCP | etcd | Control plane |
| 10250 | TCP | Kubelet | All |
| 10257 | TCP | kube-controller-manager | Control plane |
| 10259 | TCP | kube-scheduler | Control plane |
| 4240 | TCP | Cilium health | All |
| 8472 | UDP | Cilium VXLAN | All |
| 5355 | UDP | LLMNR (boot-time control plane re-resolution) | All |

The overlay interface (`zt+` for ZeroTier, `tailscale0` for Tailscale) is allowed for all traffic in both directions — it's a trusted overlay network where all members are authorized nodes.

## Multi-Node Networking

All nodes are expected to be on the same local network. Every node registers its real LAN IP as `INTERNAL-IP` (kubelet `--node-ip`, kept current at boot by `thinkube-node-ip-sync`), and pod-to-pod traffic flows directly over the LAN through Cilium's VXLAN encapsulation — the overlay is not in the data path for pod traffic. The Kubernetes API is reached through each worker's node-local proxy on `172.16.0.1:6443`, which is also plain LAN traffic.

The overlay's role on worker nodes depends on the provider:

**ZeroTier mode:** pods reach the gateway VIP on the overlay interface via Cilium L2 LB.

**Tailscale mode:** nodes are tailnet members, so pods and hosts reach `*.yourdomain.com` via the gateway's tailnet IP, and external clients reach services through the WireGuard tunnel.

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
| Worker kubelet | API server | `172.16.0.1:6443` → node-local proxy → Control plane LAN IP:6443 |

**Tailscale mode:**

| From | To | Path |
|------|----|------|
| Your laptop | Service (HTTPS) | Laptop → WireGuard → Tailscale LB IP:443 → TS proxy → Envoy → Pod |
| Pod on worker | `*.yourdomain.com` | Pod → gateway tailnet IP:443 (via node's tailscaled) → TS proxy → Envoy → Pod |
| Worker kubelet | `*.yourdomain.com` | kubelet → gateway tailnet IP:443 (via node's tailscaled) → TS proxy → Envoy |
| Pod on Node A | Pod on Node B | Pod → Cilium VXLAN (LAN) → Node B → Pod |
| Worker kubelet | API server | `172.16.0.1:6443` → node-local proxy → Control plane LAN IP:6443 |

## Next Steps

- [Multi-Architecture Support](/architecture/multi-architecture/) — How ARM64 and AMD64 nodes coexist
- [Overlay Network Setup](/installation/overlay-network/) — Set up ZeroTier or Tailscale
- [Components](/components/) — Available platform services
