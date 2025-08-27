"use strict";
function main() {
    const form = document.getElementById("loginForm");
    const err = document.getElementById("loginError");
    if (!form)
        return;
    form.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        err.textContent = "";
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        try {
            // Integração real (Supabase) virá no Bloco 2.
            // Aqui apenas simulamos sucesso para testar navegação.
            if (!email || !password)
                throw new Error("Preencha e-mail e senha.");
            // Redireciona para admin
            window.location.href = "./admin.html";
        }
        catch (e) {
            err.textContent = e?.message ?? "Erro ao entrar.";
        }
    });
}
main();
