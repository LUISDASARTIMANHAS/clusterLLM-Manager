/**
 * Envia prompt ao cluster usando streaming SSE
 * Corrige NDJSON fragmentado e monta JSON corretamente.
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

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = ""; // armazena JSON quebrado

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value);

        const lines = buffer.split("\n");
        buffer = lines.pop(); // deixa último pedaço incompleto no buffer

        for (const line of lines) {
            const clean = line.replace("data:", "").trim();
            if (!clean) continue;

            if (clean === "[FIM]") {
                responseBox.innerText += "\n[FIM]";
                return;
            }

            try {
                const json = JSON.parse(clean);
                if (json.response) {
                    responseBox.innerText += json.response;
                }
            } catch (err) {
                console.warn("Fragmento JSON inválido (normal em chunks):", clean);
            }
        }
    }
}
