// login.ts
import { supabase } from "../supabase/supabaseClient.js";

const $form  = () => document.getElementById("loginForm") as HTMLFormElement | null;
const $msg   = () => document.getElementById("msg") as HTMLElement | null;
const $email = () => document.getElementById("email") as HTMLInputElement | null;
const $pass  = () => document.getElementById("password") as HTMLInputElement | null;

function setMsg(t: string) { if ($msg()) $msg()!.textContent = t; }
function nextUrl(): string { return "./admin.html"; }

async function supabaseLogin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

async function handleSubmit(ev: SubmitEvent) {
  ev.preventDefault();

  const email = $email()?.value.trim() || "";
  const password = $pass()?.value || "";
  if (!email || !password) { setMsg("Informe e-mail e senha."); return; }

  const submitBtn = $form()!.querySelector('button[type="submit"]') as HTMLButtonElement | null;
  if (submitBtn) submitBtn.disabled = true;

  setMsg("Entrando...");
  try {
    await supabaseLogin(email, password);
    // redireciona já; o listener de auth também cobre casos de latência
    window.location.href = nextUrl();
  } catch (e: any) {
    setMsg(e?.message ?? "Falha no login. Tente novamente.");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function redirectIfLogged() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) window.location.href = nextUrl();
  } catch {
    // silencioso
  }
}

function wireAuthListener() {
  // Tipos simples para evitar TS7006 quando não há @supabase instalado localmente
  supabase.auth.onAuthStateChange((event: string, session: any) => {
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
} else {
  main();
}
