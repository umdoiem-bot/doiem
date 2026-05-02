# 🛰️ SOBERANO | PURE CONSOLE
### High-Density Cluster Management & Strike Engine v6.0

Motor de Automação de Alta Densidade para o Google AI Studio com Mimetismo Humano,
Injeção de Sessão CDP Stealth e suporte completo a Windows e Linux/Replit.

---

## 📁 Estrutura de Pastas

```
MINER/
├── SOBERANO2.js              # Motor Multi-Aba (Puppeteer Stealth)
├── auth_env.js               # Autenticador de Ambiente (VNC/Visual)
├── server.js                 # Servidor Cockpit (Express + Socket.io)  [ref]
├── start_soberano.bat        # Launcher Windows (duplo clique)
├── start.sh                  # Launcher Linux/Replit (bash start.sh)
├── replit.nix                # Manifesto de Dependências Nix (Replit)
├── .replit                   # Configuração do botão RUN no Replit
├── .gitignore                # Proteção: exclui COOKIES.json e GHOST_PROFILE
├── package.json              # Dependências NPM
├── REGISTRY.json             # Banco de dados das instâncias (persistência)
├── COOKIES.json              # ⚠️ NÃO COMMITAR — credenciais de sessão Google
├── GHOST_PROFILE/            # ⚠️ NÃO COMMITAR — perfil Chrome do robô (gerado em runtime)
└── UI/
    └── DASHBOARD/
        ├── index.html        # Interface do Cockpit (UI)
        └── server.js         # Servidor Express + Socket.io
```

---

## 🛠️ Dependências de Sistema

### Para Windows (Desenvolvimento Local)
| Dependência        | Versão   | Link                                         |
|--------------------|----------|----------------------------------------------|
| Node.js            | v18+     | https://nodejs.org/                          |
| Google Chrome      | Qualquer | https://www.google.com/chrome/               |

- **Caminho Esperado do Chrome:** `C:\Program Files\Google\Chrome\Application\chrome.exe`
- O sistema detecta automaticamente o caminho. Se estiver diferente, defina a variável de ambiente: `CHROME_PATH=<seu_caminho>`

### Para Linux / Replit (Nuvem)
O arquivo `replit.nix` cuida de tudo automaticamente ao ser detectado pelo Replit:
```nix
pkgs.chromium       # Motor do navegador headless
pkgs.nodejs-18_x    # Runtime Node.js
pkgs.wget           # Utilitário de download
pkgs.nss            # Criptografia SSL para o Chromium
pkgs.freetype       # Renderização de fontes
pkgs.harfbuzz       # Shaping de texto
pkgs.fontconfig     # Gestão de fontes
pkgs.glib           # Biblioteca base do sistema
```

---

## 📦 Instalação das Dependências NPM

Na pasta raiz do projeto:
```bash
npm install
```

Pacotes instalados automaticamente:
- `express` — Servidor HTTP
- `socket.io` — Comunicação em tempo real (WebSockets)
- `puppeteer-core` — Motor de controle do Chrome
- `puppeteer-extra` — Wrapper de plugins para Puppeteer
- `puppeteer-extra-plugin-stealth` — Mimetismo Anti-Detecção

---

## 🔑 Configuração de Sessão (COOKIES.json)

Para que as instâncias iniciem já autenticadas no Google AI Studio:

1. No seu navegador pessoal, instale a extensão **Cookie-Editor** ou **EditThisCookie**.
2. Acesse `aistudio.google.com` e faça login normalmente.
3. Exporte todos os cookies em formato JSON.
4. Salve o arquivo como `COOKIES.json` na raiz do projeto.

> ⚠️ **ATENÇÃO:** O `COOKIES.json` está no `.gitignore` e JAMAIS deve ser commitado para o GitHub. São suas credenciais de sessão.

---

## 🚀 Como Iniciar

### Windows (Desenvolvimento Local)
```bat
start_soberano.bat
```
Ou via terminal:
```powershell
node UI/DASHBOARD/server.js
```

### Linux / Replit (Nuvem)
```bash
bash start.sh
```
O script cuida de:
1. Verificar e localizar o Chromium instalado pelo Nix
2. Instalar dependências NPM se `node_modules` não existir
3. Matar processos fantasmas anteriores
4. Iniciar o servidor Cockpit

### Via Botão Run no Replit
O arquivo `.replit` configura o botão verde **▶ Run** para executar `bash start.sh` automaticamente.

---

## 🔐 Autenticação de Ambiente (Primeira Vez em IP Novo)

Se estiver rodando em um servidor novo (VPS, Replit, cloud), o Google pode bloquear cookies criados em outro IP. Para registrar a sessão organicamente naquele IP:

```bash
npm run auth
```

Isso abre o Chrome **de forma visual** (VNC) para você logar manualmente. Após fechar o navegador, o perfil fica salvo permanentemente no diretório `GHOST_PROFILE/` daquela máquina.

> No Replit: execute esse comando dentro do **terminal gráfico** do VNC (não pelo shell lateral), para o Chrome aparecer na tela.

---

## 🎮 Interface do Cockpit

Acesse **`http://localhost:3000`** após iniciar o sistema.

| Função           | Descrição                                                     |
|------------------|---------------------------------------------------------------|
| Register Agent   | Cadastra uma URL do AI Studio no cluster                      |
| Manual Start     | Lança a instância no navegador invisível com cookies injetados|
| Deep Strike      | Envia comandos de teclado diretos para qualquer instância     |
| Preview          | Captura screenshot ao vivo de qualquer aba ativa             |
| Kill             | Fecha a aba e libera os recursos daquela instância            |

---

## ⚙️ Arquitetura do Sistema

```
[Cockpit (index.html)]
       ↕ WebSocket (Socket.io)
[Servidor (server.js)]
       ↕ stdin/stdout JSON piped
[Motor (SOBERANO2.js)]
       ↕ CDP (Chrome DevTools Protocol)
[Chrome/Chromium Headless]
       ↕ HTTPS
[Google AI Studio]
```

**Pipeline de Injeção de Sessão:**
1. Carrega `COOKIES.json` → Sanitiza campos inválidos (`sameSite null`, `storeId null`)
2. Abre sessão CDP (`Network.enable` + `Network.setCookies`)
3. Navega para a URL alvo com `networkidle2`
4. Verifica URL final — loga aviso se redirecionado para login

---

## 🛡️ Segurança e Proteções

| Item              | Proteção                                          |
|-------------------|---------------------------------------------------|
| `COOKIES.json`    | No `.gitignore` — nunca vai ao GitHub             |
| `GHOST_PROFILE/`  | No `.gitignore` — permanece local à máquina       |
| `node_modules/`   | No `.gitignore` — gerado via `npm install`        |
| Plugin Stealth    | Mascara sinais de automação do Chromium           |
| CDP Batch Inject  | Injeção atômica de tokens antes de qualquer rota  |

---

## 📋 Scripts Disponíveis (package.json)

```bash
npm start       # Inicia o servidor Cockpit
npm run auth    # Inicia o Autenticador Visual de Ambiente
```

---

> **Lei Fundamental:** *"O Código não é o Ativo; o Tempo é o único Recurso Finito. Todo bit de informação que não contribui para a decisão final é um parasita."*
> Opere com precisão. Zero latência. Delta neutro.
