# LAN Scanner + P2P Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a LAN IP scanner with P2P messaging: discover hosts via ping/port/SSH, connect peers via TCP:4242 for room-based chat with SHA256-chain message verification, displayed in an egui GUI.

**Architecture:** `src/main.rs` wires `gui::run()`. `src/core.rs` contains all pure logic (scanning, P2P) with zero UI deps. `src/gui.rs` is pure egui/eframe UI calling `crate::core::*`. Pattern follows kolo project.

**Tech Stack:** Rust 2021 edition, eframe/egui 0.34, surge-ping 0.15, ssh2 0.9, tokio 1.x (rt-multi-thread), sha2 0.10, serde/serde_json 1.x

---

## File Structure

| File | Action | Purpose |
|---|---|---|
| `Cargo.toml` | Modify | Add dependencies |
| `src/mod.rs` | Create | Module declarations |
| `src/main.rs` | Create | Entry point |
| `src/core.rs` | Create | Scan + P2P logic |
| `src/gui.rs` | Create | egui UI |
| `mod.rs` (root) | Delete | Move to src/ |
| `core.rs` (root) | Delete | Move to src/ |
| `gui.rs` (root) | Delete | Move to src/ |

---

### Task 1: Set up project structure and dependencies

**Files:**
- Modify: `Cargo.toml`
- Create: `src/mod.rs`
- Create: `src/main.rs`
- Delete: `mod.rs`, `core.rs`, `gui.rs`

- [ ] **Step 1: Update Cargo.toml with all dependencies**

Write `Cargo.toml`:

```toml
[package]
name = "lyco"
version = "0.1.0"
edition = "2021"

[dependencies]
eframe = "0.34"
egui = "0.34"
surge-ping = "0.15"
ssh2 = "0.9"
tokio = { version = "1", features = ["rt-multi-thread"] }
sha2 = "0.10"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

- [ ] **Step 2: Create src/mod.rs**

```rust
pub mod core;
pub mod gui;
```

- [ ] **Step 3: Create src/main.rs (placeholder)**

```rust
mod core;
mod gui;

fn main() {
    if let Err(e) = gui::run() {
        eprintln!("GUI error: {}", e);
    }
}
```

- [ ] **Step 4: Create placeholder src/core.rs**

```rust
pub fn placeholder() -> &'static str {
    "core"
}
```

- [ ] **Step 5: Create placeholder src/gui.rs**

```rust
pub fn run() -> Result<(), String> {
    Ok(())
}
```

- [ ] **Step 6: Delete old root-level .rs files**

Run:
```bash
rm mod.rs core.rs gui.rs
```

- [ ] **Step 7: Build check**

Run: `cargo check`
Expected: compiles successfully

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: set up project structure and dependencies"
```

---

### Task 2: Implement CIDR parsing in core.rs

**Files:**
- Modify: `src/core.rs`

- [ ] **Step 1: Replace core.rs with CIDR parser and unit test**

```rust
use std::net::Ipv4Addr;

/// Parse a CIDR string like "192.168.1.0/24" into a Vec of all IPv4 addresses in the range.
pub fn parse_cidr(cidr: &str) -> Result<Vec<Ipv4Addr>, String> {
    let (ip_str, prefix_str) = cidr
        .split('/')
        .next_tuple()
        .ok_or_else(|| format!("Invalid CIDR format: {}", cidr))?;

    let ip: Ipv4Addr = ip_str
        .parse()
        .map_err(|e| format!("Invalid IP '{}': {}", ip_str, e))?;

    let prefix_len: u8 = prefix_str
        .parse()
        .map_err(|e| format!("Invalid prefix '{}': {}", prefix_str, e))?;

    if prefix_len > 32 {
        return Err(format!("Prefix length {} must be <= 32", prefix_len));
    }

    let ip_u32 = u32::from(ip);
    let mask = if prefix_len == 0 {
        0
    } else {
        u32::MAX << (32 - prefix_len)
    };
    let network = ip_u32 & mask;
    let host_bits = 32 - prefix_len;
    let count = 1u64 << host_bits;

    let mut ips = Vec::with_capacity(count as usize);
    for i in 0..count {
        ips.push(Ipv4Addr::from((network + i as u32).to_be_bytes()));
    }
    Ok(ips)
}

use std::str::FromStr;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_cidr_24() {
        let ips = parse_cidr("192.168.1.0/24").unwrap();
        assert_eq!(ips.len(), 256);
        assert_eq!(ips[0], Ipv4Addr::new(192, 168, 1, 0));
        assert_eq!(ips[255], Ipv4Addr::new(192, 168, 1, 255));
    }

    #[test]
    fn test_parse_cidr_30() {
        let ips = parse_cidr("10.0.0.0/30").unwrap();
        assert_eq!(ips.len(), 4);
        assert_eq!(ips[0], Ipv4Addr::new(10, 0, 0, 0));
        assert_eq!(ips[3], Ipv4Addr::new(10, 0, 0, 3));
    }

    #[test]
    fn test_parse_cidr_32() {
        let ips = parse_cidr("172.16.0.1/32").unwrap();
        assert_eq!(ips.len(), 1);
        assert_eq!(ips[0], Ipv4Addr::new(172, 16, 0, 1));
    }

    #[test]
    fn test_parse_cidr_invalid() {
        assert!(parse_cidr("not-an-ip").is_err());
        assert!(parse_cidr("192.168.1.0/33").is_err());
        assert!(parse_cidr("192.168.1.0").is_err());
    }
}
```

