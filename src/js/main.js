window.onload = () => {
    loadModels();

    document.getElementById("btnNormal").onclick = sendPrompt;
    document.getElementById("btnStream").onclick = sendStreaming;
};
