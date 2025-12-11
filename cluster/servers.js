/**
 * Módulo responsável por gerenciar os servidores do cluster.
 */

function log(...msg) {
	const t = new Date().toISOString();
	console.log(`[SERVERS | ${t}]`, ...msg);
}

let ollamaServers = [
	"http://192.168.6.100:11434",
	"http://192.168.6.101:11434"
];

/**
 * Lista servidores.
 */
export function listServers() {
	log("Listando servidores");
	return ollamaServers;
}

export function addServer(url) {
	if (!url.startsWith("http")) {
		log("Erro ao adicionar servidor — URL inválida:", url);
		return { ok: false, message: "URL inválida." };
	}

	ollamaServers.push(url);
	log("Servidor adicionado:", url);

	return { ok: true, message: "Servidor adicionado." };
}

export function updateServer(index, newUrl) {
	if (!ollamaServers[index]) {
		log("Erro ao atualizar servidor — índice inválido:", index);
		return { ok: false, message: "Servidor não encontrado." };
	}

	log(`Servidor ${index} atualizado para:`, newUrl);
	ollamaServers[index] = newUrl;

	return { ok: true, message: "Servidor atualizado." };
}

export function deleteServer(index) {
	if (!ollamaServers[index]) {
		log("Erro ao remover servidor — índice inválido:", index);
		return { ok: false, message: "Servidor não encontrado." };
	}

	log("Servidor removido:", ollamaServers[index]);
	ollamaServers.splice(index, 1);

	return { ok: true, message: "Servidor removido." };
}

export async function isServerOnline(serverUrl) {
	try {
		const res = await fetch(serverUrl + "/api/tags");
		log("Ping:", serverUrl, "status:", res.status);
		return res.ok;
	} catch (err) {
		log("Ping falhou:", serverUrl, "erro:", err.message);
		return false;
	}
}

export async function countOnlineServers() {
	let online = 0;

	for (const server of ollamaServers) {
		if (await isServerOnline(server)) online++;
	}

	log(`Online: ${online}/${ollamaServers.length}`);
	return { online, total: ollamaServers.length };
}
