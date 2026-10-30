//! Detects a missing WebView2 runtime on Windows before any window is built.
//!
//! Without the runtime the app does not fail visibly: the window never opens, the
//! builder's `.expect` panics, and a release build has no console to show it. The NSIS
//! installer fetches the runtime while installing; an MSIX from the Store cannot run an
//! installer, so this check is what turns a silent vanish into an explanation.

/// Microsoft documents a missing key, an empty `pv` and `0.0.0.0` as "not installed";
/// two of those are a key that exists, so a plain existence check is not enough.
/// Not behind a `cfg` so it is compiled and tested on every platform.
#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
pub fn looks_installed(pv: Option<&str>) -> bool {
    match pv {
        Some(version) => !version.is_empty() && version != "0.0.0.0",
        None => false,
    }
}

#[cfg(target_os = "windows")]
pub use windows_only::*;

#[cfg(target_os = "windows")]
mod windows_only {
    use super::looks_installed;

    const CLIENT: &str = "{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}";
    const GET_IT: &str = "https://developer.microsoft.com/microsoft-edge/webview2/";

    /// Per machine (64-bit and 32-bit views) and per user: any one is a usable runtime.
    pub fn is_missing() -> bool {
        use winreg::RegKey;
        use winreg::enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE};

        let places = [
            (
                HKEY_LOCAL_MACHINE,
                format!("SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\{CLIENT}"),
            ),
            (
                HKEY_LOCAL_MACHINE,
                format!("SOFTWARE\\Microsoft\\EdgeUpdate\\Clients\\{CLIENT}"),
            ),
            (
                HKEY_CURRENT_USER,
                format!("Software\\Microsoft\\EdgeUpdate\\Clients\\{CLIENT}"),
            ),
        ];

        !places.iter().any(|(root, path)| {
            let value = RegKey::predef(*root)
                .open_subkey(path)
                .ok()
                .and_then(|key| key.get_value::<String, _>("pv").ok());
            looks_installed(value.as_deref())
        })
    }

    /// A native dialog is the only UI possible here: no Tauri app exists yet.
    pub fn explain_and_exit() -> ! {
        let answer = rfd::MessageDialog::new()
            .set_title("Skima needs one more thing")
            .set_description(
                "Skima draws its window with a Windows component called WebView2, and this PC \
                 does not have it. Install it from Microsoft, then open Skima again.",
            )
            .set_buttons(rfd::MessageButtons::OkCancelCustom(
                "Get WebView2".to_owned(),
                "Close".to_owned(),
            ))
            .show();

        if answer == rfd::MessageDialogResult::Custom("Get WebView2".to_owned()) {
            let _ = std::process::Command::new("cmd")
                .args(["/C", "start", "", GET_IT])
                .spawn();
        }

        // Non-zero: launchers and scripts must not read "ran fine" for an app that never opened.
        std::process::exit(1)
    }
}

#[cfg(test)]
mod tests {
    use super::looks_installed;

    #[test]
    fn an_empty_version_is_not_a_runtime() {
        assert!(!looks_installed(None), "no key at all");
        assert!(!looks_installed(Some("")), "key exists, empty value");
        assert!(!looks_installed(Some("0.0.0.0")), "key exists, zero version");
    }

    #[test]
    fn a_real_version_is() {
        assert!(looks_installed(Some("139.0.3405.102")));
        assert!(looks_installed(Some("86.0.616.0")));
    }
}
