@echo off
REM Levanta los 3 modulos en orden: IA -^> Backend -^> Frontend
REM Ejecutar desde la raiz del proyecto en Windows.

REM 1/3 Microservicio IA :8000
start "Microservicio-IA :8000" cmd /k "cd /d ""%~dp0microservicio-ia"" && call venv\Scripts\activate && python -m uvicorn main:app --host 127.0.0.1 --port 8000"
timeout /t 3 /nobreak >nul

REM 2/3 Backend :3000
start "Backend :3000" cmd /k "cd /d ""%~dp0backend"" && npm run dev"
timeout /t 3 /nobreak >nul

REM 3/3 Frontend :5173
start "Frontend :5173" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"
