# lyco

LAN IP スキャナー + P2P メッセンジャー — ホスト検出、ピア接続、検証可能なメッセージチェーンでチャット。

## 機能

- **LAN スキャン** — ping スイープ、TCP ポートスキャン、サブネット自動検出
- **P2P チャット** — ポート 4242 で TCP 直結、ルームベースのメッセージング
- **SHA256 チェーン** — 各メッセージが前のハッシュにリンク、改ざん検出可能
- **クロスプラットフォーム** — Windows、Linux、macOS
- **i18n** — 日本語 / 中国語 / 英語 自動切り替え

## インストール

### cargo-binstall

```bash
cargo binstall lyco
```

### 直接ダウンロード

[Releases](https://github.com/lilyco-42/Lyco/releases) からプラットフォームを選択。

### Windows MSI

`lyco-x86_64-pc-windows-msvc.msi` をダウンロードしてダブルクリック。

### ソースからビルド

```bash
git clone https://github.com/lilyco-42/Lyco.git
cd Lyco
cargo build --release
```

## 使い方

```bash
lyco
```

1. **CIDR** はネットワークインターフェースから自動検出 — 必要に応じて調整
2. **スキャン開始** をクリックしてホストを検出
3. 生存ホストの **接続** をクリックして P2P を確立
4. ルームでチャット、メッセージは SHA256 チェーンで検証

## アーキテクチャ

```
src/
├── main.rs      # エントリポイント、ロケール検出
├── mod.rs       # モジュール宣言
├── core.rs      # 純粋ロジック — スキャンエンジン、P2P プロトコル
└── gui.rs       # egui UI — 設定パネル、結果、チャット
```

**Core** は GUI 依存ゼロ。**GUI** は `crate::core::*` を通じてロジックを呼び出す。

### P2P プロトコル

TCP 経由の JSON 行形式。各メッセージは SHA256 で先行メッセージにリンク：

```
{"msg_id":1, "room":"default", "payload":"こんにちは", "prev_hash":"genesis"}
{"msg_id":2, "room":"default", "payload":"世界", "prev_hash":"a1b2c3..."}
```

両ピアが受信時に `prev_hash` を検証。チェーン破損 → メッセージ拒否。

### スキャンエンジン

マルチスレッド：IP範囲を N ワーカーに分割。各ワーカー：
- 単一 `surge_ping::Client` を共有（ICMP ソケット共用）
- `TcpStream::connect_timeout` でポートスキャン
- 結果は `mpsc::channel` で GUI にリアルタイム配信

## 依存関係

純粋 Rust スタック — OpenSSL 不使用：

| クレート | 用途 |
|-------|---------|
| `eframe` / `egui` | GUI |
| `surge-ping` | ICMP ping |
| `sha2` | SHA256 ハッシュ |
| `serde` / `serde_json` | メッセージシリアライズ |
| `getifaddrs` | ネットワークインターフェース検出 |
| `rust-i18n` | 国際化 |

## ライセンス

Apache-2.0
