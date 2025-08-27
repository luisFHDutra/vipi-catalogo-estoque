import { el, clear } from "../modules/ui.js";

function renderIntro() {
    const content = document.getElementById("content")!;
    clear(content);
    const box = el("div", { classes: ["card"] });
    box.append(
        el("h3", { text: "Bem-vindo ao Painel" }),
        el("p", { text: "Use o menu para gerenciar Serviços e Estoque. A autenticação será integrada no Bloco 2." })
    );
    content.appendChild(box);
}

function setupNav() {
    // Aqui, nos próximos blocos, vamos escutar hash (#servicos, #estoque, #relatorios)
    // para renderizar as seções corretas (CRUD, etc.).
    renderIntro();
}

function setupLogout() {
    const btn = document.getElementById("logoutBtn");
    if (!btn) return;
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        // Implementaremos logout via Supabase no Bloco 2
        alert("Logout (placeholder) — autenticação será adicionada no Bloco 2.");
    });
}

function main() {
    setupNav();
    setupLogout();
}

main();
