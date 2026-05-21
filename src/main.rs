#[macro_use]
extern crate rust_i18n;

i18n!("locales", fallback = ["zh-CN", "en"]);

mod core;
mod gui;

fn main() {
    // Auto-detect and normalize system locale
    let locale = sys_locale::get_locale()
        .map(|s| s.replace('_', "-"))
        .unwrap_or_else(|| "en".into());

    // Try full locale (e.g. "zh-CN"), fall back to language code (e.g. "zh")
    rust_i18n::set_locale(&locale);

    if let Err(e) = gui::run() {
        eprintln!("GUI error: {}", e);
    }
}
