/**
 * Envia prompt ao cluster (modo normal)
 * @return {Promise<void>}
 */
async function sendPrompt() {
    const model = modelSelector.value;
    const prompt = promptBox.value;

    responseBox.innerText = "Processando...";

    const res = await fetch("/chat", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model, prompt })
    });

    const data = await res.json();
    responseBox.innerText = data.answer || data.error;
}
