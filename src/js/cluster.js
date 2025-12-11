/**
 * Cluster Manager Frontend
 * Atualiza servidores, status e gerencia CRUD completo.
 */

async function loadServers() {
    const res = await fetch("/cluster/servers");
    const json = await res.json();

    const table = document.getElementById("serverTable");
    table.innerHTML = "";

    json.servers.forEach((server, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${index}</td>
            <td>
                <input id="server-${index}" value="${server}" style="width: 90%; background:#222; color:#fff; border:1px solid #333;">
            </td>
            <td id="status-${index}">...</td>
            <td>
                <button onclick="updateServer(${index})">Salvar</button>
                <button onclick="deleteServer(${index})" style="background:#922;">Excluir</button>
            </td>
        `;

        table.appendChild(row);

        checkServerStatus(index, server);
    });

    updateOnlineCounter();
}

/**
 * Verifica online/offline
 */
async function checkServerStatus(index, url) {
    const statusBox = document.getElementById(`status-${index}`);

    try {
        const res = await fetch(url + "/api/tags", { method: "GET" });
        statusBox.textContent = res.ok ? "Online" : "Offline";
        statusBox.className = res.ok ? "status-online" : "status-offline";
    } catch {
        statusBox.textContent = "Offline";
        statusBox.className = "status-offline";
    }
}

/**
 * Contador de servidores online
 */
async function updateOnlineCounter() {
    const res = await fetch("/cluster/servers/online");
    const json = await res.json();

    document.getElementById("serversOnline").textContent = json.online;
    document.getElementById("serversTotal").textContent = json.total;
}

/**
 * Adiciona novo servidor
 */
async function addServer() {
    const url = document.getElementById("newServerUrl").value;

    await fetch("/cluster/servers", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ url })
    });

    document.getElementById("newServerUrl").value = "";
    loadServers();
}

/**
 * Atualiza servidor existente
 */
async function updateServer(index) {
    const url = document.getElementById(`server-${index}`).value;

    await fetch(`/cluster/servers/${index}`, {
        method: "PUT",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ url })
    });

    loadServers();
}

/**
 * Remove servidor
 */
async function deleteServer(index) {
    await fetch(`/cluster/servers/${index}`, {
        method: "DELETE"
    });

    loadServers();
}

// Atualiza automaticamente a cada 5 segundos
setInterval(loadServers, 5000);

// Carrega inicial
loadServers();
