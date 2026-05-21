#[macro_use]
extern crate rust_i18n;

i18n!("locales", fallback = "en");

mod core;
mod gui;

fn main() {
    // Auto-detect system locale
    if let Some(locale) = sys_locale::get_locale() {
        rust_i18n::set_locale(&locale);
    }

    if let Err(e) = gui::run() {
        eprintln!("GUI error: {}", e);
    }
}
