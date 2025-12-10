import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// ===========================================================
// CONFIGURAÇÃO DE DIRETÓRIOS
// ===========================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Servir frontend
app.use(express.static(path.join(__dirname, "src")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "pages", "index.html"));
});

// ===========================================================
// CONFIGURAÇÃO DO CLUSTER
// ===========================================================
const ollamaServers = [
  "http://192.168.6.100:11434",
  "http://192.168.6.101:11434",
];

let currentServerIndex = 0;

/**
 * Seleciona o próximo servidor disponível que possua o modelo solicitado.
 * Evita enviar para servidores sem o modelo instalado.
 * @param {string} model Modelo solicitado.
 * @return {Promise<string>} Servidor válido.
 */
async function getNextServer(model) {
  console.log("=== Selecionando servidor Ollama ===");

  for (let i = 0; i < ollamaServers.length; i++) {
    const server = ollamaServers[currentServerIndex];
    console.log(`Testando servidor: ${server}`);

    currentServerIndex = (currentServerIndex + 1) % ollamaServers.length;

    try {
      const res = await fetch(server + "/api/tags");

      if (!res.ok) {
        console.log(`Servidor respondeu com erro: ${server}`);
        continue;
      }

      const json = await res.json();
      const models = json.models.map((m) => m.name);

      if (!models.includes(model)) {
        console.log(
          `Servidor ${server} NÃO possui o modelo "${model}". Ignorando.`
        );
        continue;
      }

      console.log(`Servidor ativo e com o modelo: ${server}`);
      return server;
    } catch (err) {
      console.log(`Falha ao conectar no servidor ${server}: ${err.message}`);
    }
  }

  throw new Error(`Nenhum servidor possui o modelo: ${model}`);
}

/**
 * Lista modelos disponíveis em TODO o cluster
 * @return {Promise<string[]>}
 */
async function listModels() {
  console.log("=== Listando modelos disponíveis no cluster ===");

  const models = new Set();

  for (const server of ollamaServers) {
    console.log(`Consultando servidor: ${server}`);

    try {
      const res = await fetch(server + "/api/tags");

      if (res.ok) {
        const json = await res.json();
        json.models.forEach((m) => models.add(m.name));
      }
    } catch (err) {
      console.log(`Falha ao consultar ${server}: ${err.message}`);
    }
  }
  return Array.from(models);
}

/**
 * Geração normal (sem streaming)
 * @param {string} model
 * @param {string} prompt
 * @return {Promise<string>}
 */
async function generateResponse(model, prompt) {
  const server = await getNextServer(model);

  console.log("=== Enviando requisição ao servidor selecionado ===");
  console.log(`Servidor: ${server}`);
  console.log(`Modelo: ${model}`);
  console.log(`Prompt: ${prompt}`);

  const res = await fetch(server + "/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, stream: false }),
  });

  console.log(`Status da resposta: ${res.status}`);

  const data = await res.json().catch((err) => {
    console.log("Erro ao decodificar JSON:", err.message);
    throw new Error("Resposta inválida do servidor.");
  });

  return data.response;
}

// ===========================================================
// ROTAS API
// ===========================================================

/**
 * Streaming estilo ChatGPT via SSE
 */
app.post("/chat/stream", async (req, res) => {
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  console.log("=== Nova requisição STREAMING recebida ===");
  console.log(`Cliente: ${clientIp}`);
  console.log("Body:", req.body);

  try {
    const { model, prompt } = req.body;

    const server = await getNextServer(model);
    console.log("Servidor selecionado:", server);

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });

    const llm = await fetch(server + "/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: true })
    });

    const reader = llm.body
      .pipeThrough(new TextDecoderStream())  // <=== AQUI É A CORREÇÃO
      .getReader();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      res.write(`data: ${value}\n\n`);
    }

    res.write("data: [FIM]\n\n");
    res.end();

  } catch (err) {
    console.log("Erro STREAM:", err.message);
    res.write(`data: ERRO: ${err.message}\n\n`);
    res.end();
  }
});


// CHAT normal
app.post("/chat", async (req, res) => {
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  console.log("=== Nova requisição recebida ===");
  console.log(`Cliente: ${clientIp}`);
  console.log("Body:", req.body);

  try {
    const { model, prompt } = req.body;
    const answer = await generateResponse(model, prompt);
    res.json({ answer });
  } catch (err) {
    console.log("Erro no processamento:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/image", async (req, res) => {
  const { model, prompt } = req.body;

  try {
    const server = await getNextServer(model);

    const response = await fetch(server + "/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false  // sempre false para imagens
      })
    });

    const data = await response.json();

    /**
     * O Ollama retorna imagem em base64 em:
     * data.image
     */
    if (!data.image) {
      return res.status(400).json({ error: "Modelo não retornou imagem." });
    }

    res.json({
      ok: true,
      image: data.image // base64
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota de modelos
app.get("/models", async (req, res) => {
  const models = await listModels();
  res.json({ models });
});

// ===========================================================
// INICIAR SERVIDOR
// ===========================================================
app.listen(3000, () => {
  console.log("Cluster Ollama ativo na porta 3000");
});
