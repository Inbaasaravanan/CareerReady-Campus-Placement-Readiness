@echo off
title CareerReady AI Backend
echo ========================================================
echo Starting CareerReady AI Spring Boot Backend...
echo Connecting to MySQL database (career_ready_db)...
echo ========================================================
cd /d "%~dp0"
mvn spring-boot:run
pause
