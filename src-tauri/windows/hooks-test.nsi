; A tiny installer that runs the hooks in hooks.nsh against $INSTDIR, for CI
; (quality.yml, nsis-hooks). Exit code 0: skima-server.exe is writable afterwards.
; /DUNINSTALL runs the uninstall hook; /DNOHOOK runs none, to prove the test can fail.
Unicode true
RequestExecutionLevel user
SilentInstall silent
Name "Skima installer hooks test"
OutFile "${OUTFILE}"
InstallDir "$TEMP\skima-hooks-test"
; Relative includes resolve against this script's folder.
!include "hooks.nsh"

Section
  !ifndef NOHOOK
    !ifdef UNINSTALL
      !insertmacro NSIS_HOOK_PREUNINSTALL
    !else
      !insertmacro NSIS_HOOK_PREINSTALL
    !endif
  !endif
  ${If} ${FileExists} "$INSTDIR\skima-server.exe"
    ClearErrors
    FileOpen $0 "$INSTDIR\skima-server.exe" a
    ${If} ${Errors}
      SetErrorLevel 3
      Return
    ${EndIf}
    FileClose $0
  ${EndIf}
  SetErrorLevel 0
SectionEnd
