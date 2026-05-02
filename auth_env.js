const { addExtra } = require('puppeteer-extra');
const puppeteerCore = require('puppeteer-core');
const puppeteer = addExtra(puppeteerCore);
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const path = require('path');

// DESCOBERTA DINÂMICA DO CHROME (Cross-Platform)
let CHROME_PATH = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
if (!fs.existsSync(CHROME_PATH)) {
    const cloudPaths = ['/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
    CHROME_PATH = cloudPaths.find(p => fs.existsSync(p)) || CHROME_PATH;
}

const PROFILE_DIR = path.join(__dirname, 'GHOST_PROFILE');

(async () => {
    console.log("===========================================================");
    console.log("🛡️  SOBERANO - MODO AUTENTICADOR DE AMBIENTE (Cloud Setup)");
    console.log("===========================================================");
    console.log("-> O Navegador não usará furtividade térmica (Headless: False).");
    console.log("-> Ele registrará organicamente a assinatura deste IP local.");
    console.log("===========================================================\n");
    
    if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true });

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: false, // MODO VISUAL PARA OPERADOR HUMANO
        userDataDir: PROFILE_DIR,
        args: [
            '--start-maximized',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    const page = await browser.newPage();
    console.log("⏳ Navegando para o Auth Master (Google AI Studio)...");
    
    try {
        await page.goto("https://aistudio.google.com/", { waitUntil: 'networkidle2', timeout: 0 });
    } catch(e) {}

    console.log("\n⚠️  [AÇÃO REQUERIDA DO OPERADOR] ⚠️");
    console.log("-> Por Favor, resolva todos os Logins, SMS Confirmations ou Captchas.");
    console.log("-> Assim que a plataforma do AI Studio estiver visível e pronta, FECHE A JANELA.");

    browser.on('disconnected', () => {
        console.log("\n✅ ASSINATURA GRAVADA COM SUCESSO NO GHOST_PROFILE.");
        console.log("-> O Motor SOBERANO2.js agora assumirá as instâncias totalmente cego e validado neste IP.");
        process.exit(0);
    });
})();
