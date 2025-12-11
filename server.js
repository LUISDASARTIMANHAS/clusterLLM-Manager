import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import {
	listServers,
	addServer,
	updateServer,
	deleteServer,
	countOnlineServers
} from "./cluster/servers.js";

import { getNextServer, listModels } from "./cluster/ollama.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "src")));

// ==================================================
// LOGGER SIMPLES
// ==================================================
function log(...msg) {
	const time = new Date().toISOString();
	console.log(`[${time}]`, ...msg);
}

// Middleware para logar requisições
app.use((req, res, next) => {
	log(`REQ: ${req.method} ${req.url}`);
	next();
});

// ==================================================
// PÁGINAS
// ==================================================
app.get("/", (req, res) => {
	log("PAGE: index.html");
	res.sendFile(path.join(__dirname, "src/pages/index.html"));
});

app.get("/cluster", (req, res) => {
	log("PAGE: cluster.html");
	res.sendFile(path.join(__dirname, "src/pages/cluster.html"));
});

// ==================================================
// ROTAS DO CLUSTER
// ==================================================

app.get("/cluster/servers", (req, res) => {
	log("CLUSTER: listando servidores");
	res.json({ servers: listServers() });
});

app.get("/cluster/servers/online", async (req, res) => {
	const status = await countOnlineServers();
	log(`CLUSTER: ${status.online}/${status.total} online`);
	res.json(status);
});

app.post("/cluster/servers", (req, res) => {
	log("CLUSTER: adicionando servidor", req.body);
	const { url } = req.body;
	res.json(addServer(url));
});

app.put("/cluster/servers/:index", (req, res) => {
	log("CLUSTER: atualizando servidor", req.params, req.body);
	const { index } = req.params;
	const { url } = req.body;
	res.json(updateServer(Number(index), url));
});

app.delete("/cluster/servers/:index", (req, res) => {
	log("CLUSTER: removendo servidor", req.params);
	const { index } = req.params;
	res.json(deleteServer(Number(index)));
});

// ==================================================
// CHAT NORMAL
// ==================================================
app.post("/chat", async (req, res) => {
	try {
		const { model, prompt } = req.body;

		log("CHAT NORMAL →", model, "prompt:", prompt.substring(0, 50));

		const server = await getNextServer(model);
		log("CHAT NORMAL usando servidor:", server);

		const result = await fetch(server + "/api/generate", {
			method: "POST",
			headers:{ "Content-Type":"application/json" },
			body: JSON.stringify({ model, prompt, stream:false })
		});

		const json = await result.json();
		res.json({ answer: json.response });

	} catch (err) {
		log("ERRO CHAT NORMAL:", err.message);
		res.status(500).json({ error: err.message });
	}
});

// ==================================================
// CHAT STREAM
// ==================================================
app.post("/chat/stream", async (req, res) => {
	try {
		const { model, prompt } = req.body;

		log("STREAM →", model, "prompt:", prompt.substring(0, 50));

		const server = await getNextServer(model);
		log("STREAM usando servidor:", server);

		res.writeHead(200, {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			"Connection": "keep-alive"
		});

		const llm = await fetch(server + "/api/generate", {
			method: "POST",
			headers:{ "Content-Type":"application/json" },
			body: JSON.stringify({ model, prompt, stream:true })
		});

		const reader = llm.body.pipeThrough(new TextDecoderStream()).getReader();

		while (true) {
			const { value, done } = await reader.read();
			if (done) break;

			log("STREAM CHUNK:", value.substring(0, 60));
			res.write(`data: ${value}\n\n`);
		}

		log("STREAM FIM");
		res.write("data: [FIM]\n\n");
		res.end();

	} catch (err) {
		log("ERRO STREAM:", err.message);
		res.write(`data: ERRO: ${err.message}\n\n`);
		res.end();
	}
});

// ==================================================
// MODELOS
// ==================================================
app.get("/models", async (req, res) => {
	log("LISTANDO MODELOS DO CLUSTER");
	res.json({ models: await listModels() });
});

// ==================================================
// START
// ==================================================
app.listen(3000, () => {
	log("Cluster Ollama ativo na porta 3000");
});
