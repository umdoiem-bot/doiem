const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const proxy = require('express-http-proxy');
const { spawn, exec } = require('child_process');
const path = require('path');

const fs = require('fs');
const ROOT_DIR = path.join(__dirname, '..', '..');
const REGISTRY_PATH = path.join(ROOT_DIR, 'REGISTRY.json');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
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

    soberanoProcess.stdout.on('data', (data) => {
        const raw = data.toString().trim();
        raw.split('\n').forEach(line => {
            try {
                // Tenta processar como pacote de dados (Telemetria)
                const packet = JSON.parse(line);
                if (packet.type === 'TELEMETRY') {
                    io.emit('telemetry', packet);
                    return;
                }
            } catch (e) {}

            // Caso não seja JSON, trata como log comum
            // Regex aprimorado: busca o ID ignorando o primeiro par de colchetes (timestamp)
            const matches = [...line.matchAll(/\[(.*?)\]/g)];
            const id = matches.length > 1 ? matches[1][1] : (matches.length > 0 ? matches[0][1] : null);
            
            io.emit('signal', { id, msg: line });
        });
        process.stdout.write(data);
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
});

const PORT = 3000;
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
    
    // Abre a interface visual automaticamente no CHROME após tudo carregar
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
