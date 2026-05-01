# 🛰️ SOBERANO | PURE CONSOLE
### High-Density Cluster Management & Strike Engine

Este é o **Motor de Execução de Baixa Latência** projetado para automação em larga escala (35+ instâncias) com foco em neutralidade de delta e otimização do caminho crítico.

---

## 🛠️ Requisitos de Ambiente

Para operar o SOBERANO em performance máxima, você precisará dos seguintes componentes instalados:

### 1. Runtime: Node.js (v18+)
O núcleo assíncrono do sistema.
-   **Link:** [Download Node.js](https://nodejs.org/)
-   **Verificação:** `node -v` no terminal.

### 2. Navegador: Google Chrome
Utilizamos o executável padrão do Chrome para garantir compatibilidade total e mimetismo humano.
-   **Caminho Esperado:** `C:\Program Files\Google\Chrome\Application\chrome.exe`
-   **Ajuste:** Caso seu Chrome esteja em outro local, altere a constante `CHROME_PATH` no arquivo `SOBERANO2.js`.

---

## 📦 Instalação

1.  Abra o terminal (PowerShell ou CMD) na pasta raiz do projeto.
2.  Instale as dependências via NPM:
    ```bash
    npm install
    ```
    *Isso instalará: express, socket.io, express-http-proxy e puppeteer-core.*

---

## 🚀 Como Iniciar

Existem duas formas de disparar o cluster:

### Opção A: Via Script Batch (Recomendado)
Execute o arquivo:
-   `start_soberano.bat`
*Ele cuidará de iniciar o Cockpit e o Motor simultaneamente.*

### Opção B: Manual via Terminal
Na raiz do projeto:
```bash
node UI/DASHBOARD/server.js
```
Aguarde a mensagem: `SENTINEL MULTI-TAB HUB: http://localhost:3000`

---

## 🎮 Interface de Comando (Cockpit)

1.  Acesse `http://localhost:3000` no seu navegador.
2.  **Register Agent**: Insira a URL do AI Studio e registre a instância no cluster.
3.  **Manual Start**: Clique em `START` na aba desejada para abrir a instância no navegador em modo oculto.
4.  **Deep Strike**: Use o campo de input em cada linha para enviar comandos de teclado diretos para o terminal daquela instância.

---

## ⚙️ Arquitetura do Sistema

-   **Cockpit (UI/DASHBOARD)**: Dashboard em Express/Socket.io para visualização e orquestração.
-   **Motor (SOBERANO2.js)**: Orquestrador Puppeteer que gerencia as abas e o loop de vida dos agentes.
-   **Registry (REGISTRY.json)**: Persistência de dados das instâncias para carregamento rápido entre reinicializações.

---
> **Aviso de Engenharia:** "O Código não é o Ativo; o Tempo é o único Recurso Finito." Opere com precisão.