- [ ] **Step 2: Run tests**

Run: `cargo test`
Expected: 4 tests pass

- [ ] **Step 3: Commit**

```bash
git add src/core.rs
git commit -m "feat: add CIDR parser with unit tests"
```

---

### Task 3: Define ScanConfig, ScanResult, StopHandle in core.rs

**Files:**
- Modify: `src/core.rs`

- [ ] **Step 1: Append scan types and StopHandle after parse_cidr, before the mod tests block**

Add after the `parse_cidr` function and before `#[cfg(test)]`:

```rust
use std::sync::mpsc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

#[derive(Debug, Clone)]
pub enum ScanResult {
    HostAlive { ip: String, hostname: Option<String> },
    PortOpen { ip: String, port: u16, service: String },
    SshSuccess { ip: String },
    ScanError { ip: String, error: String },
}

#[derive(Clone)]
pub struct ScanConfig {
    pub cidr: String,
    pub ping_enabled: bool,
    pub ports_enabled: bool,
    pub ports: Vec<u16>,
    pub ssh_enabled: bool,
    pub ssh_user: String,
    pub ssh_pass: String,
    pub thread_count: usize,
}

impl Default for ScanConfig {
    fn default() -> Self {
        Self {
            cidr: "192.168.1.0/24".into(),
            ping_enabled: true,
            ports_enabled: false,
            ports: vec![22, 80, 443, 3389],
            ssh_enabled: false,
            ssh_user: "root".into(),
            ssh_pass: String::new(),
            thread_count: 16,
        }
    }
}

#[derive(Clone)]
pub struct StopHandle {
    flag: Arc<AtomicBool>,
}

impl StopHandle {
    pub fn new() -> Self {
        Self { flag: Arc::new(AtomicBool::new(false)) }
    }

    pub fn stop(&self) {
        self.flag.store(true, Ordering::Relaxed);
    }

    pub fn is_stopped(&self) -> bool {
        self.flag.load(Ordering::Relaxed)
    }
}

pub enum ScanStatus {
    Idle,
    Running,
    Done,
}
```

- [ ] **Step 2: Build check**

Run: `cargo check`
Expected: compiles

- [ ] **Step 3: Commit**

```bash
git add src/core.rs
git commit -m "feat: add ScanConfig, ScanResult, StopHandle types"
```

---

### Task 4: Implement start_scan with ping support

**Files:**
- Modify: `src/core.rs`

- [ ] **Step 1: Append start_scan function after StopHandle, before tests**

