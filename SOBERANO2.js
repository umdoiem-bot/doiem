/**
 * SOBERANO2.js — HF ENGINE v6.2
 * High-Frequency Deterministic Execution & Cluster Consolidation.
 */
const { addExtra } = require('puppeteer-extra');
const puppeteerCore = require('puppeteer-core');
const puppeteer = addExtra(puppeteerCore);
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const path = require('path');

// DESCOBERTA DINÂMICA DO CHROMIUM (Foco Exclusivo: Windows Native)
let CHROME_PATH = process.env.CHROME_PATH;

if (!CHROME_PATH) {
    try {
        const puppeteer = require('puppeteer');
        CHROME_PATH = puppeteer.executablePath();
    } catch(e) {}
}

const COMMON_PATHS = [
    CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(process.env.USERPROFILE || '', 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe')
];

CHROME_PATH = COMMON_PATHS.find(p => p && fs.existsSync(p));

if (!CHROME_PATH) {
    log('FALHA CRÍTICA: Binário do Chrome não localizado! Execute: npx puppeteer browsers install chrome', 'ERR');
    process.exit(1);
}

log(`Motor de Renderização Vinculado: ${CHROME_PATH}`, 'SYSTEM');
const PROFILE_DIR = path.join(__dirname, 'GHOST_PROFILE');

let browser = null;
const activeTabs = {}; // { id: page }

function log(msg, type = 'INFO', id = 'SYSTEM') {
    const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    const icons = { INFO: '🔹', SUCCESS: '✅', WARN: '⚠️', ERR: '❌', STRIKE: '🔥', SYSTEM: '⚙️' };
    console.log(`${icons[type] || '▪️'} [${time}] [${id}] ${msg}`);
}

async function initBrowser() {
    if (browser) return browser;
    log('Iniciando Navegador Único...', 'SYSTEM');
    if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true });

    browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'shell', // Ativa o motor mais rápido e leve disponível (bypass total de UI)
        userDataDir: PROFILE_DIR,
        defaultViewport: { width: 1280, height: 720 },
        ignoreDefaultArgs: ['--enable-automation'],
        args: [
            '--start-maximized',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--use-gl=angle',
            '--use-angle=swiftshader', // Força renderização via CPU (SwiftShader)
            '--disable-dev-shm-usage',
            '--no-first-run',
            '--no-zygote',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-breakpad',
            '--disable-component-extensions-with-background-pages',
            '--disable-extensions',
            '--disable-features=TranslateUI,BlinkGenPropertyTrees',
            '--disable-ipc-flooding-protection',
            '--disable-renderer-backgrounding',
            '--enable-features=NetworkService,NetworkServiceInProcess',
            '--force-color-profile=srgb',
            '--mute-audio',
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            '--disable-gpu-shader-disk-cache',
            '--disk-cache-size=1',
            '--media-cache-size=1',
            '--disable-bundled-ppapi-flash',
            '--no-pings',
            '--v8-cache-options=none',
            '--disable-features=IsolateOrigins,site-per-process', // Consolida abas em menos processos (Economia massiva de RAM)
            '--js-flags="--max-old-space-size=128"' // Força o JS de cada aba a ser extremamente econômico
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
        log(`Abrindo Nova Aba para Executor.`, 'SYSTEM', id);

        const page = await b.newPage();
        activeTabs[id] = page;

        // ⚡ OTIMIZAÇÃO NOYRON: BLOQUEIO EQUILIBRADO (STABLE MODE)
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            // Bloqueio Agressivo de Recursos e Telemetria Parasita
            const url = req.url().toLowerCase();
            const resourceType = req.resourceType();
            
            const isAdsOrAnalytics = url.includes('google-analytics') || 
                                     url.includes('googletagmanager') || 
                                     url.includes('doubleclick') || 
                                     url.includes('fb-client');

            if (['image', 'media', 'font', 'stylesheet'].includes(resourceType) || isAdsOrAnalytics) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.evaluateOnNewDocument(() => {
            // Mock de Visibilidade: Impede que o Google perceba que a aba está em "background"
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
            Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
            
            // Bypass de Throttling de Timers
            window.addEventListener('visibilitychange', (e) => e.stopImmediatePropagation(), true);
        });

        // INJEÇÃO DA SESSÃO PRINCIPAL via CDP (Batch)
        const cookiePath = path.join(__dirname, 'COOKIES.json');
        if (fs.existsSync(cookiePath)) {
            try {
                let cookies = JSON.parse(fs.readFileSync(cookiePath));
                cookies = cookies.map(c => {
                    if (c.sameSite === null || c.sameSite === 'no_restriction') delete c.sameSite;
                    if (c.storeId === null) delete c.storeId;
                    return c;
                });
                
                const client = await page.createCDPSession();
                await client.send('Network.enable');
                await client.send('Network.setCookies', { cookies });
                
                log(`Cookies de sessão carregados via CDP Stealth.`, 'SYSTEM', id);
            } catch (err) {
                log(`Falha ao analisar COOKIES.json: ${err.message}`, 'WARN', id);
            }
        }

        // Sincronia Determinística
        log(`Sincronizando...`, 'SYSTEM', id);
        await page.goto(authUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        
        const finalUrl = page.url();
        if (finalUrl.includes('accounts.google.com') || finalUrl.includes('signin')) {
            log(`⚠️ REDIRECIONADO PARA LOGIN. Sessão/IP revogados pela Google.`, 'WARN', id);
        } else {
            log(`Sincronizado. AGENTE SENTINEL ATIVADO.`, 'SUCCESS', id);
        }

        // JITTER: Atraso aleatório para desincronizar o cluster (Evita picos de CPU)
        const jitter = Math.floor(Math.random() * 3000);

        setTimeout(() => {
            // FASE 3: SENTINEL AUTONOMOUS AGENT (Deep Persistence & Reactive Recovery)
            let failureCount = 0;
            const sentinelLoop = setInterval(async () => {
                try {
                    if (page.isClosed()) {
                        clearInterval(sentinelLoop);
                        return;
                    }

                    // Autonomia de Execução com Visão Ultra-Profunda
                    const recovered = await page.evaluate(() => {
                        const deepStrike = (root) => {
                            let found = false;
                            root.querySelectorAll('.glue-cookie-notification-bar, .modal-backdrop, .cdk-overlay-container').forEach(o => o.remove());

                            // BUSCA POR BOTÕES DE RESURREIÇÃO (Com Validação de Texto)
                            const resurrectionSelectors = [
                                'button[aria-label*="Reconnect"]', 'button[aria-label*="Reload"]',
                                'button[aria-label*="Resume"]', 'button[aria-label*="Retry"]',
                                'ms-reconnect-button'
                            ];

                            // Busca básica por seletores conhecidos
                            for (const selector of resurrectionSelectors) {
                                const btn = root.querySelector(selector);
                                if (btn && !btn.disabled) { btn.click(); found = true; }
                            }

                            // Busca avançada por texto em botões genéricos do Material Design
                            if (!found) {
                                const materialBtns = root.querySelectorAll('.ms-button-primary, .mat-mdc-button-touch-target, button');
                                for (const btn of materialBtns) {
                                    const text = (btn.innerText || '').toLowerCase();
                                    if (text.includes('reconnect') || text.includes('retry') || text.includes('reconectar') || text.includes('tentar novamente')) {
                                        if (!btn.disabled) { btn.click(); found = true; break; }
                                    }
                                }
                            }

                            // 3. SINCRONIA DE ATIVIDADE E ANTI-LEAK
                            const terminal = root.querySelector('.ms-autoscroll-container') || root.querySelector('.xterm-viewport');
                            if (terminal) {
                                terminal.scrollTop += 1;
                                terminal.scrollTop -= 1;
                            }

                            const logNodes = root.querySelectorAll('.ms-log-line, .xterm-rows > div');
                            if (logNodes.length > 5000) {
                                for(let i=0; i<1000; i++) logNodes[i].remove();
                            }

                            const codeToggle = root.querySelector('[data-test-id="code-editor-toggle"]');
                            if (codeToggle) codeToggle.click();

                            const textarea = root.querySelector('.xterm-helper-textarea') || root.querySelector('textarea');
                            if (textarea) {
                                textarea.focus();
                                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                            }

                            // Varre Shadow Roots e Iframes recursivamente
                            const everything = root.querySelectorAll('*');
                            everything.forEach(el => { if (el.shadowRoot) found = deepStrike(el.shadowRoot) || found; });
                            const frames = root.querySelectorAll('iframe');
                            frames.forEach(f => { try { if(f.contentDocument) found = deepStrike(f.contentDocument) || found; } catch(e){} });
                            
                            return found;
                        };
                        return deepStrike(document);
                    });

                    if (recovered) {
                        failureCount++;
                        log(`Detectada Instabilidade (Reparo ${failureCount}/3)`, 'WARN', id);
                    } else {
                        failureCount = 0;
                    }

                    // GATILHO REATIVO: Se falhar em se recuperar via DOM 3x, força Refresh imediato
                    if (failureCount >= 3) {
                        log(`Falha crítica persistente. Forçando Hard Refresh Reativo...`, 'ERR', id);
                        failureCount = 0;
                        await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
                        return;
                    }

                    await page.mouse.move(Math.random() * 50, Math.random() * 50);
                    await page.mouse.wheel({ deltaY: 1 });
                    await page.keyboard.press('Shift');
                } catch (e) { }
            }, 15000); // HF Pulse: 15s (Otimização do Caminho Crítico)

            // FASE 4: COLD REFRESH (Ciclo de Segurança Reduzido)
            const refreshLoop = setInterval(async () => {
                if (page.isClosed()) return clearInterval(refreshLoop);
                try {
                    log(`Sincronia Preventiva (Ciclo 5m)...`, 'SYSTEM', id);
                    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
                } catch (e) {}
            }, 300000); // 5 Minutos (300.000 ms)
        }, jitter);

    } catch (err) {
        log(`Falha na Aba: ${err.message}`, 'ERR', id);
        if (err.message.includes('Timeout') || err.message.includes('Navigation')) {
            log(`Rota Crítica obstruída (Timeout). Reiniciando tentativa em 5s...`, 'WARN', id);
            setTimeout(() => launchStrike(id, authUrl), 5000);
        }
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
                    log(`Deep Strike: "${packet.cmd}"`, 'STRIKE', packet.id);
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
                } catch (err) { log(`Erro no Strike: ${err.message}`, 'ERR', packet.id); }
            }
        } else if (packet.type === 'TERMINATE') {
            const page = activeTabs[packet.id];
            if (page) await page.close();
            delete activeTabs[packet.id];
        } else if (packet.type === 'PREVIEW') {
            const page = activeTabs[packet.id];
            if (page && !page.isClosed()) {
                try {
                    // Sincronia de Software: CPU precisa de mais tempo para rasterizar sem GPU
                    await new Promise(r => setTimeout(r, 1200));
                    
                    const base64 = await page.screenshot({ 
                        encoding: 'base64', 
                        type: 'jpeg', 
                        quality: 70,
                        fromSurface: true
                    });
                    console.log(JSON.stringify({ type: 'PREVIEW_DATA', id: packet.id, image: base64 }));
                } catch (err) {
                    if (!err.message.includes('Target closed')) {
                        log(`Falha ao capturar preview: ${err.message}`, 'ERR', packet.id);
                    }
                }
            }
        }
    } catch (e) { }
});

log('Motor Multi-Tab aguardando comandos do Cockpit...', 'SYSTEM');
initBrowser();
