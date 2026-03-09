@echo off
setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "RUNTIME_ROOT=%%~fI"
set "VENV_DIR=%RUNTIME_ROOT%\.venv"
set "BOOTSTRAP_STAMP=%VENV_DIR%\.bootstrap-complete"

set "BACKEND="
set "NEXT_IS_BACKEND=0"
for %%A in (%*) do (
  if "!NEXT_IS_BACKEND!"=="1" (
    set "BACKEND=%%~A"
    set "NEXT_IS_BACKEND=0"
  ) else if "%%~A"=="--backend" (
    set "NEXT_IS_BACKEND=1"
  )
)

if "%BACKEND%"=="" (
  echo Voice Input runtime launcher requires --backend. 1>&2
  exit /b 1
)

set "PYTHON_EXE="
set "PYTHON_FLAG="
if not "%AUTOBYTEUS_VOICE_INPUT_PYTHON%"=="" (
  set "PYTHON_EXE=%AUTOBYTEUS_VOICE_INPUT_PYTHON%"
)

if "%PYTHON_EXE%"=="" (
  call :try_python "py" "-3.11"
  call :try_python "python3.11" ""
  call :try_python "py" "-3.10"
  call :try_python "python3.10" ""
  call :try_python "py" "-3.9"
  call :try_python "python3.9" ""
  call :try_python "py" "-3"
  call :try_python "python3" ""
  call :try_python "python" ""
)

if "%PYTHON_EXE%"=="" (
  echo AutoByteus Voice Input runtime could not find a usable Python interpreter. 1>&2
  exit /b 1
)

if not exist "%VENV_DIR%\Scripts\python.exe" (
  call "%PYTHON_EXE%" %PYTHON_FLAG% -m venv "%VENV_DIR%" || exit /b 1
)

if not exist "%BOOTSTRAP_STAMP%" (
  set "REQUIREMENTS_FILE=%RUNTIME_ROOT%\requirements-%BACKEND%.txt"
  if not exist "%REQUIREMENTS_FILE%" (
    echo Missing requirements file: %REQUIREMENTS_FILE% 1>&2
    exit /b 1
  )

  "%VENV_DIR%\Scripts\python.exe" -m pip install --upgrade pip >nul || exit /b 1
  "%VENV_DIR%\Scripts\python.exe" -m pip install --requirement "%REQUIREMENTS_FILE%" >nul || exit /b 1
  > "%BOOTSTRAP_STAMP%" echo ok
)

"%VENV_DIR%\Scripts\python.exe" "%RUNTIME_ROOT%\voice_input_worker.py" %*
exit /b %ERRORLEVEL%

:try_python
if not "%PYTHON_EXE%"=="" exit /b 0
"%~1" %~2 --version >nul 2>&1
if errorlevel 1 exit /b 0
set "PYTHON_EXE=%~1"
set "PYTHON_FLAG=%~2"
exit /b 0
