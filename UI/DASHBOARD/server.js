const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const proxy = require('express-http-proxy');
const { spawn, exec } = require('child_process');
const path = require('path');
const { addExtra } = require('puppeteer-extra');
const puppeteerCore = require('puppeteer-core');
const puppeteerAuth = addExtra(puppeteerCore);
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteerAuth.use(StealthPlugin());

const fs = require('fs');
const ROOT_DIR = path.join(__dirname, '..', '..');
const REGISTRY_PATH = path.join(ROOT_DIR, 'REGISTRY.json');
const COOKIES_PATH = path.join(ROOT_DIR, 'COOKIES.json');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ── Estado do Autenticador de Ambiente ──────────────────────────────────────
let authBrowser = null, authPage = null, authClient = null;

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ── ROTA DO AUTENTICADOR DE AMBIENTE (Browser-in-Browser) ───────────────────
app.get('/auth', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>🛡️ SOBERANO — Auth Engine</title>
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:#0a0a0f;color:#e0e0e0;font-family:'Courier New',monospace}
        header{background:linear-gradient(90deg,#0d1117,#1a1f2e);border-bottom:1px solid #00ff9530;padding:14px 24px;display:flex;align-items:center;gap:12px}
        header h1{font-size:.9rem;color:#00ff95;letter-spacing:4px}
        .badge{background:#ff4444;color:#fff;padding:2px 8px;border-radius:4px;font-size:.65rem}
        #bar{background:#111;border-bottom:1px solid #1e2430;padding:6px 24px;font-size:.72rem;color:#666;display:flex;gap:20px}
        #bar span{color:#00ff95}
        #wrap{display:flex;justify-content:center;padding:16px;background:#070b12;min-height:calc(100vh - 100px)}
        #screen{display:block;max-width:100%;border:1px solid #00ff9540;border-radius:4px;cursor:crosshair;background:#000;box-shadow:0 0 30px #00ff9515}
        #ctrl{position:fixed;bottom:20px;right:20px;display:flex;flex-direction:column;gap:8px;z-index:99}
        .btn{padding:10px 18px;border:none;border-radius:4px;font-family:'Courier New',monospace;font-size:.75rem;cursor:pointer;letter-spacing:2px;transition:all .2s}
        .save{background:#00ff95;color:#000;font-weight:700}
        .save:hover{background:#00cc77}
        .rel{background:#1e2430;color:#00ff95;border:1px solid #00ff9540}
        #log{position:fixed;bottom:20px;left:20px;background:#0d1117cc;border:1px solid #1e2430;padding:10px 14px;border-radius:4px;font-size:.68rem;color:#666;max-width:300px;backdrop-filter:blur(8px)}
        #log p{color:#00ff95;margin-bottom:4px;font-size:.62rem}
        .toast{position:fixed;top:70px;left:50%;transform:translateX(-50%);background:#00ff95;color:#000;padding:10px 24px;border-radius:4px;font-weight:700;font-size:.85rem;display:none;z-index:200;letter-spacing:2px}
        #start-btn{margin:16px auto;display:block;padding:12px 32px;background:#00ff95;color:#000;border:none;border-radius:4px;font-family:'Courier New',monospace;font-size:.9rem;font-weight:700;cursor:pointer;letter-spacing:3px}
    </style>
</head>
<body>
<header>
    <h1>🛡️ SOBERANO // AUTH ENGINE</h1>
    <div class="badge">IP: SERVIDOR</div>
</header>
<div id="bar">STATUS: <span id="st">AGUARDANDO</span> &nbsp;|&nbsp; IP: <span id="ip">...</span> &nbsp;|&nbsp; URL: <span id="url">—</span></div>
<div id="wrap">
    <div>
        <button id="start-btn" onclick="startAuth()">▶ INICIAR NAVEGADOR REMOTO</button>
        <img id="screen" src="" alt="" style="display:none" />
    </div>
</div>
<div class="toast" id="toast">✅ SESSÃO SALVA!</div>
<div id="ctrl">
    <button class="btn save" onclick="save()">💾 SALVAR SESSÃO</button>
    <button class="btn rel" onclick="rel()">🔄 RECARREGAR</button>
</div>
<div id="log"><p>// AUTH LOG</p><div id="lb">Pronto para iniciar...</div></div>
<script src="/socket.io/socket.io.js"></script>
<script>
const sock = io('/auth');
const scr = document.getElementById('screen');
const lb = document.getElementById('lb');
const st = document.getElementById('st');
const ip = document.getElementById('ip');
const urlEl = document.getElementById('url');

sock.on('connect', () => { st.textContent='ONLINE'; st.style.color='#00ff95'; });
sock.on('ip', v => ip.textContent = v);
sock.on('log', m => lb.textContent = '> ' + m);
sock.on('frame', d => {
    scr.style.display='block';
    document.getElementById('start-btn').style.display='none';
    scr.src='data:image/jpeg;base64,'+d.img;
    urlEl.textContent=d.url||'—';
});
sock.on('saved', () => {
    const t=document.getElementById('toast');
    t.style.display='block';
    setTimeout(()=>t.style.display='none',3000);
});

scr.addEventListener('click', e => {
    const r=scr.getBoundingClientRect();
    sock.emit('click',{x:Math.round((e.clientX-r.left)*(1280/r.width)),y:Math.round((e.clientY-r.top)*(800/r.height))});
});
document.addEventListener('keydown', e => {
    if(['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
    sock.emit('key',{key:e.key});
});

function startAuth() { sock.emit('start'); lb.textContent='Iniciando navegador...'; }
function save() { sock.emit('save'); }
function rel() { sock.emit('reload'); }
<\/script>
</body></html>`);
});

// CLUSTER DE CONFIGURAÇÕES (Persistência)
const targets = {};

function saveRegistry() {
    const data = Object.keys(targets).map(id => ({ id, authUrl: targets[id] }));
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(data, null, 2));
}

app.use('/target/:id', (req, res, next) => {
    const id = req.params.id;
    const target = targets[id];
    if (!target) return res.status(404).send('Alvo não localizado.');

    proxy(target, {
        proxyReqPathResolver: (r) => r.url,
        userResHeaderDecorator(headers) {
            headers['access-control-allow-origin'] = '*';
            delete headers['content-security-policy'];
            delete headers['x-frame-options'];
            return headers;
        }
    })(req, res, next);
});

// MOTOR ÚNICO (GERENCIADOR DE ABAS)
let soberanoProcess = null;

function startMotor() {
    if (soberanoProcess) return;

    soberanoProcess = spawn('node', [path.join(ROOT_DIR, 'SOBERANO2.js')], {
        cwd: ROOT_DIR
    });

    let stdoutBuffer = '';
    soberanoProcess.stdout.on('data', (data) => {
        stdoutBuffer += data.toString();
        const lines = stdoutBuffer.split('\n');
        stdoutBuffer = lines.pop(); // Mantém o chunk incompleto para o próximo evento

        lines.forEach(line => {
            line = line.trim();
            if (!line) return;

            try {
                // Tenta processar como pacote de dados (Telemetria)
                const packet = JSON.parse(line);
                if (packet.type === 'TELEMETRY' || packet.type === 'PREVIEW_DATA') {
                    io.emit(packet.type.toLowerCase().replace('_', '-'), packet);
                    return;
                }
            } catch (e) {}

            // Caso não seja JSON, trata como log comum
            // Regex aprimorado: busca o ID ignorando o primeiro par de colchetes (timestamp)
            const matches = [...line.matchAll(/\[(.*?)\]/g)];
            const id = matches.length > 1 ? matches[1][1] : (matches.length > 0 ? matches[0][1] : null);
            
            io.emit('signal', { id, msg: line });
            console.log(line); // O terminal principal só exibe logs humanos, ignorando JSON base64
        });
    });

    soberanoProcess.on('close', () => {
        console.log('Motor encerrado. Reiniciando...');
        soberanoProcess = null;
        setTimeout(startMotor, 3000);
    });
}

function sendToMotor(packet) {
    if (soberanoProcess) {
        soberanoProcess.stdin.write(JSON.stringify(packet) + '\n');
    }
}

io.on('connection', (socket) => {
    console.log('Sentinel vinculado ao Cockpit.');

    // SINCRONIZA INSTÂNCIAS JÁ ATIVAS OU SALVAS
    Object.keys(targets).forEach(id => {
        socket.emit('instance-ready', { id, authUrl: targets[id] });
    });

    socket.on('register', (data) => {
        const id = Date.now().toString();
        targets[id] = data.authUrl;
        saveRegistry();
        io.emit('instance-ready', { id, authUrl: data.authUrl });
    });

    socket.on('launch', (data) => {
        const id = data.id;
        const authUrl = data.authUrl || targets[id];
        
        if (id && authUrl) {
            sendToMotor({ type: 'LAUNCH', id, authUrl });
            console.log(`[EXEC] Comando de lançamento enviado: ${id}`);
        }
    });

    socket.on('terminate', (id) => {
        sendToMotor({ type: 'TERMINATE', id });
        delete targets[id];
        saveRegistry();
    });

    socket.on('execute-command', (data) => {
        sendToMotor({ type: 'STRIKE', id: data.id, cmd: data.cmd });
    });

    socket.on('request-preview', (id) => {
        sendToMotor({ type: 'PREVIEW', id });
    });
});

// ── NAMESPACE DO AUTENTICADOR (/auth) ──────────────────────────────────────
const authNS = io.of('/auth');

async function launchAuthBrowser() {
    if (authBrowser) return;
    let chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    if (!fs.existsSync(chromePath)) {
        try { chromePath = require('child_process').execSync('which chromium 2>/dev/null || which chromium-browser 2>/dev/null || echo ""', {encoding:'utf8'}).trim() || chromePath; } catch(e) {}
    }
    const PROFILE_DIR = path.join(ROOT_DIR, 'GHOST_PROFILE');
    if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true });
    authBrowser = await puppeteerAuth.launch({
        executablePath: chromePath, headless: true,
        userDataDir: PROFILE_DIR,
        args: ['--no-sandbox','--disable-setuid-sandbox','--window-size=1280,800','--disable-dev-shm-usage']
    });
    authPage = await authBrowser.newPage();
    await authPage.setViewport({ width: 1280, height: 800 });
    authClient = await authPage.createCDPSession();
    await authClient.send('Network.enable');
    await authClient.send('Page.startScreencast', { format:'jpeg', quality:70, maxWidth:1280, maxHeight:800 });
    await authPage.goto('https://accounts.google.com/signin', { waitUntil: 'networkidle2', timeout: 0 });
    logSistema('Auth Browser iniciado → Google Login');
}

authNS.on('connection', async (socket) => {
    // Detecta IP externo do servidor
    try {
        const resp = await fetch('https://api.ipify.org?format=json');
        const data = await resp.json();
        socket.emit('ip', data.ip);
    } catch(e) { socket.emit('ip','n/a'); }

    if (authClient) {
        authClient.on('Page.screencastFrame', async ({ data, sessionId }) => {
            socket.emit('frame', { img: data, url: authPage ? authPage.url() : '' });
            await authClient.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
        });
    }

    socket.on('start', async () => {
        await launchAuthBrowser().catch(e => socket.emit('log', 'Erro: ' + e.message));
        socket.emit('log', 'Navegador remoto iniciado. Faça o login na tela acima.');
        if (authClient) {
            authClient.on('Page.screencastFrame', async ({ data, sessionId }) => {
                socket.emit('frame', { img: data, url: authPage ? authPage.url() : '' });
                await authClient.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
            });
        }
    });

    socket.on('click', async ({ x, y }) => { if (authPage) await authPage.mouse.click(x, y); });
    socket.on('key', async ({ key }) => { if (authPage) await authPage.keyboard.press(key).catch(() => {}); });
    socket.on('reload', async () => { if (authPage) { await authPage.reload({ waitUntil: 'networkidle2' }); socket.emit('log','Recarregado.'); } });

    socket.on('save', async () => {
        if (!authClient) return socket.emit('log', 'Navegador não iniciado.');
        try {
            const { cookies } = await authClient.send('Network.getCookies');
            fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
            socket.emit('log', `${cookies.length} cookies salvos em COOKIES.json!`);
            socket.emit('saved');
            logSistema(`Auth: ${cookies.length} cookies extraídos e salvos.`);
        } catch(e) { socket.emit('log', 'Erro ao salvar: ' + e.message); }
    });
});

function logSistema(msg) { console.log(`⚙️  ${msg}`); }

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`\n===================================================`);
    console.log(`SENTINEL MULTI-TAB HUB: http://localhost:${PORT}`);
    console.log(`===================================================\n`);

    // CARREGAR REGISTRO EXISTENTE (Silent Load)
    if (fs.existsSync(REGISTRY_PATH)) {
        try {
            const saved = JSON.parse(fs.readFileSync(REGISTRY_PATH));
            saved.forEach(inst => {
                targets[inst.id] = inst.authUrl;
            });
            console.log(`Registro carregado em Standby: ${saved.length} instâncias mapeadas.`);
        } catch (e) { console.error('Erro ao ler REGISTRY.json'); }
    }

    startMotor();
    console.log(`⚙️  SISTEMA EM STANDBY: Aguardando comandos do Cockpit...`);
    
    // Abre a interface visual automaticamente no CHROME nativo
    exec(`start chrome "http://localhost:${PORT}"`, (err) => {
        if (err) {
            // Fallback caso chrome não esteja no PATH
            exec(`start "" "http://localhost:${PORT}"`);
        }
    });
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`\n❌ [FALHA CRÍTICA] A porta ${PORT} já está em uso.`);
        console.error(`O Cockpit do SOBERANO já está rodando em outro terminal ou janela oculta.`);
        console.error(`MATE O PROCESSO ANTERIOR ANTES DE INICIAR UM NOVO.\n`);
        process.exit(1);
    }
});
