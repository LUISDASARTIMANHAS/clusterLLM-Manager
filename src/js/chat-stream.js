/**
 * Envia prompt ao cluster usando streaming SSE
 * @return {Promise<void>}
 */
async function sendStreaming() {
    const model = modelSelector.value;
    const prompt = promptBox.value;

    responseBox.innerText = "";

    const res = await fetch("/chat/stream", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ model, prompt })
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        responseBox.innerText += text.replace("data:", "");
    }
}
