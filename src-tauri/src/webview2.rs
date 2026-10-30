//! Explains a missing WebView2 runtime in the Microsoft Store copy before any window is built.
//!
//! Without the runtime the window never opens and a release build has no console, so the
//! app looks like it did nothing. The NSIS installer installs the runtime; an MSIX cannot
//! run an installer, so only the Store copy checks. A false "missing" would stop a working
//! app from opening, so the check asks the WebView2 loader itself (the call that creates
//! the window) and treats only its documented "not installed" answers as missing.

/// `HRESULT_FROM_WIN32(ERROR_FILE_NOT_FOUND)`: the loader's documented "no runtime" error.
const NO_RUNTIME: i32 = 0x8007_0002_u32 as i32;

/// What `GetAvailableCoreWebView2BrowserVersionString` answered: the version string on
/// success (None if the loader returned no string), or the failing HRESULT.
pub type LoaderAnswer = Result<Option<String>, i32>;

/// Missing only when the loader says so: the no-runtime error, or success without a
/// version. Any other failure is not proof of absence, so it never blocks start-up.
/// Not behind a `cfg` so it is compiled and tested on every platform.
#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
pub fn runtime_missing(answer: &LoaderAnswer) -> bool {
    match answer {
        Ok(Some(version)) => version.trim().is_empty(),
        Ok(None) => true,
        Err(code) => *code == NO_RUNTIME,
    }
}

#[cfg(target_os = "windows")]
pub use windows_only::*;

#[cfg(target_os = "windows")]
mod windows_only {
    use super::{LoaderAnswer, runtime_missing};
    use webview2_com::Microsoft::Web::WebView2::Win32::GetAvailableCoreWebView2BrowserVersionString;
    use webview2_com::take_pwstr;
    use windows::Win32::UI::WindowsAndMessaging::{IDOK, MB_ICONWARNING, MB_OKCANCEL, MessageBoxW};
    use windows::core::{PCWSTR, PWSTR, w};

    const GET_IT: &str = "https://developer.microsoft.com/microsoft-edge/webview2/";

    pub fn is_missing() -> bool {
        let mut version = PWSTR::null();
        let result =
            unsafe { GetAvailableCoreWebView2BrowserVersionString(PCWSTR::null(), &mut version) };
        let answer: LoaderAnswer = match result {
            Ok(()) if version.is_null() => Ok(None),
            Ok(()) => Ok(Some(take_pwstr(version))),
            Err(e) => Err(e.code().0),
        };
        runtime_missing(&answer)
    }

    /// A native message box: no Tauri app or event loop exists yet.
    pub fn explain_and_exit() -> ! {
        let answer = unsafe {
            MessageBoxW(
                None,
                w!("Skima draws its window with Microsoft Edge WebView2, and this PC does not have it.\n\nSelect OK to open Microsoft's download page, install WebView2, then open Skima again."),
                w!("Skima needs WebView2"),
                MB_OKCANCEL | MB_ICONWARNING,
            )
        };
        if answer == IDOK {
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
    use super::{NO_RUNTIME, runtime_missing};

    #[test]
    fn the_loader_saying_no_runtime_is_missing() {
        assert!(runtime_missing(&Err(NO_RUNTIME)));
        assert!(runtime_missing(&Ok(None)), "success without a version string");
        assert!(runtime_missing(&Ok(Some(String::new()))), "success with an empty version");
    }

    #[test]
    fn a_version_is_a_runtime() {
        assert!(!runtime_missing(&Ok(Some("139.0.3405.102".into()))));
    }

    /// Anything else is not proof of absence: blocking on it would stop a working app.
    #[test]
    fn other_loader_errors_never_block() {
        assert!(!runtime_missing(&Err(0x8007_0005_u32 as i32)), "E_ACCESSDENIED");
        assert!(!runtime_missing(&Err(0x8000_4005_u32 as i32)), "E_FAIL");
    }
}