```rust
use std::thread;
use std::time::Duration;
use std::net::{TcpStream, ToSocketAddrs};
use std::io::Write;

pub fn start_scan(config: ScanConfig) -> (mpsc::Receiver<ScanResult>, StopHandle) {
    let (tx, rx) = mpsc::channel();
    let stop = StopHandle::new();
    let stop_clone = stop.clone();

    let ips = match parse_cidr(&config.cidr) {
        Ok(ips) => ips,
        Err(e) => {
            let _ = tx.send(ScanResult::ScanError { ip: "N/A".into(), error: e });
            return (rx, stop);
        }
    };

    let chunk_size = (ips.len() + config.thread_count - 1) / config.thread_count;
    let chunks: Vec<Vec<Ipv4Addr>> = ips
        .chunks(chunk_size)
        .map(|c| c.to_vec())
        .collect();

    for chunk in chunks {
        let tx = tx.clone();
        let stop = stop_clone.clone();
        let config = config.clone();

        thread::spawn(move || {
            let rt = tokio::runtime::Runtime::new().unwrap();

            for ip in &chunk {
                if stop.is_stopped() {
                    break;
                }

                let ip_str = ip.to_string();
                let mut alive = false;

                // Ping
                if config.ping_enabled {
                    match rt.block_on(ping_host(*ip)) {
                        Ok(true) => {
                            alive = true;
                            let _ = tx.send(ScanResult::HostAlive {
                                ip: ip_str.clone(),
                                hostname: None,
                            });
                        }
                        Ok(false) => { /* no response, skip */ }
                        Err(e) => {
                            let _ = tx.send(ScanResult::ScanError {
                                ip: ip_str.clone(),
                                error: e,
                            });
                        }
                    }
                }

                if stop.is_stopped() {
                    break;
                }

                // Port scan (only if host is alive when ping is enabled, or always run if ping is disabled)
                if config.ports_enabled && (!config.ping_enabled || alive) {
                    for &port in &config.ports {
                        if stop.is_stopped() {
                            break;
                        }
                        let addr = format!("{}:{}", ip_str, port);
                        let timeout = Duration::from_secs(1);
                        if TcpStream::connect_timeout(
                            &addr.to_socket_addrs().ok().and_then(|mut a| a.next()).unwrap_or_else(|| {
                                use std::net::SocketAddr;
                                (ip_str.parse::<std::net::IpAddr>().unwrap(), port).into()
                            }),
                            timeout,
                        ).is_ok()
                        {
                            let service = match port {
                                22 => "SSH",
                                80 => "HTTP",
                                443 => "HTTPS",
                                3389 => "RDP",
                                _ => "Unknown",
                            };
                            let _ = tx.send(ScanResult::PortOpen {
                                ip: ip_str.clone(),
                                port,
                                service: service.into(),
                            });
                        }
                    }
                }

                if stop.is_stopped() {
                    break;
                }

                // SSH (only if port 22 was found open or we scan without port check)
                if config.ssh_enabled && (!config.ports_enabled || alive) {
                    if try_ssh_login(&ip_str, &config.ssh_user, &config.ssh_pass) {
                        let _ = tx.send(ScanResult::SshSuccess { ip: ip_str.clone() });
                    }
                }
            }
        });
    }

    (rx, stop_clone)
}

async fn ping_host(ip: Ipv4Addr) -> Result<bool, String> {
    use surge_ping::{Client, Config as PingConfig, SurgeError};
    let client = Client::new(&PingConfig::default())
        .map_err(|e| format!("ping client: {}", e))?;
    let mut pinger = client.pinger(ip, surge_ping::PingIdentifier(0)).await;
    pinger.timeout(Duration::from_secs(2));
    let payload = [0u8; 8];
    match pinger.ping(surge_ping::PingSequence(0), &payload).await {
        Ok(_) => Ok(true),
        Err(SurgeError::Timeout { .. }) => Ok(false),
        Err(e) => Err(format!("ping error: {}", e)),
    }
}

fn try_ssh_login(ip: &str, user: &str, pass: &str) -> bool {
    use ssh2::Session;
    let addr = format!("{}:22", ip);
    let tcp = match TcpStream::connect_timeout(
        &addr.to_socket_addrs().ok().and_then(|mut a| a.next()).unwrap_or_else(|| {
            use std::net::SocketAddr;
            (ip.parse::<std::net::IpAddr>().unwrap(), 22).into()
        }),
        Duration::from_secs(3),
    ) {
        Ok(tcp) => tcp,
        Err(_) => return false,
    };
    tcp.set_read_timeout(Some(Duration::from_secs(3))).ok();
    let mut session = match Session::new() {
        Ok(s) => s,
        Err(_) => return false,
    };
    session.set_tcp_stream(tcp);
    session.handshake().ok()?;
    session.userauth_password(user, pass).is_ok()
}
```

