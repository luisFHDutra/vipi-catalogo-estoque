import { getSupabase, isSupabaseConfigured } from "../supabase/client.js";
import { localLogin, isLocalLoggedIn } from "../modules/local-auth.js";
const form = () => document.getElementById("loginForm");
const msg = () => document.getElementById("msg");
const emailFld = () => document.getElementById("email");
const passFld = () => document.getElementById("password");
function getNextUrl() {
    const url = new URL(window.location.href);
    const next = url.searchParams.get("next");
    return next && next.startsWith("./") ? next : "./admin.html";
}
async function supabaseLogin(email, password) {
    const sb = await getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error)
        throw error;
    return data.session;
}
async function handleSubmit(ev) {
    ev.preventDefault();
    msg().textContent = "Entrando...";
    const email = emailFld().value.trim();
    const password = passFld().value;
    try {
        if (isSupabaseConfigured) {
            await supabaseLogin(email, password);
        }
        else {
            // Modo local: aceita apenas as credenciais do local-auth.ts
            const sess = localLogin(email, password);
            if (!sess)
                throw new Error("Credenciais inválidas (modo local).");
        }
        window.location.href = getNextUrl();
    }
    catch (e) {
        msg().textContent = e?.message ?? "Falha no login.";
    }
}
function showDevHint() {
    const hint = document.getElementById("devHint");
    if (!isSupabaseConfigured) {
        hint.textContent = "Modo local: use admin@vipi.local / 123456 (definido em src/modules/local-auth.ts)";
    }
}
async function redirectIfLogged() {
    if (isSupabaseConfigured) {
        const sb = await getSupabase();
        const { data: { session } } = await sb.auth.getSession();
        if (session)
            window.location.href = getNextUrl();
    }
    else {
        if (isLocalLoggedIn())
            window.location.href = getNextUrl();
    }
}
function main() {
    form().addEventListener("submit", handleSubmit);
    showDevHint();
    redirectIfLogged();
}
main();
