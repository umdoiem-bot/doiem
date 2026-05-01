@echo off
title SOBERANO - CLUSTER ENGINE V2
echo ===================================================
echo [!] LIMPANDO PROCESSOS FANTASMAS...
taskkill /f /im chrome.exe >nul 2>&1
echo ===================================================
echo [!] INICIANDO COORDENADOR E CLUSTER...
echo URL: http://localhost:3000
echo ===================================================
cd /d "%~dp0"
node UI/DASHBOARD/server.js
pause
