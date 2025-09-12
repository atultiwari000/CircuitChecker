@echo off
REM Script based on EESIM's run.sh: https://github.com/danchitnis/EEsim/tree/main/Docker
REM Converted for Windows

REM NGSPICE_HOME="https://github.com/danchitnis/ngspice-sf-mirror"
set NGSPICE_HOME=https://git.code.sf.net/p/ngspice/ngspice
set NGSPICE_BRANCH=master

@REM REM Initialize Emscripten environment - check common installation paths
@REM if exist "C:\emsdk\emsdk_env.bat" (
@REM     call "C:\emsdk\emsdk_env.bat"
@REM ) else if exist "%USERPROFILE%\emsdk\emsdk_env.bat" (
@REM     call "%USERPROFILE%\emsdk\emsdk_env.bat"
@REM ) else (
@REM     echo ERROR: emsdk_env.bat not found. Please install Emscripten SDK or update the path.
@REM     echo Download from: https://emscripten.org/docs/getting_started/downloads.html
@REM     pause
@REM     exit /b 1
@REM )

echo Cloning ngspice from %NGSPICE_HOME%, branch %NGSPICE_BRANCH%

REM Create temp directory if it doesn't exist
if not exist "C:\temp" mkdir "C:\temp"
cd /d "C:\temp"

REM Remove existing ngspice directory if it exists
if exist "ngspice" (
    echo Removing existing ngspice directory...
    rmdir /s /q ngspice
)

REM Clone ngspice
git clone --depth 1 --branch %NGSPICE_BRANCH% %NGSPICE_HOME% ngspice

cd ngspice

REM Windows equivalent of sed commands using PowerShell
powershell -Command "(Get-Content .\configure.ac) -replace '-Wno-unused-but-set-variable', '-Wno-unused-const-variable' | Set-Content .\configure.ac"
powershell -Command "(Get-Content .\configure.ac) -replace 'AC_CHECK_FUNCS\(\[time getrusage\]\)', 'AC_CHECK_FUNCS([time])' | Set-Content .\configure.ac"
powershell -Command "(Get-Content .\src\frontend\control.c) -replace '#include \"ngspice/ngspice.h\"', '#include <emscripten.h>`n`n#include \"ngspice/ngspice.h\"' | Set-Content .\src\frontend\control.c"
powershell -Command "(Get-Content .\src\frontend\control.c) -replace 'freewl = wlist = getcommand\(string\);', 'emscripten_sleep(100);`n`n`t`tfreewl = wlist = getcommand(string);' | Set-Content .\src\frontend\control.c"

REM Run autogen.sh using bash (requires MSYS2 or Git Bash)
bash autogen.sh
if %errorlevel% neq 0 (
    echo ERROR: autogen.sh failed. Make sure you have MSYS2 or Git Bash installed.
    pause
    exit /b 1
)

if not exist "release" mkdir "release"
cd release

REM Run configure using bash
bash -c "emconfigure ../configure --disable-debug"
if %errorlevel% neq 0 (
    echo ERROR: emconfigure failed
    pause
    exit /b 1
)

REM Wait equivalent (pause for a moment)
timeout /t 2 /nobreak >nul

REM Update Makefile using PowerShell - correct path
if exist ".\src\Makefile" (
    powershell -Command "(Get-Content .\src\Makefile) -replace '\$\(ngspice_LDADD\) \$\(LIBS\)', '$(ngspice_LDADD) $(LIBS) -g1 -s ASYNCIFY=1 -s ASYNCIFY_ADVISE=0 -s ASYNCIFY_IGNORE_INDIRECT=0 -s ENVIRONMENT=\"web,worker\" -s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=1 -s EXPORT_ES6=1 -s EXTRA_EXPORTED_RUNTIME_METHODS=[\"FS\",\"Asyncify\"] -o spice.mjs' | Set-Content .\src\Makefile"
) else (
    echo ERROR: Makefile not found at .\src\Makefile
    pause
    exit /b 1
)

bash -c "emmake make"
if %errorlevel% neq 0 (
    echo ERROR: emmake failed
    pause
    exit /b 1
)

REM Wait equivalent
timeout /t 2 /nobreak >nul

cd src

REM Check if files exist before renaming/copying
if exist "spice.mjs" (
    ren spice.mjs spice.js
    echo Renamed spice.mjs to spice.js
) else (
    echo ERROR: spice.mjs not found
    pause
    exit /b 1
)

REM Create build directory and copy files
if not exist "%~dp0build" mkdir "%~dp0build"

if exist "spice.js" (
    copy spice.js "%~dp0build\"
    echo Copied spice.js to build directory
) else (
    echo ERROR: spice.js not found
)

if exist "spice.wasm" (
    copy spice.wasm "%~dp0build\"
    echo Copied spice.wasm to build directory
) else (
    echo ERROR: spice.wasm not found
)

echo Build completed!