use std::net::Ipv4Addr;
use std::sync::mpsc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use std::net::{TcpStream, TcpListener, ToSocketAddrs};
use std::io::{BufRead, BufReader, Write as IoWrite};

use serde::{Serialize, Deserialize};
use sha2::{Sha256, Digest};

// ── CIDR Parser ────────────────────────────────────────────────────

pub fn parse_cidr(cidr: &str) -> Result<Vec<Ipv4Addr>, String> {
    let parts: Vec<&str> = cidr.split('/').collect();
    if parts.len() != 2 {
        return Err(format!("Invalid CIDR format: {}", cidr));
    }
    let (ip_str, prefix_str) = (parts[0], parts[1]);

    if ip_str.is_empty() || prefix_str.is_empty() {
        return Err(format!("Invalid CIDR format: {}", cidr));
    }

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
        let addr_u32 = network.wrapping_add(i as u32);
        let bytes = addr_u32.to_be_bytes();
        ips.push(Ipv4Addr::new(bytes[0], bytes[1], bytes[2], bytes[3]));
    }
    Ok(ips)
}

// ── Scan Types ─────────────────────────────────────────────────────

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

// ── Scan Engine ────────────────────────────────────────────────────

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
        .chunks(chunk_size.max(1))
        .map(|c| c.to_vec())
        .collect();

    for chunk in chunks {
        let tx = tx.clone();
        let stop = stop_clone.clone();
        let config = config.clone();

        thread::spawn(move || {
            let rt = match tokio::runtime::Runtime::new() {
                Ok(r) => r,
                Err(e) => {
                    let _ = tx.send(ScanResult::ScanError {
                        ip: "N/A".into(),
                        error: format!("tokio runtime: {}", e),
                    });
                    return;
                }
            };

            for ip in &chunk {
                if stop.is_stopped() {
                    break;
                }

                let ip_str = ip.to_string();
                let mut alive = false;

                if config.ping_enabled {
                    match rt.block_on(ping_host(*ip)) {
                        Ok(true) => {
                            alive = true;
                            let _ = tx.send(ScanResult::HostAlive {
                                ip: ip_str.clone(),
                                hostname: None,
                            });
                        }
                        Ok(false) => {}
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

                let should_scan = !config.ping_enabled || alive;
                if config.ports_enabled && should_scan {
                    for &port in &config.ports {
                        if stop.is_stopped() {
                            break;
                        }
                        if check_port(&ip_str, port) {
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

                if config.ssh_enabled && should_scan {
                    match try_ssh_login(&ip_str, &config.ssh_user, &config.ssh_pass) {
                        Ok(true) => {
                            let _ = tx.send(ScanResult::SshSuccess { ip: ip_str.clone() });
                        }
                        Ok(false) => {}
                        Err(e) => {
                            let _ = tx.send(ScanResult::ScanError {
                                ip: ip_str.clone(),
                                error: e,
                            });
                        }
                    }
                }
            }
        });
    }

    (rx, stop_clone)
}

async fn ping_host(ip: Ipv4Addr) -> Result<bool, String> {
    use surge_ping::{Client, Config as PingConfig, PingIdentifier, PingSequence, SurgeError};

    let client = Client::new(&PingConfig::default())
        .map_err(|e| format!("ping client: {}", e))?;
    let mut pinger = client.pinger(std::net::IpAddr::V4(ip), PingIdentifier(1)).await;
    pinger.timeout(Duration::from_secs(2));
    let payload = [0u8; 8];

    match pinger.ping(PingSequence(0), &payload).await {
        Ok(_) => Ok(true),
        Err(SurgeError::Timeout { .. }) => Ok(false),
        Err(e) => Err(format!("ping error: {}", e)),
    }
}

fn check_port(ip: &str, port: u16) -> bool {
    let addr = format!("{}:{}", ip, port);
    let sock_addr = match addr.to_socket_addrs() {
        Ok(mut addrs) => match addrs.next() {
            Some(a) => a,
            None => return false,
        },
        Err(_) => return false,
    };
    TcpStream::connect_timeout(&sock_addr, Duration::from_secs(1)).is_ok()
}

fn try_ssh_login(ip: &str, user: &str, pass: &str) -> Result<bool, String> {
    let addr = format!("{}:22", ip);
    let sock_addr = addr
        .to_socket_addrs()
        .map_err(|e| format!("resolve {}: {}", ip, e))?
        .next()
        .ok_or_else(|| format!("no address for {}", ip))?;

    let tcp = TcpStream::connect_timeout(&sock_addr, Duration::from_secs(3))
        .map_err(|e| format!("connect {}:22: {}", ip, e))?;
    tcp.set_read_timeout(Some(Duration::from_secs(3))).ok();

    let mut session = ssh2::Session::new()
        .map_err(|e| format!("ssh session: {}", e))?;
    session.set_tcp_stream(tcp);
    session
        .handshake()
        .map_err(|e| format!("ssh handshake: {}", e))?;

    match session.userauth_password(user, pass) {
        Ok(()) => Ok(true),
        Err(e) => {
            // Authentication failed but SSH connection worked — not an error, just not successful
            let _ = e;
            Ok(false)
        }
    }
}

// ── P2P Types ──────────────────────────────────────────────────────

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

pub fn verify_chain(messages: &[Message]) -> bool {
    if messages.len() < 2 {
        return true;
    }
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

// ── P2pStream ──────────────────────────────────────────────────────

pub struct P2pStream {
    stream: TcpStream,
    reader: BufReader<TcpStream>,
    send_count: u64,
    recv_count: u64,
    last_sent_hash: String,
    last_recv_hash: String,
}

impl P2pStream {
    pub fn new(stream: TcpStream) -> Result<Self, String> {
        let clone = stream
            .try_clone()
            .map_err(|e| format!("clone stream: {}", e))?;
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
        let json = serde_json::to_string(&msg)
            .map_err(|e| format!("serialize: {}", e))?;

        self.last_sent_hash = {
            let mut hasher = Sha256::new();
            hasher.update(json.as_bytes());
            format!("{:x}", hasher.finalize())
        };

        writeln!(self.stream, "{}", json)
            .map_err(|e| format!("write: {}", e))?;
        self.stream
            .flush()
            .map_err(|e| format!("flush: {}", e))?;
        Ok(self.send_count)
    }

    pub fn recv(&mut self) -> Result<Message, String> {
        let mut line = String::new();
        self.reader
            .read_line(&mut line)
            .map_err(|e| format!("read: {}", e))?;
        let line = line.trim().to_string();
        if line.is_empty() {
            return Err("empty message".into());
        }

        let msg: Message = serde_json::from_str(&line)
            .map_err(|e| format!("deserialize: {}", e))?;

        let expected_prev = if self.recv_count == 0 {
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

        let mut hasher = Sha256::new();
        hasher.update(line.as_bytes());
        self.last_recv_hash = format!("{:x}", hasher.finalize());
        self.recv_count += 1;

        Ok(msg)
    }

    pub fn handshake(&mut self, room: &str) -> Result<(), String> {
        self.send(room, "__HANDSHAKE__")?;
        Ok(())
    }
}

// ── P2P Server & Client ────────────────────────────────────────────

pub fn start_server(port: u16) -> (u16, mpsc::Receiver<(P2pStream, String)>, StopHandle) {
    let (tx, rx) = mpsc::channel();
    let stop = StopHandle::new();
    let stop_clone = stop.clone();

    let listener = match TcpListener::bind(("0.0.0.0", port)) {
        Ok(l) => l,
        Err(e) => {
            eprintln!("Failed to bind port {}: {}", port, e);
            return (0, rx, stop);
        }
    };

    let local_port = listener.local_addr().map(|a| a.port()).unwrap_or(port);
    listener.set_nonblocking(true).ok();

    thread::spawn(move || loop {
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
                        eprintln!("P2pStream error for {}: {}", addr, e);
                    }
                }
            }
            Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                thread::sleep(Duration::from_millis(100));
            }
            Err(e) => {
                if !stop_clone.is_stopped() {
                    eprintln!("Accept error: {}", e);
                }
                break;
            }
        }
    });

    (local_port, rx, stop)
}

pub fn connect(ip: &str, port: u16) -> Result<P2pStream, String> {
    let addr = format!("{}:{}", ip, port);
    let sock_addr = addr
        .to_socket_addrs()
        .map_err(|e| format!("resolve: {}", e))?
        .next()
        .ok_or_else(|| "no address resolved".to_string())?;

    let stream = TcpStream::connect_timeout(&sock_addr, Duration::from_secs(3))
        .map_err(|e| format!("connect {}: {}", addr, e))?;

    let mut p2p = P2pStream::new(stream)?;
    p2p.handshake("default")?;
    Ok(p2p)
}

// ── Tests ──────────────────────────────────────────────────────────

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
        let m1 = Message {
            msg_id: 1, room: "r".into(), payload: "p1".into(), prev_hash: "genesis".into(),
        };
        let m1_json = serde_json::to_string(&m1).unwrap();
        let m1_hash = format!("{:x}", sha2::Sha256::digest(m1_json.as_bytes()));

        let m2 = Message {
            msg_id: 2, room: "r".into(), payload: "p2".into(), prev_hash: m1_hash,
        };
        let m2_json = serde_json::to_string(&m2).unwrap();
        let m2_hash = format!("{:x}", sha2::Sha256::digest(m2_json.as_bytes()));

        let m3 = Message {
            msg_id: 3, room: "r".into(), payload: "p3".into(), prev_hash: m2_hash,
        };

        assert!(verify_chain(&[m1, m2, m3]));
    }

    #[test]
    fn test_verify_chain_tampered() {
        let m1 = Message {
            msg_id: 1, room: "r".into(), payload: "hello".into(), prev_hash: "genesis".into(),
        };
        let m1_json = serde_json::to_string(&m1).unwrap();
        let m1_hash = format!("{:x}", sha2::Sha256::digest(m1_json.as_bytes()));

        let m2 = Message {
            msg_id: 2, room: "r".into(), payload: "world".into(), prev_hash: m1_hash,
        };
        let m3 = Message {
            msg_id: 3, room: "r".into(), payload: "tampered".into(), prev_hash: "wrong_hash".into(),
        };

        assert!(!verify_chain(&[m1, m2, m3]));
    }

    #[test]
    fn test_p2p_connect_and_message() {
        let (bound_port, rx, stop) = start_server(0);
        assert!(bound_port > 0);

        let mut client = connect("127.0.0.1", bound_port).unwrap();

        let (mut peer_stream, peer_ip) = rx.recv_timeout(Duration::from_secs(3)).unwrap();
        assert_eq!(peer_ip, "127.0.0.1");

        client.send("test_room", "hello").unwrap();

        // Server receives handshake first, then the test message
        let handshake_msg = peer_stream.recv().unwrap();
        assert_eq!(handshake_msg.payload, "__HANDSHAKE__");

        let msg = peer_stream.recv().unwrap();
        assert_eq!(msg.payload, "hello");
        assert_eq!(msg.room, "test_room");

        stop.stop();
    }
}
