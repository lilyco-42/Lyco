mod core;
mod gui;

fn main() {
    if let Err(e) = gui::run() {
        eprintln!("GUI error: {}", e);
    }
}
