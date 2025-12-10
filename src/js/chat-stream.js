/**
 * Envia prompt ao cluster usando streaming SSE
 * @return {Promise<void>}
 */
async function sendStreaming() {
    const model = modelSelector.value;
    const prompt = promptBox.value;

    responseBox.innerText = "";

    const res = await fetch("/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt })
    });

    if (!res.ok || !res.body) {
        responseBox.innerText = "Erro ao conectar ao servidor.";
        return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let lines = buffer.split("\n");
        buffer = lines.pop(); // mantém o pedaço incompleto

        for (const line of lines) {
            if (!line.startsWith("data:")) continue;

            const jsonText = line.replace("data:", "").trim();
            if (!jsonText) continue;

            try {
                const parsed = JSON.parse(jsonText);

                if (parsed.error) {
                    responseBox.innerText += "\n[ERRO] " + parsed.error;
                    continue;
                }

                if (parsed.response) {
                    responseBox.innerText += parsed.response;
                }

            } catch {
                console.warn("JSON inválido recebido:", jsonText);
            }
        }
    }
}