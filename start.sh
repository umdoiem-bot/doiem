#!/bin/bash
echo "==================================================="
echo "🛡️ SOBERANO - DEPLOY SYSTEM (LINUX/CODESPACE)"
echo "==================================================="

echo "[+] VERIFICANDO MOTOR DO NAVEGADOR..."

# Detecta binário disponível
CHROME_BIN=$(which google-chrome-stable 2>/dev/null || which google-chrome 2>/dev/null || which chromium-browser 2>/dev/null || which chromium 2>/dev/null || echo "")

if [ -z "$CHROME_BIN" ]; then
    echo " -> [!] Chrome/Chromium não encontrado. Instalando via apt-get..."
    sudo apt-get update -qq
    sudo apt-get install -y -qq chromium-browser 2>/dev/null || \
    sudo apt-get install -y -qq chromium 2>/dev/null || \
    { echo " -> [ERR] Falha na instalação. Tente: sudo apt-get install -y chromium-browser"; exit 1; }
    CHROME_BIN=$(which chromium-browser 2>/dev/null || which chromium 2>/dev/null || echo "")
fi

if [ -n "$CHROME_BIN" ]; then
    echo " -> [OK] Motor localizado: $CHROME_BIN"
    export CHROME_PATH="$CHROME_BIN"
else
    echo " -> [ERR] Navegador ainda não encontrado após instalação!"
    exit 1
fi

echo "==================================================="
if [ ! -d "node_modules" ]; then
    echo "[+] INSTALANDO DEPENDÊNCIAS NPM..."
    npm install
fi

echo "==================================================="
echo "[!] EXTERMINANDO PROCESSOS FANTASMAS..."
pkill -f "chrome" 2>/dev/null; pkill -f "SOBERANO2.js" 2>/dev/null
echo "==================================================="
echo "[!] IGNITANDO NODE COORDENADOR..."
npm start
