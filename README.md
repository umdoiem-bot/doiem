# 🛰️ SOBERANO II — HF ENGINE
### High-Frequency Deterministic Execution & Cluster Consolidation

**SOBERANO II** é um motor de execução de baixa latência projetado para orquestração de clusters de alta densidade. Diferente de sistemas convencionais, ele opera sob a filosofia de **Otimização do Caminho Crítico**, onde cada microssegundo economizado no Event Loop é um recurso preservado.

---

> [!IMPORTANT]
> **A LEI FUNDAMENTAL DO DESIGN**
> "O Código não é o Ativo; o Tempo é o único Recurso Finito. Todo bit de informação que não contribui para a decisão final é um parasita que consome a vida do sistema."

---

## ⚡ Core Architecture: Unchained Mode

O sistema utiliza o **Chromium Headless Shell** em modo "Unchained", eliminando toda a sobrecarga de UI e isolamento de processos desnecessários.

- **Engine:** Chromium Native (Headless Shell Mode)
- **Injection:** CDP (Chrome DevTools Protocol) Stealth Injection
- **Process Management:** Consolidação de Instâncias (Site Isolation Disabled)
- **Memory Strategy:** V8 Memory Capping (128mb per Slot)

## 📁 Estrutura do Sistema

```text
MINER/
├── SOBERANO2.js          # Core Engine: Motor de Renderização e Ataque
├── REGISTRY.json         # Cluster State: Persistência determinística de instâncias
├── COOKIES.json          # Identity Layer: Tokens de sessão via CDP
├── start_soberano.bat    # Windows Critical Loader
└── UI/DASHBOARD/         # Cockpit: Monitoramento e Disparo de Sinais
```

## 🚀 Operação do Cluster

### Execução de Alta Frequência (HF)
O motor é otimizado para responder a estímulos do DOM em tempo real, utilizando o **Sentinel Autonomous Agent** para manter a persistência da sessão e a reatividade das instâncias.

1. **Deterministic Boot:** Injeção atômica de cookies antes da primeira requisição de navegação.
2. **Sentinel Loop:** Monitoramento e autoreparo reativo do DOM para evitar Timeouts e Idle states.
3. **Deep Strike:** Emulação de eventos de teclado e mouse em nível de driver via DevTools.

### Configuração Rápida
```bash
# 1. Instalação das dependências
npm install

# 2. Inicialização do Cockpit
start_soberano.bat
```

## 🛠️ Performance & Hardening

| Feature | Mecanismo | Impacto |
| :--- | :--- | :--- |
| **Cluster Consolidation** | `--disable-features=IsolateOrigins` | Redução de 60% no consumo de RAM |
| **GPU Bypass** | `--use-gl=angle --use-angle=swiftshader` | Estabilidade total em ambientes sem GPU |
| **Stealth Delivery** | `puppeteer-extra-plugin-stealth` | Bypass de detecção de automação |
| **V8 Optimization** | `--max-old-space-size=128` | Prevenção de Garbage Collection Spikes |

## 🎮 Cockpit (Dashboard)
Acesse localmente via **`http://localhost:3000`** para gerenciar o estado do cluster, visualizar previews em tempo real e executar *Deep Strikes* manuais.

---

**Missão:** Projetar pipelines de processamento de sinais determinísticos. Se algo pode ser omitido sem quebrar as leis da física, ele deve ser omitido.

**Status:** `HF_ACTIVE` | `LATENCY_MINIMAL` | `DENSITY_MAX`
