/**
 * SOBERANO2.js — MOTOR MULTI-TAB v5.0
 * Gerencia múltiplas frentes de ataque em um único navegador Chrome.
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PROFILE_DIR = path.join(__dirname, 'GHOST_PROFILE');

let browser = null;
const activeTabs = {}; // { id: page }

function log(msg, type = 'INFO') {
    const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    const icons = { INFO: '🔹', SUCCESS: '✅', WARN: '⚠️', ERR: '❌', STRIKE: '🔥', SYSTEM: '⚙️' };
    console.log(`${icons[type] || '▪️'} [${time}] ${msg}`);
}

async function initBrowser() {
    if (browser) return browser;
    log('Iniciando Navegador Único...', 'SYSTEM');
    if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true });

    browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
        userDataDir: PROFILE_DIR,
        defaultViewport: null,
        ignoreDefaultArgs: ['--enable-automation'],
        args: [
            '--start-maximized',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--no-first-run',
            '--no-zygote',
            '--disable-background-timer-throttling',
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        ]
    });

    browser.on('disconnected', () => {
        log('Navegador fechado. Reiniciando cluster...', 'ERR');
        browser = null;
        process.exit(1);
    });

    return browser;
}

async function launchStrike(id, authUrl) {
    try {
        const b = await initBrowser();
        log(`Abrindo Nova Aba para Executor: ${id}`, 'SYSTEM');

        const page = await b.newPage();
        activeTabs[id] = page;

        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });


        // Sincronia Determinística
        log(`[${id}] Sincronizando...`, 'SYSTEM');
        await page.goto(authUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        log(`[${id}] Sincronizado. AGENTE SENTINEL ATIVADO.`, 'SUCCESS');

        // JITTER: Atraso aleatório para desincronizar o cluster (Evita picos de CPU)
        const jitter = Math.floor(Math.random() * 3000);

        setTimeout(() => {
            // FASE 3: SENTINEL AUTONOMOUS AGENT (Deep Persistence)
            const sentinelLoop = setInterval(async () => {
                try {
                    if (page.isClosed()) {
                        clearInterval(sentinelLoop);
                        return;
                    }

                    // Autonomia de Execução com Visão Profunda (Recursiva)
                    await page.evaluate(() => {
                        const findAndStrike = (root) => {
                            const overlays = root.querySelectorAll('.glue-cookie-notification-bar, .modal-backdrop');
                            overlays.forEach(o => o.remove());

                            // 2. A MASSAGEM E SINCRONIA: Localiza botões vitais
                            const codeToggle = root.querySelector('[data-test-id="code-editor-toggle"]');
                            const reloadApp = root.querySelector('button[aria-label*="Recarregar"]') || 
                                              root.querySelector('button[aria-label*="Reload"]');
                            
                            // Se o Reload estiver disponível, ele tem prioridade
                            if (reloadApp && !reloadApp.disabled) {
                                reloadApp.click();
                            }

                            if (codeToggle && !codeToggle.disabled) {
                                codeToggle.click();
                                setTimeout(() => codeToggle.click(), 500); 
                            }

                            const textarea = root.querySelector('.xterm-helper-textarea') || 
                                             root.querySelector('textarea') ||
                                             root.querySelector('[role="textbox"]');
                            if (textarea) textarea.focus();

                            const frames = root.querySelectorAll('iframe');
                            frames.forEach(f => {
                                try { if(f.contentDocument) findAndStrike(f.contentDocument); } catch(e){}
                            });
                        };
                        findAndStrike(document);
                    });

                    await page.keyboard.press('Shift');
                } catch (e) { }
            }, 30000); // Pulso de 30s (Mimetismo Humano)

            // FASE 4: COLD REFRESH (F5 Periodizado)
            const refreshLoop = setInterval(async () => {
                try {
                    if (page.isClosed()) {
                        clearInterval(refreshLoop);
                        return;
                    }
                    log(`[${id}] Executando Cold Refresh (F5)...`, 'SYSTEM');
                    await page.reload({ waitUntil: 'networkidle2' });
                    log(`[${id}] Refresh concluído. Agente reiniciado.`, 'SUCCESS');
                } catch (e) {}
            }, 900000); // 15 Minutos (Menos estresse no boot)
        }, jitter);

    } catch (err) {
        log(`[${id}] Falha na Aba: ${err.message}`, 'ERR');
    }
}

process.stdin.on('data', async (data) => {
    try {
        const raw = data.toString().trim();
        if (!raw) return;
        const packet = JSON.parse(raw);

        if (packet.type === 'LAUNCH') {
            await launchStrike(packet.id, packet.authUrl);
        } else if (packet.type === 'STRIKE') {
            const page = activeTabs[packet.id];
            if (page) {
                try {
                    log(`[${packet.id}] Deep Strike: "${packet.cmd}"`, 'STRIKE');
                    let strikeSuccess = false;
                    const frames = page.frames();
                    const selectors = ['.xterm-helper-textarea', 'textarea', '.terminal'];

                    for (const frame of frames) {
                        for (const sel of selectors) {
                            const target = await frame.$(sel);
                            if (target) {
                                await target.focus();
                                await frame.keyboard.type(packet.cmd);
                                await frame.keyboard.press('Enter');
                                strikeSuccess = true;
                                break;
                            }
                        }
                        if (strikeSuccess) break;
                    }
                    if (!strikeSuccess) {
                        await page.mouse.click(400, 400); 
                        await page.keyboard.type(packet.cmd);
                        await page.keyboard.press('Enter');
                    }
                } catch (err) { log(`[${packet.id}] Erro no Strike: ${err.message}`, 'ERR'); }
            }
        } else if (packet.type === 'TERMINATE') {
            const page = activeTabs[packet.id];
            if (page) await page.close();
            delete activeTabs[packet.id];
        }
    } catch (e) { }
});

log('Motor Multi-Tab aguardando comandos do Cockpit...', 'SYSTEM');
initBrowser();
