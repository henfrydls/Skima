; NSIS installer hooks (bundle > windows > nsis > installerHooks in tauri.conf.json).
!include LogicLib.nsh

; skima-server.exe is the API sidecar that Skima.exe starts. When Skima.exe is killed
; (the installer's "Skima is running" prompt, Task Manager, a crash), the sidecar keeps
; running and keeps its file locked, so installing over it fails with "Error opening file
; for writing". Stop the copy in $INSTDIR only, then wait until Windows releases the file.
; Win32_Process gives the path of a 64-bit process to this 32-bit installer; Get-Process
; does not. The path goes through the environment so no quote in it can break the command.
!macro SKIMA_STOP_SIDECAR
  Push $0
  Push $1
  System::Call 'Kernel32::SetEnvironmentVariable(t "SKIMA_SIDECAR", t "$INSTDIR\skima-server.exe")'
  nsExec::ExecToLog 'powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $$_.ExecutablePath -eq $$env:SKIMA_SIDECAR } | ForEach-Object { Stop-Process -Id $$_.ProcessId -Force -ErrorAction SilentlyContinue; Wait-Process -Id $$_.ProcessId -Timeout 10 -ErrorAction SilentlyContinue }"'
  Pop $0
  ${If} ${FileExists} "$INSTDIR\skima-server.exe"
    StrCpy $0 0
    ${Do}
      ClearErrors
      FileOpen $1 "$INSTDIR\skima-server.exe" a
      ${IfNot} ${Errors}
        FileClose $1
        ${Break}
      ${EndIf}
      IntOp $0 $0 + 1
      ${If} $0 >= 20
        ${Break}
      ${EndIf}
      Sleep 500
    ${Loop}
  ${EndIf}
  Pop $1
  Pop $0
!macroend

!macro NSIS_HOOK_PREINSTALL
  !insertmacro SKIMA_STOP_SIDECAR
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  !insertmacro SKIMA_STOP_SIDECAR
!macroend
