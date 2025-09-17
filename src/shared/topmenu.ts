// topmenu.ts (ou .js)
import { supabase } from "../supabase/supabaseClient.js";

const ESTOQUE_PATH = "./estoque.html"; // ajuste se o nome do arquivo for outro

function html(str: string) {
  const t = document.createElement("template");
  t.innerHTML = str.trim();
  return t.content.firstElementChild as HTMLElement;
}

function ensureHeader(titleText: string) {
  let header = document.querySelector("header.topbar") as HTMLElement | null;
  if (!header) {
    header = html(`
      <header class="topbar">
        <div class="brand">
          <img class="logo" src="./assets/logo-vipimatrizes.jpg" alt="VIPI Matrizes" />
          <strong>${titleText}</strong>
        </div>
        <div class="menu">
          <button id="menuBtn" class="btn ghost" aria-expanded="false" aria-controls="menuDropdown">Menu ▾</button>
          <div id="menuDropdown" class="dropdown" role="menu" aria-hidden="true"></div>
        </div>
      </header>
    `);
    document.body.prepend(header);
  } else {
    const brand = header.querySelector(".brand");
    if (brand) {
      const strong = brand.querySelector("strong");
      if (strong) strong.textContent = titleText;
    } else {
      header.appendChild(
        html(`<div class="brand"><img class="logo" src="./assets/logo-vipimatrizes.jpg" alt="VIPI Matrizes"/><strong>${titleText}</strong></div>`)
      );
    }
    if (!header.querySelector("#menuBtn")) {
      header.appendChild(html(`
        <div class="menu">
          <button id="menuBtn" class="btn ghost" aria-expanded="false" aria-controls="menuDropdown">Menu ▾</button>
          <div id="menuDropdown" class="dropdown" role="menu" aria-hidden="true"></div>
        </div>
      `));
    }
  }
  return header!;
}

function fillMenu(anchorsRoot: HTMLElement) {
  const here = window.location.pathname;
  const adminHref = "./admin.html";
  const publicHref = "./index.html";
  const estoqueHref = ESTOQUE_PATH;

  const isAdmin = here.endsWith("/admin.html");
  const servicosHref = isAdmin ? "#/servicos" : `${adminHref}#/servicos`;
  const novoHref = isAdmin ? "#/novo" : `${adminHref}#/novo`;

  anchorsRoot.innerHTML = `
    <a href="${servicosHref}" id="menuServicos" role="menuitem">Serviços</a>
    <a href="${novoHref}" id="menuNovo" role="menuitem">Cadastrar Serviço</a>
    <a href="${publicHref}" id="menuPublico" role="menuitem">Catálogo Público</a>
    <a href="${estoqueHref}" id="menuEstoque" role="menuitem">Estoque</a>
    <a href="#" id="menuLogout" role="menuitem">Sair</a>
  `;
}

function wireMenu() {
  const btn = document.getElementById("menuBtn") as HTMLButtonElement | null;
  const dd = document.getElementById("menuDropdown") as HTMLDivElement | null;
  if (!btn || !dd) return;

  const open = () => { dd.classList.add("show"); btn.setAttribute("aria-expanded", "true"); dd.setAttribute("aria-hidden", "false"); };
  const close = () => { dd.classList.remove("show"); btn.setAttribute("aria-expanded", "false"); dd.setAttribute("aria-hidden", "true"); };

  btn.addEventListener("click", (e) => { e.preventDefault(); dd.classList.contains("show") ? close() : open(); });
  document.addEventListener("click", (e) => { const t = e.target as Node; if (!dd.contains(t) && !btn.contains(t)) close(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  window.addEventListener("hashchange", close);

  document.getElementById("menuLogout")?.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await supabase.auth.signOut();
    } finally {
      window.location.href = "./login.html";
    }
  });
}

function autoTitle() {
  const p = window.location.pathname.toLowerCase();
  if (p.endsWith("/admin.html")) return "Painel Administrativo";
  if (p.endsWith("/index.html") || p.endsWith("/")) return "Catálogo de Serviços";
  if (p.includes("estoque")) return "Estoque de Ferramentas";
  return "VIPI Matrizes";
}

export function injectTopMenu(title?: string) {
  const t = title || autoTitle();
  const header = ensureHeader(t);
  const dd = header.querySelector("#menuDropdown") as HTMLElement;
  fillMenu(dd);
  wireMenu();
}

// auto-injetar quando o arquivo for incluído direto
injectTopMenu();
