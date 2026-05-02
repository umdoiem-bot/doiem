@echo off
SETLOCAL EnableDelayedExpansion
title SOBERANO // QUANT ENGINE - V2.5
mode con: cols=90 lines=25
color 0A

:: Configurações de Performance Noyron
set PORT=3000
set NODE_OPTIONS=--max-old-space-size=4096

cls
echo.
echo  [92m███████╗ ██████╗ ██████╗ ███████╗██████╗  █████╗ ███╗   ██╗ ██████╗ [0m
echo  [92m██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗████╗  ██║██╔═══██╗[0m
echo  [92m███████╗██║   ██║██████╔╝█████╗  ██████╔╝███████║██╔██╗ ██║██║   ██║[0m
echo  [92m╚════██║██║   ██║██╔══██╗██╔══╝  ██╔══██╗██╔══██║██║╚██╗██║██║   ██║[0m
echo  [92m███████║╚██████╔╝██████╔╝███████╗██║  ██║██║  ██║██║ ╚████║╚██████╔╝[0m
echo  [92m╚══════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ [0m
echo.
echo  [90m-- [ ARQUITETURA NOYRON ] -- [ STATISTICAL ARBITRAGE HUB ] --[0m
echo.

echo  [93m[!] LIMPANDO RESIDUOS DE MEMORIA...[0m
taskkill /f /im chrome.exe >nul 2>&1
taskkill /f /im chromedriver.exe >nul 2>&1
echo  [92m[OK] Pipeline de execucao limpo.[0m
echo.

echo  [93m[!] VERIFICANDO DEPENDENCIAS NODE.JS...[0m
if not exist "node_modules" (
    echo  [91m[ERR] node_modules nao localizado. Iniciando restauracao...[0m
    call npm install
)

echo  [93m[!] DISPARANDO COCKPIT EM:[0m http://localhost:%PORT%
echo  [90m(Thread Principal: server.js ^| Motor Cluster: SOBERANO2.js)[0m
echo.
echo  [92m[SISTEMA EM OPERACAO][0m
echo.

cd /d "%~dp0"
node UI/DASHBOARD/server.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [91m[X] O PROCESSO FOI INTERROMPIDO (CODIGO: %ERRORLEVEL%)[0m
    echo  [90mAguardando 10 segundos para reinicializacao forcada...[0m
    timeout /t 10
    goto :BEGIN
)
pause
