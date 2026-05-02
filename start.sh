#!/bin/bash
echo "==================================================="
echo "🛡️ SOBERANO - DEPLOY SYSTEM (LINUX/REPLIT/NIX)"
echo "==================================================="

echo "[+] INJETANDO VARIAVEL DO MOTOR CHROME (NIX)..."
export CHROME_PATH=$(which chromium || which chromium-browser || which google-chrome-stable)

if [ -z "$CHROME_PATH" ]; then
    echo " -> [⚠️] Chromium não encontrado! Certifique-se que o replit.nix instalou as dependências!"
else
    echo " -> [OK] Motor atracado no caminho: $CHROME_PATH"
fi

echo "==================================================="
if [ ! -d "node_modules" ]; then
    echo "[+] INSTALANDO DEPEDÊNCIAS NPM..."
    npm install
fi

echo "==================================================="
echo "[!] EXTERMINANDO PROCESSOS FANTASMAS..."
pkill -f "chrome"
pkill -f "SOBERANO2.js"
echo "==================================================="
echo "[!] IGNITANDO NODE COORDENADOR..."
npm start
