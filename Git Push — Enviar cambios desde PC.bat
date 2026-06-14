@echo off
setlocal EnableExtensions EnableDelayedExpansion

title Git Push — Enviar cambios desde PC

REM Mensaje de commit por parametro (opcional)
set "COMMIT_MSG=%~1"
if "%COMMIT_MSG%"=="" set "COMMIT_MSG=Actualizacion del sitio"

echo.
echo === Verificando Git ===
where git >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Git no esta instalado o no esta en el PATH.
  echo Instala Git desde https://git-scm.com/download/win
  pause
  exit /b 1
)

echo.
echo === Comprobando repo ===
if not exist ".git" (
  echo [ERROR] Esta carpeta no es un repositorio Git.
  pause
  exit /b 1
)

if not exist "index.html" (
  echo [ERROR] No se encontro index.html en esta carpeta.
  pause
  exit /b 1
)

echo.
echo === Creando backup de index.html ===

REM Detectar el numero mas alto en la carpeta Backup
set "MAX_NUM=0"
for %%F in ("Backup\antes de V FSA *.html") do (
  set "FNAME=%%~nF"
  set "NUMPART=!FNAME:antes de V FSA =!"
  set "NUMPART=!NUMPART:~0,4!"
  set /a "NUM=!NUMPART!"
  if !NUM! gtr !MAX_NUM! set "MAX_NUM=!NUM!"
)

REM Siguiente numero = MAX + 1
set /a "NEXT_NUM=!MAX_NUM! + 1"

REM Formatear con ceros a la izquierda (4 digitos)
set "NEXT_PAD=000!NEXT_NUM!"
set "NEXT_PAD=!NEXT_PAD:~-4!"

REM Obtener fecha de hoy en formato YYYY-MM-DD
for /f %%A in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd"') do set "TODAY=%%A"

set "BACKUP_NAME=Backup\antes de V FSA !NEXT_PAD! — !TODAY!.html"

copy "index.html" "!BACKUP_NAME!" >nul
if errorlevel 1 (
  echo [ERROR] No se pudo crear el backup.
  pause
  exit /b 1
)
echo Backup creado: !BACKUP_NAME!

echo.
echo === Preparando cambios ===
git add -A

echo.
echo === Haciendo commit: %COMMIT_MSG% ===
git commit -m "%COMMIT_MSG%"
if errorlevel 1 (
  echo (No habia cambios que commitear o ocurrio un error leve)
)

echo.
echo === Subiendo a GitHub (tu version local siempre tiene prioridad) ===
git push --force-with-lease origin main
if errorlevel 1 (
  echo   Reintentando con force...
  git push --force origin main
)
if errorlevel 1 (
  echo [ERROR] No se pudo hacer push. Verifica tu conexion o credenciales.
  pause
  exit /b 1
)

echo.
echo === Publicado! En pocos segundos se vera en GitHub Pages ===
echo URL: https://github.com/Alberthoma/Foresee-App
echo (Si no ves cambios, espera unos segundos y recarga con Ctrl+F5)
echo.
pause
