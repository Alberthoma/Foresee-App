@echo off
setlocal EnableExtensions

title Git Pull — Traer cambios del movil

echo.
echo === Verificando Git ===
where git >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Git no esta instalado o no esta en el PATH.
  pause
  exit /b 1
)

if not exist ".git" (
  echo [ERROR] Esta carpeta no es un repositorio Git.
  pause
  exit /b 1
)

echo.
echo === Trayendo cambios desde GitHub ===
git pull origin main
if errorlevel 1 (
  echo [ERROR] No se pudieron traer los cambios. Verifica tu conexion.
  pause
  exit /b 1
)

echo.
echo === Listo! Tu carpeta esta actualizada con los cambios del movil ===
echo.
pause
