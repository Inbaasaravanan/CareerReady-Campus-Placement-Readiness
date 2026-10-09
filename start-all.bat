@echo off
title CareerReady AI Launcher
echo ========================================================
echo Starting CareerReady AI System
echo - MySQL Database (career_ready_db)
echo - Spring Boot Backend (http://localhost:8080)
echo   * Auto-launches Python ML Service (http://localhost:5000)
echo - Vite React Frontend (http://localhost:5173)
echo ========================================================
start "CareerReady Backend" cmd /k "cd /d %~dp0backend && mvn spring-boot:run"
start "CareerReady Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo All services launched!
