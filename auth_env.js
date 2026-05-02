/**
 * AUTH_ENV.js — AUTENTICADOR DE AMBIENTE v2.0
 * =============================================
 * Roda um mini-browser interativo dentro do Replit.
 * Você controla o Chrome do servidor pelo seu próprio navegador.
 * O Google só verá o IP do Replit — nunca o seu IP pessoal.
 *
 * USO: npm run auth
 * DEPOIS: Acesse a URL do Replit na porta 5000
 */

const { addExtra } = require('puppeteer-extra');
const puppeteerCore = require('puppeteer-core');
const puppeteer = addExtra(puppeteerCore);
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

// ── Descoberta do Executável do Chrome/Chromium ──────────────────────────────
let CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
if (!fs.existsSync(CHROME_PATH)) {
    const fallbacks = ['/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/nix/store'];
    // Busca binário do Chromium instalado pelo Nix
    const which = require('child_process').execSync('which chromium 2>/dev/null || which chromium-browser 2>/dev/null || echo ""', {encoding: 'utf8'}).trim();
    CHROME_PATH = which || fallbacks.find(p => fs.existsSync(p)) || CHROME_PATH;
}

const AUTH_PORT = process.env.PORT || 5000;
const COOKIES_PATH = path.join(__dirname, 'COOKIES.json');
const PROFILE_DIR = path.join(__dirname, 'GHOST_PROFILE');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ── Interface HTML do Autenticador ───────────────────────────────────────────
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>🛡️ SOBERANO — Autenticador de Ambiente</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0a0a0f; color: #e0e0e0; font-family: 'Courier New', monospace; }
        header {
            background: linear-gradient(90deg, #0d1117, #1a1f2e);
            border-bottom: 1px solid #00ff9530;
            padding: 16px 24px;
            display: flex; align-items: center; gap: 12px;
        }
        header h1 { font-size: 1rem; color: #00ff95; letter-spacing: 4px; }
        header .badge { background: #ff4444; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; }
        #status-bar {
            background: #111; border-bottom: 1px solid #1e2430;
            padding: 8px 24px; font-size: 0.75rem; color: #888;
            display: flex; gap: 24px;
        }
        #status-bar span { color: #00ff95; }
        #viewport-wrap {
            display: flex; justify-content: center; align-items: flex-start;
            padding: 20px; background: #070b12; min-height: calc(100vh - 120px);
        }
        #viewport {
            position: relative; cursor: crosshair;
            box-shadow: 0 0 40px #00ff9520;
            border: 1px solid #00ff9540; border-radius: 4px;
            background: #000;
        }
        #screen { display: block; width: 100%; max-width: 1280px; }
        #controls {
            position: fixed; bottom: 20px; right: 20px;
            display: flex; flex-direction: column; gap: 8px; z-index: 100;
        }
        .btn {
            padding: 10px 20px; border: none; border-radius: 4px;
            font-family: 'Courier New', monospace; font-size: 0.8rem;
            cursor: pointer; letter-spacing: 2px; transition: all 0.2s;
        }
        .btn-save { background: #00ff95; color: #000; font-weight: bold; }
        .btn-save:hover { background: #00cc77; transform: scale(1.02); }
        .btn-reload { background: #1e2430; color: #00ff95; border: 1px solid #00ff9540; }
        .btn-reload:hover { background: #2a3344; }
        #log {
            position: fixed; bottom: 20px; left: 20px;
            background: #0d1117cc; border: 1px solid #1e2430;
            padding: 10px 14px; border-radius: 4px;
            font-size: 0.7rem; color: #666; max-width: 320px;
            backdrop-filter: blur(8px);
        }
        #log p { color: #00ff95; margin-bottom: 4px; font-size: 0.65rem; }
        .toast {
            position: fixed; top: 70px; left: 50%; transform: translateX(-50%);
            background: #00ff95; color: #000; padding: 10px 24px;
            border-radius: 4px; font-weight: bold; font-size: 0.85rem;
            display: none; z-index: 200; letter-spacing: 2px;
        }
    </style>
</head>
<body>
<header>
    <h1>🛡️ SOBERANO // AUTH ENGINE</h1>
    <div class="badge">IP: REPLIT</div>
</header>
<div id="status-bar">
    STATUS: <span id="st">CONECTANDO...</span>
    &nbsp;|&nbsp; IP DO SERVIDOR: <span id="ip">detectando...</span>
    &nbsp;|&nbsp; URL: <span id="url">—</span>
</div>
<div id="viewport-wrap">
    <div id="viewport">
        <img id="screen" src="" alt="Tela do Navegador Remoto" />
    </div>
</div>
<div class="toast" id="toast">✅ SESSÃO SALVA!</div>

<div id="controls">
    <button class="btn btn-save" onclick="saveSession()">💾 SALVAR SESSÃO</button>
    <button class="btn btn-reload" onclick="reloadPage()">🔄 RECARREGAR</button>
</div>
<div id="log">
    <p>// LOG DO SISTEMA</p>
    <div id="log-body">Aguardando conexão...</div>
</div>

<script src="/socket.io/socket.io.js"></script>
<script>
    const socket = io();
    const screen = document.getElementById('screen');
    const viewport = document.getElementById('viewport');
    const st = document.getElementById('st');
    const urlEl = document.getElementById('url');
    const logBody = document.getElementById('log-body');
    const ipEl = document.getElementById('ip');

    function addLog(msg) {
        logBody.innerHTML = '> ' + msg;
    }

    socket.on('connect', () => {
        st.textContent = 'ONLINE';
        st.style.color = '#00ff95';
        addLog('Socket conectado. Aguardando frame...');
    });

    // Recebe frames do Chrome como base64 JPEG
    socket.on('frame', (data) => {
        screen.src = 'data:image/jpeg;base64,' + data.img;
        urlEl.textContent = data.url || '—';
    });

    socket.on('ip', (ip) => { ipEl.textContent = ip; });
    socket.on('log', (msg) => addLog(msg));
    socket.on('saved', () => {
        const t = document.getElementById('toast');
        t.style.display = 'block';
        setTimeout(() => t.style.display = 'none', 3000);
    });

    // Captura cliques e manda para o Chrome via socket
    viewport.addEventListener('click', (e) => {
        const rect = screen.getBoundingClientRect();
        const scaleX = 1280 / rect.width;
        const scaleY = 800 / rect.height;
        socket.emit('click', {
            x: Math.round((e.clientX - rect.left) * scaleX),
            y: Math.round((e.clientY - rect.top) * scaleY)
        });
    });

    // Captura teclado
    document.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
        socket.emit('key', { key: e.key, code: e.code });
    });

    function saveSession() { socket.emit('save'); addLog('Salvando cookies...'); }
    function reloadPage() { socket.emit('reload'); }
</script>
</body>
</html>`);
});

// ── Lógica Principal ─────────────────────────────────────────────────────────
let page = null, client = null, browser = null;

async function startAuthBrowser() {
    console.log('🛡️  AUTENTICADOR v2 — Iniciando Motor...');
    console.log(`   Chrome: ${CHROME_PATH}`);

    if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true });

    browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true, // headless=true para funcionar sem VNC; controlado pelo nosso screencast
        userDataDir: PROFILE_DIR,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1280,800',
            '--disable-dev-shm-usage',
        ]
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    client = await page.createCDPSession();
    await client.send('Network.enable');

    // Inicia o Screencast — Chrome manda frames JPEG via CDP
    await client.send('Page.startScreencast', {
        format: 'jpeg', quality: 70, maxWidth: 1280, maxHeight: 800
    });

    await page.goto('https://accounts.google.com/signin', { waitUntil: 'networkidle2' });
    console.log('✅ Navegando para o Login do Google...');
}

io.on('connection', async (socket) => {
    console.log('🌐 Cockpit conectado. Iniciando transmissão...');
    socket.emit('log', 'Aguardando frames do Chrome...');

    // Detecta o IP externo do servidor
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        socket.emit('ip', data.ip);
    } catch(e) {
        socket.emit('ip', 'não detectado');
    }

    // Encaminha frames do CDP para o socket do cliente
    if (client) {
        client.on('Page.screencastFrame', async ({ data, sessionId }) => {
            socket.emit('frame', { img: data, url: page.url() });
            await client.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
        });
    }

    // Recebe clique do usuário e dispara no Chrome
    socket.on('click', async ({ x, y }) => {
        if (!page) return;
        await page.mouse.click(x, y);
    });

    // Recebe tecla do usuário e digita no Chrome
    socket.on('key', async ({ key }) => {
        if (!page) return;
        await page.keyboard.press(key).catch(() => {});
    });

    // Recarregar página
    socket.on('reload', async () => {
        if (!page) return;
        await page.reload({ waitUntil: 'networkidle2' });
        socket.emit('log', 'Página recarregada.');
    });

    // Salvar cookies em COOKIES.json
    socket.on('save', async () => {
        if (!client) return;
        try {
            const { cookies } = await client.send('Network.getCookies');
            fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
            console.log(`✅ ${cookies.length} cookies salvos em COOKIES.json`);
            socket.emit('log', `${cookies.length} cookies salvos com sucesso!`);
            socket.emit('saved');
        } catch (err) {
            socket.emit('log', 'Erro ao salvar: ' + err.message);
        }
    });
});

// ── Boot ─────────────────────────────────────────────────────────────────────
server.listen(AUTH_PORT, async () => {
    console.log('===================================================');
    console.log('🛡️  SOBERANO — AUTENTICADOR DE AMBIENTE v2.0');
    console.log('===================================================');
    console.log(`🌐 Painel: http://localhost:${AUTH_PORT}`);
    console.log('');
    console.log('→ Abra a URL acima no seu navegador.');
    console.log('→ Faça login normalmente na tela do Google.');
    console.log('→ Clique em [SALVAR SESSÃO] quando terminar.');
    console.log('===================================================');

    await startAuthBrowser().catch(err => {
        console.error('❌ Falha ao iniciar Chrome:', err.message);
    });
});
