const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const proxy = require('express-http-proxy');
const { spawn, exec } = require('child_process');
const path = require('path');

const fs = require('fs');
const ROOT_DIR = path.join(__dirname, '..', '..');
const REGISTRY_PATH = path.join(ROOT_DIR, 'REGISTRY.json');
const COOKIES_PATH = path.join(ROOT_DIR, 'COOKIES.json');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ── Estado do Cockpit ───────────────────────────────────────────────────────

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// CLUSTER DE CONFIGURAÇÕES (Persistência e Estado Vivo)
let targets = {};
try {
    if (fs.existsSync(REGISTRY_PATH)) {
        const raw = JSON.parse(fs.readFileSync(REGISTRY_PATH));
        raw.forEach(item => { targets[item.id] = item.authUrl; });
    }
} catch (e) { console.log("Erro ao carregar REGISTRY.json:", e.message); }

const activeAgents = new Set(); 

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
            // Regex aprimorado: busca o ID ignorando o primeiro par de colchetes se for timestamp
            const matches = [...line.matchAll(/\[(.*?)\]/g)];
            const id = matches.length > 1 ? matches[1][1] : 
                       (matches.length === 1 && !matches[0][1].includes(':') ? matches[0][1] : null);
            
            if (id && id !== 'SYSTEM') activeAgents.add(id);

            io.emit('signal', { id, msg: line });
            console.log(line); // O terminal principal só exibe logs humanos, ignorando JSON base64
        });
    });

    soberanoProcess.on('close', () => {
        console.log('Motor encerrado. Reiniciando...');
        soberanoProcess = null;
        activeAgents.clear();
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
        socket.emit('instance-ready', { id, authUrl: targets[id], active: activeAgents.has(id) });
    });

    socket.on('register', (data) => {
        // Geração Sequencial Determinística (Ex: 01, 02, 03...)
        const count = Object.keys(targets).length;
        const id = (count + 1).toString().padStart(2, '0');
        
        targets[id] = data.authUrl;
        saveRegistry();
        io.emit('instance-ready', { id, authUrl: data.authUrl });
    });

    socket.on('launch', (data) => {
        const id = data.id;
        const authUrl = data.authUrl || targets[id];
        
        if (id && authUrl) {
            if (activeAgents.has(id)) return console.log(`[WARN] Agente ${id} já está ativo.`);
            sendToMotor({ type: 'LAUNCH', id, authUrl });
            console.log(`[EXEC] Comando de lançamento enviado: ${id}`);
        }
    });

    socket.on('terminate', (id) => {
        sendToMotor({ type: 'TERMINATE', id });
        activeAgents.delete(id);
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

// ── Inicialização do Sistema ───────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`\n===================================================`);
    console.log(`SOBERANO II — HF ENGINE: http://localhost:${PORT}`);
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

    // Tenta localizar o binário do Chromium para abrir o Cockpit
    let CHROME_BIN = null;
    try {
        const puppeteer = require('puppeteer');
        const pPath = puppeteer.executablePath();
        if (fs.existsSync(pPath)) CHROME_BIN = pPath;
    } catch (e) {}

    const url = `http://localhost:${PORT}`;
    
    if (CHROME_BIN) {
        console.log(`🚀 Abrindo Cockpit via Chromium: ${CHROME_BIN}`);
        exec(`"${CHROME_BIN}" "${url}"`, (err) => {
            if (err) exec(`start "" "${url}"`);
        });
    } else {
        // Fallback para navegador padrão do sistema
        exec(`start chrome "${url}"`, (err) => {
            if (err) exec(`start "" "${url}"`);
        });
    }
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`\n❌ [FALHA CRÍTICA] A porta ${PORT} já está em uso.`);
        console.error(`O Cockpit do SOBERANO já está rodando em outro terminal ou janela oculta.`);
        console.error(`MATE O PROCESSO ANTERIOR ANTES DE INICIAR UM NOVO.\n`);
        process.exit(1);
    }
});