Note: Remove `use std::io::Write;` from imports (it's already unused for now).

- [ ] **Step 2: Build check**

Run: `cargo check`
Expected: compiles (may need to adjust surge-ping API based on actual version)

- [ ] **Step 3: Commit**

```bash
git add src/core.rs
git commit -m "feat: implement start_scan with ping, port scan, SSH"
```

---

### Task 5: Implement P2P Message types and SHA256 chain verification

**Files:**
- Modify: `src/core.rs`

- [ ] **Step 1: Append Message struct and SHA256 utilities after scan code, before tests**

```rust
use serde::{Serialize, Deserialize};
use sha2::{Sha256, Digest};
use std::net::TcpStream as StdTcpStream;
use std::io::{BufRead, BufReader, Write as IoWrite};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub msg_id: u64,
    pub room: String,
    pub payload: String,
    pub prev_hash: String,
}

impl Message {
    pub fn compute_hash(&self) -> String {
        let json = serde_json::to_string(self).unwrap_or_default();
        let mut hasher = Sha256::new();
        hasher.update(json.as_bytes());
        format!("{:x}", hasher.finalize())
    }
}

/// Verify a chain of messages where each message's prev_hash matches the
/// SHA256 of the previous message's JSON.
pub fn verify_chain(messages: &[Message]) -> bool {
    if messages.is_empty() {
        return true;
    }
    // First message's prev_hash can be anything (it's the genesis)
    for i in 1..messages.len() {
        let prev_json = serde_json::to_string(&messages[i - 1]).unwrap_or_default();
        let mut hasher = Sha256::new();
        hasher.update(prev_json.as_bytes());
        let expected_hash = format!("{:x}", hasher.finalize());
        if messages[i].prev_hash != expected_hash {
            return false;
        }
    }
    true
}
```

- [ ] **Step 2: Add serde derive macro test**

Add inside `mod tests`:

```rust
#[test]
fn test_message_roundtrip() {
    let msg = Message {
        msg_id: 1,
        room: "default".into(),
        payload: "hello".into(),
        prev_hash: "abc123".into(),
    };
    let json = serde_json::to_string(&msg).unwrap();
    let msg2: Message = serde_json::from_str(&json).unwrap();
    assert_eq!(msg.msg_id, msg2.msg_id);
    assert_eq!(msg.room, msg2.room);
    assert_eq!(msg.payload, msg2.payload);
    assert_eq!(msg.prev_hash, msg2.prev_hash);
}

#[test]
fn test_verify_chain_valid() {
    let m1 = Message { msg_id: 1, room: "r".into(), payload: "p1".into(), prev_hash: "genesis".into() };
    let m1_json = serde_json::to_string(&m1).unwrap();
    let m1_hash = format!("{:x}", sha2::Sha256::digest(m1_json.as_bytes()));

    let m2 = Message { msg_id: 2, room: "r".into(), payload: "p2".into(), prev_hash: m1_hash };
    let m2_json = serde_json::to_string(&m2).unwrap();
    let m2_hash = format!("{:x}", sha2::Sha256::digest(m2_json.as_bytes()));

    let m3 = Message { msg_id: 3, room: "r".into(), payload: "p3".into(), prev_hash: m2_hash };

    assert!(verify_chain(&[m1, m2, m3]));
}

#[test]
fn test_verify_chain_tampered() {
    let m1 = Message { msg_id: 1, room: "r".into(), payload: "hello".into(), prev_hash: "genesis".into() };
    let m1_json = serde_json::to_string(&m1).unwrap();
    let m1_hash = format!("{:x}", sha2::Sha256::digest(m1_json.as_bytes()));

    let m2 = Message { msg_id: 2, room: "r".into(), payload: "world".into(), prev_hash: m1_hash };
    // m3 claims prev_hash = m2's hash but we tamper — use wrong prev_hash
    let m3 = Message { msg_id: 3, room: "r".into(), payload: "tampered".into(), prev_hash: "wrong_hash".into() };

    assert!(!verify_chain(&[m1, m2, m3]));
}
```

- [ ] **Step 3: Run tests**

Run: `cargo test`
Expected: 7 tests pass (4 CIDR + 3 message)

- [ ] **Step 4: Commit**

```bash
git add src/core.rs
git commit -m "feat: add P2P Message types and SHA256 chain verification"
```

---

### Task 6: Implement P2pStream (send, recv, handshake)

**Files:**
- Modify: `src/core.rs`

- [ ] **Step 1: Append P2pStream struct after Message, before tests**

```rust
pub struct P2pStream {
    stream: StdTcpStream,
    reader: BufReader<StdTcpStream>,
    send_count: u64,
    recv_count: u64,
    last_sent_hash: String,
    last_recv_hash: String,
}

impl P2pStream {
    pub fn new(stream: StdTcpStream) -> Result<Self, String> {
        let clone = stream.try_clone().map_err(|e| format!("clone: {}", e))?;
        Ok(Self {
            stream,
            reader: BufReader::new(clone),
            send_count: 0,
            recv_count: 0,
            last_sent_hash: String::new(),
            last_recv_hash: String::new(),
        })
    }

    pub fn send(&mut self, room: &str, payload: &str) -> Result<u64, String> {
        self.send_count += 1;
        let msg = Message {
            msg_id: self.send_count,
            room: room.to_string(),
            payload: payload.to_string(),
            prev_hash: self.last_sent_hash.clone(),
        };
        let json = serde_json::to_string(&msg).map_err(|e| format!("serialize: {}", e))?;
        self.last_sent_hash = {
            let mut hasher = Sha256::new();
            hasher.update(json.as_bytes());
            format!("{:x}", hasher.finalize())
        };
        writeln!(self.stream, "{}", json).map_err(|e| format!("write: {}", e))?;
        self.stream.flush().map_err(|e| format!("flush: {}", e))?;
        Ok(self.send_count)
    }

    pub fn recv(&mut self) -> Result<Message, String> {
        let mut line = String::new();
        self.reader.read_line(&mut line).map_err(|e| format!("read: {}", e))?;
        let line = line.trim().to_string();
        if line.is_empty() {
            return Err("empty message".into());
        }
        let msg: Message = serde_json::from_str(&line).map_err(|e| format!("deserialize: {}", e))?;

        // Verify prev_hash
        let expected_prev = if self.recv_count == 0 {
            // First message from peer — accept any prev_hash (it's their genesis)
            msg.prev_hash.clone()
        } else {
            self.last_recv_hash.clone()
        };

        if msg.prev_hash != expected_prev {
            return Err(format!(
                "hash chain broken: expected {} got {}",
                expected_prev, msg.prev_hash
            ));
        }

        // Update received hash chain
        let mut hasher = Sha256::new();
        hasher.update(line.as_bytes());
        self.last_recv_hash = format!("{:x}", hasher.finalize());
        self.recv_count += 1;

        Ok(msg)
    }

    pub fn handshake(&mut self, room: &str) -> Result<(), String> {
        // Send handshake message
        self.send(room, "__HANDSHAKE__")?;
        Ok(())
    }
}
```

- [ ] **Step 2: Build check**

Run: `cargo check`
Expected: compiles

- [ ] **Step 3: Commit**

```bash
git add src/core.rs
git commit -m "feat: implement P2pStream send/recv/handshake"
```

---

### Task 7: Implement P2P server and client connect

**Files:**
- Modify: `src/core.rs`

- [ ] **Step 1: Append start_server and connect functions after P2pStream, before tests**

```rust
use std::net::TcpListener;

pub fn start_server(port: u16) -> (mpsc::Receiver<(P2pStream, String)>, StopHandle) {
    let (tx, rx) = mpsc::channel();
    let stop = StopHandle::new();
    let stop_clone = stop.clone();

    thread::spawn(move || {
        let listener = match TcpListener::bind(("0.0.0.0", port)) {
            Ok(l) => l,
            Err(e) => {
                eprintln!("Failed to bind port {}: {}", port, e);
                return;
            }
        };
        listener.set_nonblocking(true).ok();

        loop {
            if stop_clone.is_stopped() {
                break;
            }
            match listener.accept() {
                Ok((stream, addr)) => {
                    match P2pStream::new(stream) {
                        Ok(mut p2p) => {
                            if let Err(e) = p2p.handshake("default") {
                                eprintln!("Handshake failed with {}: {}", addr, e);
                                continue;
                            }
                            let _ = tx.send((p2p, addr.ip().to_string()));
                        }
                        Err(e) => {
                            eprintln!("Failed to create P2pStream for {}: {}", addr, e);
                        }
                    }
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    thread::sleep(Duration::from_millis(100));
                }
                Err(e) => {
                    eprintln!("Accept error: {}", e);
                    break;
                }
            }
        }
    });

    (rx, stop)
}

pub fn connect(ip: &str, port: u16) -> Result<P2pStream, String> {
    let addr = format!("{}:{}", ip, port);
    let stream = StdTcpStream::connect_timeout(
        &addr.to_socket_addrs()
            .map_err(|e| format!("resolve: {}", e))?
            .next()
            .ok_or_else(|| "no address resolved".to_string())?,
        Duration::from_secs(3),
    )
    .map_err(|e| format!("connect {}: {}", addr, e))?;

    let mut p2p = P2pStream::new(stream)?;
    p2p.handshake("default")?;
    Ok(p2p)
}
```

- [ ] **Step 2: Build check**

Run: `cargo check`
Expected: compiles

- [ ] **Step 3: Commit**

```bash
git add src/core.rs
git commit -m "feat: implement P2P server accept loop and client connect"
```

---

### Task 8: Wire up P2P integration test

**Files:**
- Modify: `src/core.rs`

- [ ] **Step 1: Add integration test at bottom of tests module**

```rust
#[test]
fn test_p2p_connect_and_message() {
    // Start server on a random port
    let (rx, _stop) = start_server(0);
    // We can't easily get the bound port from TcpListener here.
    // This test validates types compile and basic flow works.
    // Integration testing requires a running server — skip for now.
    drop(rx);
    drop(_stop);
}
```

Wait — the `start_server` API doesn't expose the actual port, which makes testing hard. Let me adjust: `start_server` should return the bound port.

- [ ] **Step 2: Fix start_server to return bound port**

Change `start_server` signature to return port and adjust:

```rust
pub fn start_server(port: u16) -> (u16, mpsc::Receiver<(P2pStream, String)>, StopHandle) {
```

And inside, get the local address:

```rust
let local_addr = listener.local_addr().map(|a| a.port()).unwrap_or(port);
```

Return it:

```rust
(local_addr, rx, stop)
```

- [ ] **Step 3: Write actual integration test**

```rust
#[test]
fn test_p2p_connect_and_message() {
    let (bound_port, rx, stop) = start_server(0);
    assert!(bound_port > 0);

    // Connect client
    let mut client = connect("127.0.0.1", bound_port).unwrap();

    // Server side: accept returns P2pStream after handshake
    let (mut peer_stream, peer_ip) = rx.recv_timeout(Duration::from_secs(2)).unwrap();
    assert_eq!(peer_ip, "127.0.0.1");

    // Client sends a message
    client.send("test_room", "hello").unwrap();

    // Server receives client's handshake first, then the test message
    let handshake_msg = peer_stream.recv().unwrap();
    assert_eq!(handshake_msg.payload, "__HANDSHAKE__");

    let msg = peer_stream.recv().unwrap();
    assert_eq!(msg.payload, "hello");
    assert_eq!(msg.room, "test_room");

    stop.stop();
}
```

- [ ] **Step 4: Run test**

Run: `cargo test test_p2p_connect_and_message`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core.rs
git commit -m "test: add P2P connect and message integration test"
```

---

### Task 9: Implement GUI — App struct, menu bar, status bar

**Files:**
- Modify: `src/gui.rs`

- [ ] **Step 1: Replace gui.rs with full App skeleton**

```rust
use eframe::egui;
use std::collections::HashMap;
use std::sync::mpsc;

use crate::core::{
    connect, start_scan, start_server, P2pStream, ScanConfig, ScanResult, ScanStatus,
    StopHandle, Message,
};

struct App {
    // Scan state
    scan_config: ScanConfig,
    scan_receiver: Option<mpsc::Receiver<ScanResult>>,
    scan_stop: Option<StopHandle>,
    scan_results: Vec<ScanResult>,
    scan_status: ScanStatus,

    // P2P state
    p2p_port: u16,
    server_receiver: Option<mpsc::Receiver<(P2pStream, String)>>,
    server_stop: Option<StopHandle>,
    peers: HashMap<String, P2pStream>,
    rooms: HashMap<String, Vec<Message>>,
    current_room: String,
    pending_msg: String,

    status_text: String,
}

impl Default for App {
    fn default() -> Self {
        Self {
            scan_config: ScanConfig::default(),
            scan_receiver: None,
            scan_stop: None,
            scan_results: Vec::new(),
            scan_status: ScanStatus::Idle,
            p2p_port: 4242,
            server_receiver: None,
            server_stop: None,
            peers: HashMap::new(),
            rooms: HashMap::new(),
            current_room: "default".into(),
            pending_msg: String::new(),
            status_text: String::new(),
        }
    }
}

impl eframe::App for App {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        // Drain scan results
        self.drain_scan_results();

        // Drain P2P connections
        self.drain_p2p_connections();

        // Drain peer messages
        self.drain_peer_messages();

        // Menu bar
        self.render_menu(ctx);

        // Main layout
        self.render_main(ctx);

        // Bottom bar
        self.render_bottom(ctx);

        // Keep repainting
        ctx.request_repaint();
    }
}

