#!/bin/bash
echo "==================================================="
echo "🛡️ SOBERANO - DEPLOY SYSTEM (LINUX/CODESPACE)"
echo "==================================================="

echo "[+] VERIFICANDO MOTOR DO NAVEGADOR..."

# Detecta binário disponível
CHROME_BIN=$(which google-chrome-stable 2>/dev/null || which google-chrome 2>/dev/null || which chromium-browser 2>/dev/null || which chromium 2>/dev/null || echo "")

if [ -z "$CHROME_BIN" ]; then
    echo " -> [!] Navegador não encontrado. Instalando..."

    # Tenta instalar chromium (Debian/Ubuntu novo)
    sudo apt-get install -y chromium 2>/dev/null && CHROME_BIN=$(which chromium 2>/dev/null)

    # Fallback: instala Google Chrome via .deb oficial
    if [ -z "$CHROME_BIN" ]; then
        echo " -> [*] Baixando Google Chrome diretamente do servidor oficial..."
        wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb -O /tmp/chrome.deb
        sudo apt install -y /tmp/chrome.deb
        CHROME_BIN=$(which google-chrome-stable 2>/dev/null || which google-chrome 2>/dev/null || echo "")
    fi
fi

if [ -n "$CHROME_BIN" ]; then
    echo " -> [OK] Motor localizado: $CHROME_BIN"
    export CHROME_PATH="$CHROME_BIN"
else
    echo " -> [ERR] Falha ao instalar o navegador. Verifique a conexão ou permissões sudo."
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
