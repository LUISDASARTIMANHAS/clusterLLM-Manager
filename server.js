import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const ollamaServers = [
  "http://192.168.6.100:11434",
  "http://192.168.6.101:11434",
  "http://192.168.6.30:11434"
];

let currentServerIndex = 0;

/**
 * Seleciona um servidor ativo usando round-robin.
 */
async function getNextServer() {
  for (let i = 0; i < ollamaServers.length; i++) {
    const server = ollamaServers[currentServerIndex];
    currentServerIndex = (currentServerIndex + 1) % ollamaServers.length;

    try {
      const res = await fetch(server + "/api/tags", { method: "GET" });
      if (res.ok) return server;
    } catch {}
  }
  throw new Error("Nenhum servidor Ollama disponível.");
}

/**
 * Lista modelos do cluster.
 */
async function listModels() {
  const models = new Set();

  for (const server of ollamaServers) {
    try {
      const res = await fetch(server + "/api/tags");
      if (res.ok) {
        const json = await res.json();
        json.models.forEach(m => models.add(m.name));
      }
    } catch {}
  }
  return Array.from(models);
}

/**
 * Geração normal.
 */
async function generateResponse(model, prompt) {
  const server = await getNextServer();

  const res = await fetch(server + "/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, stream: false })
  });

  const data = await res.json();
  return data.response;
}

/**
 * STREAMING estilo ChatGPT
 */
app.post("/chat/stream", async (req, res) => {
  try {
    const { model, prompt } = req.body;
    const server = await getNextServer();

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

    const reader = llm.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      res.write(`data: ${chunk}\n\n`);
    }

    res.write("data: [FIM]\n\n");
    res.end();
  } catch (err) {
    res.write(`data: ERRO: ${err.message}\n\n`);
    res.end();
  }
});

// MODEL LIST
app.get("/models", async (req, res) => {
  const models = await listModels();
  res.json({ models });
});

// CHAT NORMAL
app.post("/chat", async (req, res) => {
  try {
    const { model, prompt } = req.body;
    const answer = await generateResponse(model, prompt);
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("Cluster Ollama ativo na porta 3000");
});
