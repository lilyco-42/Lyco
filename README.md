# lyco

LAN IP scanner + P2P messenger — discover hosts, connect peers, chat with verified message chains.

## Features

- **LAN Scan** — ping sweep, TCP port scan, auto-detect local subnet
- **P2P Chat** — TCP direct connect on port 4242, room-based messaging
- **SHA256 Chain** — every message links to the previous via hash, tamper-evident
- **Cross-platform** — Windows, Linux, macOS
- **i18n** — English / 中文 auto-detected

## Screenshot

```
+------------------------------------------------------------------+
| [Start Scan] [Stop]                      Idle / Scanning / Done   |
+------------------------------------------------------------------+
| Scan Config                           | Chat              Room: [ |
|  CIDR: [192.168.10.0/24   ]           | Online: 192.168.10.5     |
|  ☑ Ping sweep    ☐ Port scan          |--------------------------|
|  ☐ SSH verify                         | [1] hello                |
|  Threads: [16]                        | [2] hi                   |
|                                       | [3] how are you          |
| Scan Results                          |                          |
|  OK  192.168.10.1      [Connect]      | [______________] [Send]  |
|  OK  192.168.10.5      (connected)    |                          |
|  DOWN 192.168.10.100                  |                          |
|  OPEN 192.168.10.1:22 (SSH)           |                          |
+------------------------------------------------------------------+
| P2P 0.0.0.0:4242 | Peers: 1 | SHA: OK | Connected to 192.168.10.5|
+------------------------------------------------------------------+
```

## Install

### cargo-binstall

```bash
cargo binstall lyco
```

### Direct download

Pick your platform from [Releases](https://github.com/lilyco-42/Lyco/releases).

### Windows MSI

Download `lyco-x86_64-pc-windows-msvc.msi` from Releases and double-click.

### Build from source

```bash
git clone https://github.com/lilyco-42/Lyco.git
cd Lyco
cargo build --release
```

## Usage

Launch the app:

```bash
lyco
```

1. **CIDR** is auto-detected from your network interface — adjust if needed
2. Click **Start Scan** to scan for hosts
3. Click **Connect** on any alive host to establish P2P
4. Chat in rooms, messages are SHA256-chain verified

## Architecture

```
src/
├── main.rs      # Entry point, locale detection
├── mod.rs       # Module declarations
├── core.rs      # Pure logic — scan engine, P2P protocol
└── gui.rs       # egui UI — config panel, results, chat
```

**Core** has zero GUI dependencies. **GUI** calls `crate::core::*` for all logic.

### P2P Protocol

JSON-line over TCP, each message links to predecessor via SHA256:

```
{"msg_id":1, "room":"default", "payload":"hello", "prev_hash":"genesis"}
{"msg_id":2, "room":"default", "payload":"world", "prev_hash":"a1b2c3..."}
```

Both peers verify `prev_hash` on receive. Broken chain → message rejected.

### Scan Engine

Multi-threaded: splits IP range across N workers. Each worker:
- Shared `surge_ping::Client` per worker (single ICMP socket)
- `TcpStream::connect_timeout` for port scan
- Results streamed via `mpsc::channel` to GUI in real time

## Dependencies

Pure Rust stack — no OpenSSL:

| Crate | Purpose |
|-------|---------|
| `eframe` / `egui` | GUI |
| `surge-ping` | ICMP ping |
| `sha2` | SHA256 hashing |
| `serde` / `serde_json` | Message serialization |
| `getifaddrs` | Network interface detection |
| `rust-i18n` | Internationalization |

## License

Apache-2.0
