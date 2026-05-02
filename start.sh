#!/bin/bash
echo "==================================================="
echo "[!] LIMPANDO PROCESSOS FANTASMAS..."
pkill -f "chrome"
pkill -f "SOBERANO2.js"
echo "==================================================="
echo "[!] INICIANDO COORDENADOR E CLUSTER..."
npm start
