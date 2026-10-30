/// Install-source detection for the anonymous check-in (H0).
///
/// Maps how Skima was installed to a short string the server sends in the
/// check-in payload. The Rust side detects the source because it has access
/// to OS APIs (Win32 `GetCurrentPackageFullName`, Tauri `bundle_type()`) that
/// the JS sidecar does not. The result is passed as `--install-source <word>`.

/// Returns true when the running executable lives inside an MSIX package
/// (i.e. it was installed from the Microsoft Store or sideloaded as MSIX).
///
/// Uses the Win32 API `GetCurrentPackageFullName`: outside an AppX/MSIX
/// container it returns `APPMODEL_ERROR_NO_PACKAGE` (15700).
#[cfg(target_os = "windows")]
pub fn is_msix() -> bool {
    use std::ffi::c_ulong;

    #[link(name = "kernel32")]
    unsafe extern "system" {
        fn GetCurrentPackageFullName(
            package_full_name_length: *mut c_ulong,
            package_full_name: *mut u16,
        ) -> i32;
    }

    const APPMODEL_ERROR_NO_PACKAGE: i32 = 15700;
    let mut len: c_ulong = 0;
    let rc = unsafe { GetCurrentPackageFullName(&mut len, std::ptr::null_mut()) };
    rc != APPMODEL_ERROR_NO_PACKAGE
}

#[cfg(not(target_os = "windows"))]
pub fn is_msix() -> bool {
    false
}

/// Detect the install source as a word for the check-in payload.
///
/// Windows: store (MSIX) > installer (NSIS/MSI) > unknown
/// Linux:   appimage (APPIMAGE env) > deb > unknown
/// macOS:   dmg > unknown
pub fn detect_install_source() -> &'static str {
    #[cfg(target_os = "windows")]
    {
        if is_msix() {
            return "store";
        }
        return "installer";
    }

    #[cfg(target_os = "linux")]
    {
        if std::env::var_os("APPIMAGE").is_some() {
            return "appimage";
        }
        return "deb";
    }

    #[cfg(target_os = "macos")]
    {
        return "dmg";
    }

    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    {
        return "unknown";
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detect_install_source_returns_known_value() {
        let source = detect_install_source();
        let valid = ["store", "installer", "appimage", "deb", "dmg", "unknown"];
        assert!(
            valid.contains(&source),
            "unexpected source: {}",
            source
        );
    }

    #[test]
    fn is_msix_returns_bool() {
        // On non-Windows (CI), this always returns false.
        // On Windows outside a package, also returns false.
        let _ = is_msix();
    }
}
