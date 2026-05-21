# lyco

局域网 IP 扫描 + P2P 通信工具 — 发现主机、连接对端、带哈希链验证的聊天。

## 功能

- **LAN 扫描** — Ping 存活探测、TCP 端口扫描、自动检测本机网段
- **P2P 聊天** — TCP 直连 4242 端口，房间式消息
- **SHA256 链** — 每条消息含上一条的哈希，防篡改
- **跨平台** — Windows、Linux、macOS
- **国际化** — 中文 / 英文自动切换

## 安装

### cargo-binstall

```bash
cargo binstall lyco
```

### 直接下载

从 [Releases](https://github.com/lilyco-42/Lyco/releases) 选择对应平台。

### Windows MSI

下载 `lyco-x86_64-pc-windows-msvc.msi`，双击安装。

### 源码编译

```bash
git clone https://github.com/lilyco-42/Lyco.git
cd Lyco
cargo build --release
```

## 使用

```bash
lyco
```

1. **CIDR** 自动检测本机网段，可手动调整
2. 点击 **开始扫描** 扫描网内主机
3. 对存活主机点击 **连接** 建立 P2P
4. 在房间中聊天，消息 SHA256 链自动验证

## 架构

```
src/
├── main.rs      # 入口，locale 检测
├── mod.rs       # 模块声明
├── core.rs      # 纯逻辑 — 扫描引擎、P2P 协议
└── gui.rs       # egui 界面 — 配置、结果、聊天
```

**Core** 零 GUI 依赖。**GUI** 通过 `crate::core::*` 调用逻辑层。

### P2P 协议

JSON 行格式，通过 TCP 传输，消息通过 SHA256 与前一条链接：

```
{"msg_id":1, "room":"default", "payload":"你好", "prev_hash":"genesis"}
{"msg_id":2, "room":"default", "payload":"世界", "prev_hash":"a1b2c3..."}
```

收发双方各自验证 `prev_hash`，链断裂则拒绝消息。

### 扫描引擎

多线程：IP 范围均分给 N 个 worker。每个 worker：
- 复用单个 `surge_ping::Client`（共享 ICMP socket）
- `TcpStream::connect_timeout` 端口扫描
- 结果通过 `mpsc::channel` 实时推送 GUI

## 依赖

纯 Rust 技术栈，零 OpenSSL：

| 库 | 用途 |
|-------|---------|
| `eframe` / `egui` | 图形界面 |
| `surge-ping` | ICMP Ping |
| `sha2` | SHA256 哈希 |
| `serde` / `serde_json` | 消息序列化 |
| `getifaddrs` | 网络接口检测 |
| `rust-i18n` | 国际化 |

## 许可

Apache-2.0