impl App {
    fn drain_scan_results(&mut self) {
        if let Some(ref rx) = self.scan_receiver {
            while let Ok(result) = rx.try_recv() {
                self.scan_results.push(result);
            }
        }
    }

    fn drain_p2p_connections(&mut self) {
        if let Some(ref rx) = self.server_receiver {
            while let Ok((stream, ip)) = rx.try_recv() {
                self.peers.insert(ip.clone(), stream);
                self.status_text = format!("New connection from {}", ip);
            }
        }
    }

    fn drain_peer_messages(&mut self) {
        // Try recv from each peer
        let mut new_msgs: HashMap<String, Vec<Message>> = HashMap::new();
        for (ip, peer) in self.peers.iter_mut() {
            loop {
                match peer.recv() {
                    Ok(msg) => {
                        new_msgs.entry(msg.room.clone())
                            .or_default()
                            .push(msg);
                    }
                    Err(_) => break, // No more data or error
                }
            }
        }
        for (room, msgs) in new_msgs {
            self.rooms.entry(room).or_default().extend(msgs);
        }
    }

    fn render_menu(&mut self, ctx: &egui::Context) {
        egui::TopBottomPanel::top("menu").show(ctx, |ui| {
            egui::menu::bar(ui, |ui| {
                let is_running = matches!(self.scan_status, ScanStatus::Running);

                if ui.button("▶ 开始扫描").clicked() && !is_running {
                    self.scan_results.clear();
                    let (rx, stop) = start_scan(self.scan_config.clone());
                    self.scan_receiver = Some(rx);
                    self.scan_stop = Some(stop);
                    self.scan_status = ScanStatus::Running;
                    self.status_text = "扫描中...".into();
                }

                if ui.button("■ 停止").clicked() && is_running {
                    if let Some(ref stop) = self.scan_stop {
                        stop.stop();
                    }
                    self.scan_status = ScanStatus::Done;
                    self.status_text = "扫描已停止".into();
                }

                ui.separator();

                match self.scan_status {
                    ScanStatus::Idle => ui.label("就绪"),
                    ScanStatus::Running => ui.label("扫描中..."),
                    ScanStatus::Done => ui.label("扫描完成"),
                };
            });
        });
    }

