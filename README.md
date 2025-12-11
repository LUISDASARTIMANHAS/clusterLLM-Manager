# Cluster LLM

Cluster LLM é uma plataforma para criação de um cluster distribuído de servidores Ollama, permitindo a execução de LLMs em múltiplas máquinas ao mesmo tempo. O sistema funciona como um balanceador de carga inteligente que roteia prompts automaticamente para os servidores disponíveis.

Este projeto foi criado para permitir que diversos computadores trabalhem juntos, reduzindo filas, distribuindo múltiplas requisições simultâneas e oferecendo uma API unificada compatível com o Ollama.

https://ollama.com
https://nodejs.org
https://expressjs.com
https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

---

## Funcionalidades

- Cluster de múltiplas máquinas executando Ollama.
- Balanceamento de carga inteligente (round-robin + fallback automático).
- Painel visual para gerenciar os servidores cadastrados (cluster.html).
- Console para testar modelos e prompts (index.html).
- Checagem de saúde dos servidores (health check).
- Detecção dinâmica de modelos instalados em cada máquina.
- Modos de resposta: normal e streaming.
- API unificada semelhante à API original do Ollama.

---

## Como Funciona

O sistema opera com dois elementos principais:

### 1. **Gerenciador do Cluster (cluster.html)**
Permite adicionar e remover servidores Ollama.  
Mostra:
- Servidores online/offline.
- URLs cadastradas.
- Status de cada nó.
- Quantidade total de servidores ativos.

Cada nó é uma máquina rodando o serviço do Ollama em:
http://IP-OU-DOMINIO:11434

### 2. **Console de Testes (index.html)**
- Lista modelos detectados no cluster.
- Aceita prompts.
- Envia requisições normais ou em streaming para o servidor selecionado.
- Exibe a resposta diretamente na página.

### 3. **Balanceamento de Carga**
Quando múltiplos prompts são enviados simultaneamente:
- O sistema distribui cada requisição entre os servidores disponíveis.
- Se um servidor ficar lento ou cair, outro assume automaticamente.
- O processo é transparente para o usuário.

### 4. **APIs Disponíveis**
O backend expõe endpoints:

- **GET /models**  
  Obtém uma lista consolidada dos modelos encontrados no cluster.

- **POST /chat**  
  Gera resposta em modo normal.

- **POST /chat/stream**  
  Gera resposta em tempo real usando Server-Sent Events (SSE).

---

## Arquitetura Geral

- Node.js + Express atuam como load balancer.
- Cada máquina do cluster roda Ollama localmente.
- O backend verifica a saúde dos servidores antes de encaminhar requisições.
- O frontend se comunica apenas com o load balancer, nunca diretamente com as máquinas.

---

## Pontos Positivos

- Escalável: basta adicionar novas máquinas ao cluster.
- Balanceamento automático reduz gargalos e travamentos.
- Interface amigável para monitoramento.
- API 100% compatível com a API oficial do Ollama.
- Suporta qualquer modelo disponível no Ollama.

---

## Pontos Negativos

- O processamento de um único prompt não é dividido entre várias máquinas (limitação do Ollama).
- Rede instável pode causar variação de desempenho entre os nós.
- Gerenciar máquinas com hardwares diferentes pode resultar em tempos desiguais.

---

## Instalação

1. Configure seus servidores Ollama em máquinas separadas:

ollama serve

2. No arquivo `server.js`, edite o array:

const ollamaServers = [ "http://192.168.6.100:11434
", ... ];

3. Instale dependências:

npm install

4. Inicie o servidor:

npm start

5. Abra a interface web:

http://localhost:3000


---

## Tecnologias Utilizadas

- Node.js  
- Express.js  
- JavaScript  
- HTML e CSS  
- Ollama API  
- SSE (Server-Sent Events)

---

## Licença

Projeto de código aberto. Você pode modificar e distribuir à vontade.