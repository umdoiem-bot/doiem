#!/bin/bash
echo "==================================================="
echo "🛡️ SOBERANO - DEPLOY SYSTEM (LINUX/CODESPACE)"
echo "==================================================="

echo "[+] VERIFICANDO MOTOR DO NAVEGADOR..."
CHROME_BIN=$(which google-chrome-stable 2>/dev/null || which google-chrome 2>/dev/null || which chromium-browser 2>/dev/null || which chromium 2>/dev/null || echo "")

if [ -n "$CHROME_BIN" ]; then
    echo " -> [OK] Chrome do sistema: $CHROME_BIN"
    export CHROME_PATH="$CHROME_BIN"
else
    echo " -> [OK] Usando Chromium embutido do Puppeteer (zero-config)."
fi

echo "==================================================="
if [ ! -d "node_modules" ]; then
    echo "[+] INSTALANDO DEPENDÊNCIAS NPM..."
    npm install
fi

echo "==================================================="
echo "[!] EXTERMINANDO PROCESSOS FANTASMAS..."
pkill -f "chrome" 2>/dev/null
pkill -f "SOBERANO2.js" 2>/dev/null
echo "==================================================="
echo "[!] IGNITANDO NODE COORDENADOR..."
npm start
