#!/bin/bash

# --- DESIGN SYSTEM NOYRON (ANSI COLORS) ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# --- CONFIGURAÇÕES DE PERFORMANCE ---
export NODE_OPTIONS="--max-old-space-size=4096"
export PORT=3000

clear
echo -e "${GREEN}"
echo " ███████╗ ██████╗ ██████╗ ███████╗██████╗  █████╗ ███╗   ██╗ ██████╗ "
echo " ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗████╗  ██║██╔═══██╗"
echo " ███████╗██║   ██║██████╔╝█████╗  ██████╔╝███████║██╔██╗ ██║██║   ██║"
echo " ╚════██║██║   ██║██╔══██╗██╔══╝  ██╔══██╗██╔══██║██║╚██╗██║██║   ██║"
echo " ███████║╚██████╔╝██████╔╝███████╗██║  ██║██║  ██║██║ ╚████║╚██████╔╝"
echo " ╚══════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ "
echo -e "${NC}"
echo -e "${GRAY}-- [ ARQUITETURA NOYRON ] -- [ STATISTICAL ARBITRAGE HUB ] -- [ LINUX DEPLOY ] --${NC}"
echo ""

echo -e "${YELLOW}[!] LIMPANDO INSTÂNCIAS RESIDUAIS...${NC}"
pkill -f "chrome" 2>/dev/null
pkill -f "chromium" 2>/dev/null
pkill -f "SOBERANO2.js" 2>/dev/null
echo -e "${GREEN}[OK] Ambiente sanitizado.${NC}"
echo ""

echo -e "${YELLOW}[!] DETECTANDO INFRAESTRUTURA DE NAVEGAÇÃO...${NC}"
CHROME_BIN=$(which google-chrome-stable 2>/dev/null || which google-chrome 2>/dev/null || which chromium-browser 2>/dev/null || which chromium 2>/dev/null || echo "")

if [ -n "$CHROME_BIN" ]; then
    echo -e " -> ${GREEN}[OK] Binário localizado: $CHROME_BIN${NC}"
    export CHROME_PATH="$CHROME_BIN"
else
    echo -e " -> ${RED}[WARN] Chrome não encontrado. Usando Chromium embutido.${NC}"
fi

if [ ! -d "node_modules" ]; then
    echo -e "${RED}[!] Dependências ausentes. Iniciando instalação...${NC}"
    npm install
fi

echo -e "${YELLOW}[!] IGNITANDO COCKPIT EM:${NC} http://localhost:${PORT}"
echo -e "${GRAY}(Processamento Paralelo: Cluster SOBERANO Ativado)${NC}"
echo ""

# Execução do Core
node UI/DASHBOARD/server.js
