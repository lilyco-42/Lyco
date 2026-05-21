use std::collections::HashMap;
use std::sync::mpsc;

use eframe::egui;
use egui::Color32;

use crate::core::{
    connect, start_scan, start_server, Message, P2pStream, ScanConfig, ScanResult, ScanStatus,
    StopHandle,
};

struct App {
    scan_config: ScanConfig,
    scan_receiver: Option<mpsc::Receiver<ScanResult>>,
    scan_stop: Option<StopHandle>,
    scan_results: Vec<ScanResult>,
    scan_status: ScanStatus,
    scan_total: usize,
    scan_received: usize,

    p2p_port: u16,
    server_receiver: Option<mpsc::Receiver<(P2pStream, String)>>,
    #[allow(dead_code)]
    server_stop: Option<StopHandle>,
    peers: HashMap<String, P2pStream>,
    rooms: HashMap<String, Vec<Message>>,
    current_room: String,
    pending_msg: String,

    status_text: String,
}

impl App {
    fn drain_scan_results(&mut self) {
        let mut done = false;
        if let Some(ref rx) = self.scan_receiver {
            loop {
                match rx.try_recv() {
                    Ok(ScanResult::ScanDone) => {
                        self.scan_received += 1;
                        let thread_count = self.scan_config.thread_count.min(self.scan_total);
                        if self.scan_received >= thread_count {
                            done = true;
                        }
                    }
                    Ok(result) => {
                        self.scan_results.push(result);
                    }
                    Err(mpsc::TryRecvError::Empty) => break,
                    Err(mpsc::TryRecvError::Disconnected) => {
                        done = true;
                        break;
                    }
                }
            }
        }
        if done && matches!(self.scan_status, ScanStatus::Running) {
            self.scan_status = ScanStatus::Done;
            let alive = self.scan_results.iter().filter(|r| matches!(r, ScanResult::HostAlive { .. })).count();
            self.status_text = format!(
                "Scan done. {} IPs scanned, {} hosts alive, {} results shown",
                self.scan_total, alive, self.scan_results.len()
            );
        }
    }

    fn drain_p2p_connections(&mut self) {
        if let Some(ref rx) = self.server_receiver {
            while let Ok((stream, ip)) = rx.try_recv() {
                self.status_text = format!("New connection from {}", ip);
                self.peers.insert(ip.clone(), stream);
            }
        }
    }

    fn drain_peer_messages(&mut self) {
        for (_ip, peer) in self.peers.iter_mut() {
            while let Ok(msg) = peer.recv() {
                self.rooms
                    .entry(msg.room.clone())
                    .or_default()
                    .push(msg);
            }
        }
    }

    fn try_connect(&mut self, ip: &str) {
        match connect(ip, 4242) {
            Ok(stream) => {
                self.peers.insert(ip.to_string(), stream);
                self.status_text = format!("Connected to {}", ip);
            }
            Err(e) => {
                self.status_text = format!("Connect {} failed: {}", ip, e);
            }
        }
    }

    fn send_message(&mut self) {
        let payload = self.pending_msg.trim().to_string();
        if payload.is_empty() {
            return;
        }
        self.pending_msg.clear();

        let room = self.current_room.clone();
        for (_ip, peer) in self.peers.iter_mut() {
            match peer.send(&room, &payload) {
                Ok(_) => {}
                Err(e) => {
                    self.status_text = format!("Send error: {}", e);
                }
            }
        }

        self.rooms.entry(room).or_default().push(Message {
            msg_id: 0,
            room: self.current_room.clone(),
            payload,
            prev_hash: "local".into(),
        });
    }
}

impl eframe::App for App {
    fn logic(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        self.drain_scan_results();
        self.drain_p2p_connections();
        self.drain_peer_messages();
        ctx.request_repaint();
    }

    fn ui(&mut self, ui: &mut egui::Ui, _frame: &mut eframe::Frame) {
        egui::Panel::top("menu").show_inside(ui, |ui| {
            egui::MenuBar::new().ui(ui, |ui| {
                let is_running = matches!(self.scan_status, ScanStatus::Running);

                if ui.button("Start Scan").clicked() && !is_running {
                    self.scan_results.clear();
                    let (rx, stop, total) = start_scan(self.scan_config.clone());
                    self.scan_receiver = Some(rx);
                    self.scan_stop = Some(stop);
                    self.scan_total = total;
                    self.scan_received = 0;
                    self.scan_status = ScanStatus::Running;
                    self.status_text = format!("Scanning {} IPs...", total);
                }

                if ui.button("Stop").clicked() && is_running {
                    if let Some(ref stop) = self.scan_stop {
                        stop.stop();
                    }
                    self.scan_status = ScanStatus::Done;
                    self.status_text = "Scan stopped".into();
                }

                ui.separator();

                match self.scan_status {
                    ScanStatus::Idle => { ui.label("Idle"); }
                    ScanStatus::Running => { ui.label("Scanning..."); }
                    ScanStatus::Done => { ui.label("Scan done"); }
                }
            });
        });

        egui::Panel::left("left_panel")
            .resizable(true)
            .default_size(350.0)
            .show_inside(ui, |ui| {
                egui::ScrollArea::vertical().show(ui, |ui| {
                    self.render_config(ui);
                    ui.separator();
                    self.render_scan_results(ui);
                });
            });

        egui::CentralPanel::default().show_inside(ui, |ui| {
            self.render_chat(ui);
        });

        egui::Panel::bottom("status").show_inside(ui, |ui| {
            let peer_count = self.peers.len();
            let progress = if matches!(self.scan_status, ScanStatus::Running) {
                let result_count = self.scan_results.len();
                format!(" | Progress: {}/{} results", result_count, self.scan_total)
            } else {
                String::new()
            };
            ui.label(format!(
                "P2P 0.0.0.0:{} | Peers: {} | SHA: OK | {}{}",
                self.p2p_port, peer_count, self.status_text, progress
            ));
        });
    }
}