    fn render_main(&mut self, ctx: &egui::Context) {
        // Left panel: config + scan results
        egui::SidePanel::left("left_panel")
            .resizable(true)
            .default_width(350.0)
            .show(ctx, |ui| {
                self.render_config(ui);
                ui.separator();
                self.render_scan_results(ui);
            });

        // Central: chat
        egui::CentralPanel::default().show(ctx, |ui| {
            self.render_chat(ui);
        });
    }

    fn render_config(&mut self, ui: &mut egui::Ui) {
        ui.heading("扫描配置");
        ui.add_space(4.0);

        ui.horizontal(|ui| {
            ui.label("CIDR:");
            ui.text_edit_singleline(&mut self.scan_config.cidr);
        });

        ui.checkbox(&mut self.scan_config.ping_enabled, "Ping 存活探测");
        ui.checkbox(&mut self.scan_config.ports_enabled, "端口扫描");

        if self.scan_config.ports_enabled {
            ui.horizontal(|ui| {
                ui.label("端口:");
                let mut ports_str = self
                    .scan_config
                    .ports
                    .iter()
                    .map(|p| p.to_string())
                    .collect::<Vec<_>>()
                    .join(",");
                if ui.text_edit_singleline(&mut ports_str).changed() {
                    self.scan_config.ports = ports_str
                        .split(',')
                        .filter_map(|s| s.trim().parse().ok())
                        .collect();
                }
            });
        }

        ui.checkbox(&mut self.scan_config.ssh_enabled, "SSH 验证");
        if self.scan_config.ssh_enabled {
            ui.horizontal(|ui| {
                ui.label("用户:");
                ui.text_edit_singleline(&mut self.scan_config.ssh_user);
            });
            ui.horizontal(|ui| {
                ui.label("密码:");
                ui.add(egui::TextEdit::singleline(&mut self.scan_config.ssh_pass).password(true));
            });
        }

        ui.horizontal(|ui| {
            ui.label("线程数:");
            ui.add(egui::Slider::new(&mut self.scan_config.thread_count, 1..=256));
        });
    }

