# lyco

LAN IP 스캐너 + P2P 메신저 — 호스트 탐색, 피어 연결, 해시 체인 검증 채팅.

## 기능

- **LAN 스캔** — ping 스윕, TCP 포트 스캔, 서브넷 자동 감지
- **P2P 채팅** — 포트 4242 TCP 직접 연결, 룸 기반 메시징
- **SHA256 체인** — 각 메시지가 이전 해시에 연결, 변조 감지 가능
- **크로스 플랫폼** — Windows, Linux, macOS
- **i18n** — 한국어 / 중국어 / 영어 자동 전환

## 설치

### cargo-binstall

```bash
cargo binstall lyco
```

### 직접 다운로드

[Releases](https://github.com/lilyco-42/Lyco/releases)에서 플랫폼 선택.

### Windows MSI

`lyco-x86_64-pc-windows-msvc.msi`를 다운로드 후 더블클릭.

### 소스에서 빌드

```bash
git clone https://github.com/lilyco-42/Lyco.git
cd Lyco
cargo build --release
```

## 사용법

```bash
lyco
```

1. **CIDR**은 네트워크 인터페이스에서 자동 감지 — 필요시 조정
2. **스캔 시작**을 클릭하여 호스트 탐색
3. 활성 호스트에서 **연결**을 클릭하여 P2P 설정
4. 룸에서 채팅, 메시지는 SHA256 체인으로 검증

## 아키텍처

```
src/
├── main.rs      # 진입점, 로케일 감지
├── mod.rs       # 모듈 선언
├── core.rs      # 순수 로직 — 스캔 엔진, P2P 프로토콜
└── gui.rs       # egui UI — 설정 패널, 결과, 채팅
```

**Core**는 GUI 의존성 없음. **GUI**는 `crate::core::*`를 통해 로직 호출.

### P2P 프로토콜

TCP를 통한 JSON 라인. 각 메시지는 SHA256으로 이전 메시지에 연결:

```
{"msg_id":1, "room":"default", "payload":"안녕하세요", "prev_hash":"genesis"}
{"msg_id":2, "room":"default", "payload":"세계", "prev_hash":"a1b2c3..."}
```

양쪽 피어가 수신 시 `prev_hash` 검증. 체인 손상 → 메시지 거부.

### 스캔 엔진

멀티스레드: IP 범위를 N개 워커로 분할. 각 워커:
- 단일 `surge_ping::Client` 공유 (ICMP 소켓 공유)
- `TcpStream::connect_timeout`으로 포트 스캔
- `mpsc::channel`로 GUI에 실시간 결과 전달

## 의존성

순수 Rust 스택 — OpenSSL 미사용:

| 크레이트 | 용도 |
|-------|---------|
| `eframe` / `egui` | GUI |
| `surge-ping` | ICMP ping |
| `sha2` | SHA256 해싱 |
| `serde` / `serde_json` | 메시지 직렬화 |
| `getifaddrs` | 네트워크 인터페이스 감지 |
| `rust-i18n` | 국제화 |

## 라이선스

Apache-2.0