impl App {
    fn render_config(&mut self, ui: &mut egui::Ui) {
        ui.heading("Scan Config");
        ui.add_space(4.0);

        ui.horizontal(|ui| {
            ui.label("CIDR:");
            ui.text_edit_singleline(&mut self.scan_config.cidr);
        });

        ui.checkbox(&mut self.scan_config.ping_enabled, "Ping sweep");
        ui.checkbox(&mut self.scan_config.ports_enabled, "Port scan");

        if self.scan_config.ports_enabled {
            ui.horizontal(|ui| {
                ui.label("Ports:");
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

        ui.checkbox(&mut self.scan_config.ssh_enabled, "SSH verify");
        if self.scan_config.ssh_enabled {
            ui.horizontal(|ui| {
                ui.label("User:");
                ui.text_edit_singleline(&mut self.scan_config.ssh_user);
            });
            ui.horizontal(|ui| {
                ui.label("Pass:");
                ui.add(
                    egui::TextEdit::singleline(&mut self.scan_config.ssh_pass).password(true),
                );
            });
        }

        ui.horizontal(|ui| {
            ui.label("Threads:");
            ui.add(egui::Slider::new(&mut self.scan_config.thread_count, 1..=256));
        });
    }

    fn render_scan_results(&mut self, ui: &mut egui::Ui) {
        ui.heading("Scan Results");
        ui.add_space(4.0);

        let mut to_connect: Vec<String> = Vec::new();

        for result in self.scan_results.iter() {
            match result {
                ScanResult::HostAlive { ip, .. } => {
                    ui.horizontal(|ui| {
                        ui.colored_label(Color32::GREEN, "OK");
                        ui.label(ip);
                        if !self.peers.contains_key(ip)
                            && ui.button("Connect").clicked()
                        {
                            to_connect.push(ip.clone());
                        } else if self.peers.contains_key(ip) {
                            ui.label("(connected)");
                        }
                    });
                }
                ScanResult::PortOpen { ip, port, service } => {
                    ui.horizontal(|ui| {
                        ui.colored_label(Color32::YELLOW, "OPEN");
                        ui.label(format!("{}:{} ({})", ip, port, service));
                        if *port == 4242
                            && !self.peers.contains_key(ip)
                            && ui.button("Connect").clicked()
                        {
                            to_connect.push(ip.clone());
                        }
                    });
                }
                ScanResult::SshSuccess { ip } => {
                    ui.horizontal(|ui| {
                        ui.colored_label(Color32::GREEN, "SSH");
                        ui.label(format!("{} SSH login OK", ip));
                    });
                }
                ScanResult::ScanError { ip, error } => {
                    ui.horizontal(|ui| {
                        ui.colored_label(Color32::RED, "ERR");
                        ui.label(format!("{} {}", ip, error));
                    });
                }
                ScanResult::HostDown { ip } => {
                    ui.horizontal(|ui| {
                        ui.colored_label(Color32::GRAY, "DOWN");
                        ui.label(ip);
                    });
                }
                ScanResult::ScanDone => {}
            }
        }

        for ip in to_connect {
            self.try_connect(&ip);
        }
    }

    fn render_chat(&mut self, ui: &mut egui::Ui) {
        ui.horizontal(|ui| {
            ui.heading("Chat");
            ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                ui.label("Room:");
                ui.text_edit_singleline(&mut self.current_room);
            });
        });

        if !self.peers.is_empty() {
            ui.label(format!(
                "Online: {}",
                self.peers.keys().map(|s| s.as_str()).collect::<Vec<_>>().join(", ")
            ));
        }

        ui.separator();

        let room_msgs = self.rooms.entry(self.current_room.clone()).or_default();
        egui::ScrollArea::vertical()
            .stick_to_bottom(true)
            .show(ui, |ui| {
                for msg in room_msgs.iter() {
                    ui.label(format!("[{}] {}", msg.msg_id, msg.payload));
                }
            });

        ui.separator();

        ui.horizontal(|ui| {
            let resp = ui.text_edit_singleline(&mut self.pending_msg);
            if resp.lost_focus() && ui.input(|i| i.key_pressed(egui::Key::Enter)) {
                self.send_message();
            }
            if ui.button("Send").clicked() {
                self.send_message();
            }
        });
    }
}

pub fn run() -> Result<(), String> {
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([1000.0, 650.0])
            .with_title("lyco — LAN Scanner + P2P"),
        ..Default::default()
    };

    eframe::run_native(
        "lyco",
        options,
        Box::new(|_cc| {
            let (bound_port, rx, stop) = start_server(4242);
            let app = App {
                scan_config: ScanConfig::default(),
                scan_receiver: None,
                scan_stop: None,
                scan_results: Vec::new(),
                scan_status: ScanStatus::Idle,
                scan_total: 0,
                scan_received: 0,
                p2p_port: bound_port,
                server_receiver: Some(rx),
                server_stop: Some(stop),
                peers: HashMap::new(),
                rooms: HashMap::new(),
                current_room: "default".into(),
                pending_msg: String::new(),
                status_text: format!("P2P server started on port {}", bound_port),
            };
            Ok(Box::new(app))
        }),
    )
    .map_err(|e| format!("eframe error: {}", e))
}
