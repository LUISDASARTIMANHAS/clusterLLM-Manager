import { listServers } from "./servers.js";

let currentIndex = 0;

function log(...msg) {
	const t = new Date().toISOString();
	console.log(`[OLLAMA | ${t}]`, ...msg);
}

export async function getNextServer(model) {
	const servers = listServers();

	log("Procurando modelo:", model);

	for (let i = 0; i < servers.length; i++) {
		const server = servers[currentIndex];

		log("Testando servidor:", server);

		currentIndex = (currentIndex + 1) % servers.length;

		try {
			const res = await fetch(server + "/api/tags");
			if (!res.ok) continue;

			const json = await res.json();
			const models = json.models.map((m) => m.name);

			log("Modelos no servidor:", models);

			if (models.includes(model)) {
				log("Modelo encontrado no servidor:", server);
				return server;
			}
		} catch (err) {
			log("Erro no servidor:", server, err.message);
		}
	}

	throw new Error("Nenhum servidor possui o modelo: " + model);
}

export async function listModels() {
	const servers = listServers();
	const models = new Set();

	log("Listando modelos no cluster");

	for (const server of servers) {
		try {
			const res = await fetch(server + "/api/tags");
			if (res.ok) {
				const json = await res.json();
				json.models.forEach((m) => models.add(m.name));
			}
		} catch (err) {
			log("Erro ao buscar modelos no servidor", server, err.message);
		}
	}

	return [...models];
}
