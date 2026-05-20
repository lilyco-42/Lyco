# LAN Scanner + P2P Chat Design

## Overview

lyco — LAN IP scanner with P2P messaging. Discovers hosts via ping/port/SSH scan, then connects peers via TCP on port 4242 for room-based chat with SHA256-chain message verification.

## Architecture

```
src/
├── main.rs       # Entry point, wires gui::run()
├── mod.rs        # pub mod core; pub mod gui;
├── core.rs       # Pure logic: scan, p2p, no UI deps
└── gui.rs        # Pure UI: egui App, widgets, result display
```

- **Core** exposes public functions and types only. Zero egui/eframe imports.
- **GUI** calls `crate::core::*` for all logic. Never touches filesystem or network directly.
- Pattern copied from kolo project (D:\CODE\Rust\kolo).

## Core Module

Two subsystems:

### 1. LAN Scanner

```rust
pub enum ScanResult {
    HostAlive { ip: String, hostname: Option<String> },
    PortOpen { ip: String, port: u16, service: String },
    SshSuccess { ip: String },
    ScanError { ip: String, error: String },
}

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
```

- `parse_cidr(cidr) -> Result<Vec<Ipv4Addr>>` — IP range parsing
- `start_scan(config) -> (mpsc::Receiver<ScanResult>, StopHandle)` — spawns std threads, each with a mini tokio runtime for surge-ping, std TcpStream for port scan, ssh2 for SSH
- `StopHandle` — sends stop signal to workers

Dependencies: `surge-ping`, `tokio`, `ssh2`

### 2. P2P Messaging

```rust
pub struct Message {
    pub msg_id: u64,
    pub room: String,
    pub payload: String,
    pub prev_hash: String,  // SHA256 of previous message JSON
}

pub struct P2pStream {
    // wraps TcpStream, tracks send/recv counts and SHA256 chain
}
```

- `start_server(port) -> (mpsc::Receiver<(Message, TcpStream)>, StopHandle)` — accept loop
- `connect(ip, port) -> Result<P2pStream>` — connect to peer
- `P2pStream::send(room, payload)` — serializes Message to JSON, writes to socket, updates local hash chain
- `P2pStream::recv()` — reads JSON, verifies prev_hash, updates local hash chain
- `P2pStream::handshake(room)` — exchanges latest hash on connect

Protocol: one JSON message per line over TCP. Each message links to the previous via SHA256 hash, forming a tamper-evident chain per peer-pair.

Dependencies: `sha2`, `serde`, `serde_json`

## GUI Module

### Layout

```
+------------------------------------------------------------------+
| [MenuBar]  [Start] [Stop] [Status text]                           |
+------------------------------------------------------------------+
| Left Panel (config)             | Right Panel (chat)              |
|   CIDR input                   |   Room selector dropdown        |
|   Ping/Ports/SSH checkboxes    |   Peer list                     |
|   Port list input              |   Message history (ScrollArea)  |
|   SSH user/pass input          |   Input field + Send button     |
|   Thread count                 |                                  |
|                                |                                  |
|   Scan results (ScrollArea)    |                                  |
|   Each row: result + [Connect] |                                  |
+------------------------------------------------------------------+
| Bottom bar: P2P status | peer count | SHA chain status            |
+------------------------------------------------------------------+
```

### App struct

```rust
struct App {
    scan_config: ScanConfig,
    scan_receiver: Option<mpsc::Receiver<ScanResult>>,
    scan_stop: Option<StopHandle>,
    scan_results: Vec<ScanResult>,
    scan_status: ScanStatus,

    p2p_port: u16,
    server_receiver: Option<mpsc::Receiver<(Message, TcpStream)>>,
    server_stop: Option<StopHandle>,
    peers: HashMap<String, P2pStream>,
    rooms: HashMap<String, Vec<Message>>,
    current_room: String,
    pending_msg: String,
}
```

### Behavior

- **Startup**: auto `start_server(4242)`
- **Each frame**: drain `scan_receiver.try_iter()` into `scan_results`, drain `server_receiver.try_iter()` into room messages, call `ctx.request_repaint()`
- **Start scan**: validate CIDR → `core::start_scan(config)` → set receiver + stop handle
- **Stop scan**: call `stop_handle.stop()`
- **Connect peer**: click [Connect] on scan result row → `core::connect(ip, 4242)` → handshake → add to peers map
- **Send message**: `peer.send(current_room, pending_msg)` → append to room history
- **Font**: system default (no embedded CJK font, unlike kolo)

## Dependencies

```toml
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

## File Migration

Existing root-level files to delete:
- `mod.rs`, `core.rs`, `gui.rs` (move to `src/`)

New `src/mod.rs` replaces root `mod.rs` with same content.

## Error Handling

- Core functions return `Result<T, String>` — stringified errors for simplicity
- GUI stores last error/status as `String` in app state, displayed in bottom bar
- Scan errors per-IP are `ScanResult::ScanError` variant, shown inline in results

## Testing

- `parse_cidr` unit tests
- SHA256 chain verification unit tests
- Message serialization round-trip tests
