/**
 * Carrega a lista de modelos do cluster
 * @return {Promise<void>}
 */
async function loadModels() {
    const sel = document.getElementById("modelSelector");
    sel.innerHTML = "<option>Carregando...</option>";

    const res = await fetch("/models");
    const data = await res.json();

    sel.innerHTML = "";
    data.models.forEach(model => {
        const op = document.createElement("option");
        op.value = model;
        op.textContent = model;
        sel.appendChild(op);
    });
}