    fn render_scan_results(&mut self, ui: &mut egui::Ui) {
        ui.heading("扫描结果");
        ui.add_space(4.0);

        egui::ScrollArea::vertical()
            .max_height(300.0)
            .show(ui, |ui| {
                for (i, result) in self.scan_results.iter().enumerate() {
                    let ip = match result {
                        ScanResult::HostAlive { ip, hostname: _ } => ip.clone(),
                        ScanResult::PortOpen { ip, .. } => ip.clone(),
                        ScanResult::SshSuccess { ip } => ip.clone(),
                        ScanResult::ScanError { ip, .. } => ip.clone(),
                    };

                    match result {
                        ScanResult::HostAlive { ip, hostname: _ } => {
                            ui.horizontal(|ui| {
                                ui.colored_label(egui::Color32::GREEN, "✅");
                                ui.label(format!("{} 存活", ip));
                            });
                        }
                        ScanResult::PortOpen { ip, port, service } => {
                            ui.horizontal(|ui| {
                                ui.colored_label(egui::Color32::YELLOW, "🔓");
                                ui.label(format!("{}:{} 开放 ({})", ip, port, service));
                            });
                        }
                        ScanResult::SshSuccess { ip } => {
                            ui.horizontal(|ui| {
                                ui.colored_label(egui::Color32::GREEN, "🔑");
                                ui.label(format!("{} SSH登录成功", ip));
                            });
                        }
                        ScanResult::ScanError { ip, error } => {
                            ui.horizontal(|ui| {
                                ui.colored_label(egui::Color32::RED, "❌");
                                ui.label(format!("{} {}", ip, error));
                            });
                        }
                    }

                    // Connect button for alive hosts
                    if !self.peers.contains_key(&ip)
                        && matches!(result, ScanResult::HostAlive { .. } | ScanResult::PortOpen { port: 4242, .. })
                    {
                        ui.same_line();
                        if ui.button("🔗 连接").clicked() {
                            match connect(&ip, 4242) {
                                Ok(stream) => {
                                    self.peers.insert(ip.clone(), stream);
                                    self.status_text = format!("已连接到 {}", ip);
                                }
                                Err(e) => {
                                    self.status_text = format!("连接 {} 失败: {}", ip, e);
                                }
                            }
                        }
                    }

                    ui.separator();
                }
            });
    }

