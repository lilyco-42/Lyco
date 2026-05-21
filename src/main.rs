#[macro_use]
extern crate rust_i18n;

i18n!("locales", fallback = "en");

mod core;
mod gui;

fn main() {
    let locale = sys_locale::get_locale()
        .map(|s| s.replace('_', "-"))
        .unwrap_or_else(|| "en".into());

    rust_i18n::set_locale(&locale);

    if let Err(e) = gui::run() {
        eprintln!("GUI error: {}", e);
    }
}
