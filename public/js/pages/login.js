// login.ts
import { supabase } from "../supabase/supabaseClient.js";
const $form = () => document.getElementById("loginForm");
const $msg = () => document.getElementById("msg");
const $email = () => document.getElementById("email");
const $pass = () => document.getElementById("password");
function setMsg(t) { if ($msg())
    $msg().textContent = t; }
function nextUrl() { return "./admin.html"; }
async function supabaseLogin(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error)
        throw error;
    return data.session;
}
async function handleSubmit(ev) {
    ev.preventDefault();
    const email = $email()?.value.trim() || "";
    const password = $pass()?.value || "";
    if (!email || !password) {
        setMsg("Informe e-mail e senha.");
        return;
    }
    const submitBtn = $form().querySelector('button[type="submit"]');
    if (submitBtn)
        submitBtn.disabled = true;
    setMsg("Entrando...");
    try {
        await supabaseLogin(email, password);
        // redireciona já; o listener de auth também cobre casos de latência
        window.location.href = nextUrl();
    }
    catch (e) {
        setMsg(e?.message ?? "Falha no login. Tente novamente.");
    }
    finally {
        if (submitBtn)
            submitBtn.disabled = false;
    }
}
async function redirectIfLogged() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session)
            window.location.href = nextUrl();
    }
    catch {
        // silencioso
    }
}
function wireAuthListener() {
    // Tipos simples para evitar TS7006 quando não há @supabase instalado localmente
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) {
            window.location.href = nextUrl();
        }
    });
}
function main() {
    const form = $form();
    if (!form) {
        console.error("Formulário de login não encontrado (#loginForm).");
        return;
    }
    form.addEventListener("submit", handleSubmit);
    wireAuthListener();
    redirectIfLogged();
}
// garante DOM pronto
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
}
else {
    main();
}