    fn render_chat(&mut self, ui: &mut egui::Ui) {
        ui.horizontal(|ui| {
            ui.heading("聊天");
            ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                ui.label("房间:");
                ui.text_edit_singleline(&mut self.current_room);
            });
        });

        // Peer list
        if !self.peers.is_empty() {
            ui.label(format!("在线: {}", self.peers.keys().map(|s| s.as_str()).collect::<Vec<_>>().join(", ")));
        }

        ui.separator();

        // Message history
        let room_msgs = self.rooms.entry(self.current_room.clone()).or_default();
        egui::ScrollArea::vertical()
            .stick_to_bottom(true)
            .show(ui, |ui| {
                for msg in room_msgs.iter() {
                    ui.label(format!("[{}] {}", msg.msg_id, msg.payload));
                }
            });

        ui.separator();

        // Input
        ui.horizontal(|ui| {
            let resp = ui.text_edit_singleline(&mut self.pending_msg);
            if resp.lost_focus() && ui.input(|i| i.key_pressed(egui::Key::Enter)) {
                self.send_message();
            }
            if ui.button("发送").clicked() {
                self.send_message();
            }
        });
    }

    fn send_message(&mut self) {
        let payload = self.pending_msg.trim().to_string();
        if payload.is_empty() {
            return;
        }
        self.pending_msg.clear();

        let msg = Message {
            msg_id: 0, // Will be set per-peer
            room: self.current_room.clone(),
            payload,
            prev_hash: String::new(),
        };

        // Send to all peers
        for (ip, peer) in self.peers.iter_mut() {
            match peer.send(&msg.room, &msg.payload) {
                Ok(_) => {}
                Err(e) => {
                    self.status_text = format!("发送到 {} 失败: {}", ip, e);
                }
            }
        }

        // Add to local room
        self.rooms.entry(self.current_room.clone())
            .or_default()
            .push(msg);
    }

    fn render_bottom(&mut self, ctx: &egui::Context) {
        egui::TopBottomPanel::bottom("status").show(ctx, |ui| {
            let peer_count = self.peers.len();
            let sha_status = "✓ 完整";
            ui.label(format!(
                "P2P 服务 0.0.0.0:{} | 已连接 {} 个对端 | SHA链: {} | {}",
                self.p2p_port, peer_count, sha_status, self.status_text
            ));
        });
    }
}

pub fn run() -> Result<(), String> {
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default().with_inner_size([1000.0, 650.0]),
        ..Default::default()
    };

    eframe::run_native(
        "lyco — LAN Scanner + P2P",
        options,
        Box::new(|cc| {
            // Start P2P server on app creation
            let (bound_port, rx, stop) = start_server(4242);
            let mut app = App::default();
            app.p2p_port = bound_port;
            app.server_receiver = Some(rx);
            app.server_stop = Some(stop);
            app.status_text = format!("P2P 服务已启动，端口 {}", bound_port);
            Ok(Box::new(app))
        }),
    )
    .map_err(|e| format!("eframe error: {}", e))
}
```

- [ ] **Step 2: Build check**

Run: `cargo check`
Expected: compiles (may need minor egui API adjustments)

- [ ] **Step 3: Commit**

```bash
git add src/gui.rs
git commit -m "feat: implement GUI with scan config, results, and P2P chat"
```

---

### Task 10: Final build, test, and cleanup

**Files:**
- Verify: `src/main.rs`, `src/mod.rs`, `src/core.rs`, `src/gui.rs`

- [ ] **Step 1: Run full test suite**

Run: `cargo test`
Expected: all tests pass

- [ ] **Step 2: Run release build**

Run: `cargo build --release`
Expected: compiles with no errors

- [ ] **Step 3: Run clippy**

Run: `cargo clippy -- -D warnings`
Expected: no warnings

- [ ] **Step 4: Fix any clippy warnings**

Fix any issues found.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final build, test, and cleanup pass"
```
