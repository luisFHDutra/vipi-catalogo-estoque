import { clear, el } from "../modules/ui.js";
import { supabase } from "../supabase/supabaseClient.js";

/* ========= UI por autenticação (mostra botões de admin/estoque quando logado) ========= */
const loginBtn = document.getElementById("btn-login");
const logoutBtn = document.getElementById("btn-logout");

function authEls(): NodeListOf<HTMLElement> {
  return document.querySelectorAll<HTMLElement>(".auth-only");
}

function applyAuthUI(session: any) {
  const isIn = !!session;
  authEls().forEach(el => el.classList.toggle("hide", !isIn));
  loginBtn?.classList.toggle("hide", isIn);
  logoutBtn?.classList.toggle("hide", !isIn);
}

(async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    applyAuthUI(session);
  } catch { /* ignore */ }
})();

supabase.auth.onAuthStateChange((_event: string, session: any) => applyAuthUI(session));

logoutBtn?.addEventListener("click", async (e) => {
  e.preventDefault();
  try { await supabase.auth.signOut(); } finally { location.reload(); }
});

/* (defensivo) Remove qualquer <h2> antigo na seção principal */
(() => {
  const title = document.querySelector("main section h2");
  if (title) title.remove();
})();

/* ===== Tipos do catálogo público ===== */
type PublicService = {
  id: number;
  created_at: string | null;
  name: string;
  description: string | null;
  images: string[] | null; // capa = images[0]
};

/* ===== Estado de listagem (busca + paginação) ===== */
const state = {
  q: "",
  page: 1,
  pageSize: 12,
  total: 0
};

function debounce<T extends (...args: any[]) => void>(fn: T, wait = 300) {
  let t: number | undefined;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = window.setTimeout(() => fn(...args), wait);
  };
}

/* ===== Data (Supabase) — busca + paginação ===== */
async function fetchPublicServices(opts: { q?: string; page?: number; pageSize?: number } = {}) {
  const q = (opts.q ?? state.q).trim();
  const page = Math.max(1, opts.page ?? state.page);
  const pageSize = Math.max(1, opts.pageSize ?? state.pageSize);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("service")
    .select("id, name, description, images, created_at", { count: "exact" })
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    // escapar curingas para ILIKE
    const term = q.replace(/[%_]/g, (s) => `\\${s}`);
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    items: (data ?? []) as PublicService[],
    count: count ?? 0,
    page,
    pageSize
  };
}

/* ===== UI: Modal (detalhes) ===== */
function openDetailsModalPublic(svc: PublicService) {
  const bd = el("div", { classes: ["modal-backdrop", "show"] });
  const m = el("div", { classes: ["modal"] });

  const head = el("header");
  head.append(el("h3", { text: svc.name }));

  const content = el("div", { classes: ["content"] });

  const imgs = (svc.images ?? []) as string[];
  let idx = 0;

  if (imgs.length) {
    const gallery = el("div", { classes: ["carousel"] });
    const frame = el("div", { classes: ["frame"] });
    const main = el("img", { classes: ["img"], attrs: { src: imgs[0], alt: svc.name } }) as HTMLImageElement;

    function setIndex(i: number) {
      if (!imgs.length) return;
      idx = (i + imgs.length) % imgs.length;
      main.src = imgs[idx];
    }

    main.addEventListener("click", () => openLightbox(imgs, idx));

    const prev = el("div", { classes: ["nav", "prev"], text: "‹" });
    const next = el("div", { classes: ["nav", "next"], text: "›" });
    prev.addEventListener("click", (e) => { e.stopPropagation(); setIndex(idx - 1); });
    next.addEventListener("click", (e) => { e.stopPropagation(); setIndex(idx + 1); });

    frame.append(main);
    gallery.append(frame);
    if (imgs.length > 1) gallery.append(prev, next);
    content.append(gallery);
  }

  if (svc.description) {
    content.append(el("h4", { text: "Descrição" }), el("p", { text: svc.description }));
  }

  const foot = el("footer");
  const btnClose = el("button", { classes: ["btn"], text: "Fechar" });
  btnClose.addEventListener("click", () => document.body.removeChild(bd));
  foot.append(btnClose);

  function cleanup() {
    document.removeEventListener("keydown", onKey);
    try { document.body.removeChild(bd); } catch { /* noop */ }
  }
  function onKey(e: KeyboardEvent) { if (e.key === "Escape") cleanup(); }

  m.append(head, content, foot);
  bd.append(m);
  bd.addEventListener("click", (e) => { if (e.target === bd) cleanup(); });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(bd);
}

/* ===== Lightbox ===== */
function openLightbox(images: string[], startIndex = 0) {
  if (!images.length) return;
  let idx = startIndex;

  const bd = el("div", { classes: ["lightbox-backdrop"] });
  const box = el("div", { classes: ["lightbox"] });
  const img = el("img", { classes: ["lightbox-img"], attrs: { src: images[idx] } }) as HTMLImageElement;

  const prev = el("div", { classes: ["nav", "prev"], text: "‹" });
  const next = el("div", { classes: ["nav", "next"], text: "›" });

  function setIndex(i: number) {
    idx = (i + images.length) % images.length;
    img.src = images[idx];
  }

  prev.addEventListener("click", (e) => { e.stopPropagation(); setIndex(idx - 1); });
  next.addEventListener("click", (e) => { e.stopPropagation(); setIndex(idx + 1); });

  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") cleanup();
    if (images.length && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      setIndex(e.key === "ArrowLeft" ? idx - 1 : idx + 1);
    }
  }
  function cleanup() {
    document.removeEventListener("keydown", onKey);
    try { document.body.removeChild(bd); } catch { /* noop */ }
  }

  box.append(img);
  if (images.length > 1) box.append(prev, next);
  bd.append(box);

  bd.addEventListener("click", (e) => { if (e.target === bd) cleanup(); });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(bd);
}

/* ===== Card ===== */
function card(svc: PublicService): HTMLElement {
  const a = el("div", { classes: ["card"] });

  const cover = svc.images?.[0];
  if (cover) {
    const img = document.createElement("img");
    img.src = cover;
    img.alt = svc.name;
    img.className = "img-cover";
    a.appendChild(img);
  }

  const title = el("h3", { text: svc.name });
  const desc = el("p", { text: svc.description ?? "" });

  a.append(title, desc);
  a.addEventListener("click", () => openDetailsModalPublic(svc));
  return a;
}

/* ===== Render (lista com busca + paginação) ===== */
async function renderList() {
  const app = document.getElementById("app") as HTMLElement | null;
  const section = (document.querySelector("#app section") as HTMLElement | null) ?? app;
  if (!section) return;

  clear(section);

  // Wrapper
  const pageWrap = el("div");
  Object.assign(pageWrap.style, { width: "min(1200px, 96vw)", margin: "24px auto" });

  /* --- Toolbar (busca + page size) --- */
  const toolbar = el("div");
  Object.assign(toolbar.style, {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
    margin: "0 0 16px 0"
  });

  const input = el("input", {
    attrs: { id: "pub-search", type: "search", placeholder: "Buscar por nome ou descrição..." }
  }) as HTMLInputElement;
  input.value = state.q;
  Object.assign(input.style, {
    flex: "1",
    minWidth: "240px",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid var(--border)"
  });

  const btnClear = el("button", { classes: ["btn"], text: "Limpar" }) as HTMLButtonElement;
  btnClear.classList.add("ghost");

  const selPageSize = el("select") as HTMLSelectElement;
  [12, 24, 48].forEach((n) => selPageSize.append(new Option(String(n), String(n))));
  selPageSize.value = String(state.pageSize);
  Object.assign(selPageSize.style, {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid var(--border)"
  });

  const info = el("div");
  Object.assign(info.style, { color: "var(--muted)", fontSize: ".92rem" });

  toolbar.append(input, btnClear, selPageSize, info);

  // Busca (debounce)
  const onSearch = debounce(async () => {
    state.q = input.value;
    state.page = 1;
    await renderList();
  }, 300);

  input.addEventListener("input", onSearch);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); onSearch(); } });
  btnClear.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!input.value && !state.q) return;
    input.value = "";
    state.q = "";
    state.page = 1;
    await renderList();
  });
  selPageSize.addEventListener("change", async () => {
    state.pageSize = Number(selPageSize.value) || 12;
    state.page = 1;
    await renderList();
  });

  /* --- Data --- */
  let items: PublicService[] = [];
  let count = 0;
  let page = state.page;
  let pageSize = state.pageSize;

  try {
    const res = await fetchPublicServices();
    items = res.items;
    count = res.count;
    page = res.page;
    pageSize = res.pageSize;
  } catch (e) {
    console.error(e);
  }

  const from = count ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, count);
  info.textContent = count ? `Exibindo ${from}–${to} de ${count}` : "Nenhum serviço encontrado";

  /* --- Grid --- */
  const grid = el("div", { classes: ["grid"] });

  if (items.length) {
    items.forEach((s) => grid.appendChild(card(s)));
  } else {
    grid.append(el("p", { text: "Sem resultados para o filtro atual." }));
  }

  /* --- Paginação --- */
  const pager = el("div");
  Object.assign(pager.style, {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    margin: "16px 0"
  });

  const btnPrev = el("button", { classes: ["btn"], text: "‹ Anterior" }) as HTMLButtonElement;
  btnPrev.classList.add("ghost");
  const btnNext = el("button", { classes: ["btn"], text: "Próxima ›" }) as HTMLButtonElement;
  btnNext.classList.add("ghost");

  btnPrev.disabled = page <= 1;
  btnNext.disabled = page * pageSize >= count;

  btnPrev.addEventListener("click", async () => {
    if (state.page > 1) {
      state.page -= 1;
      await renderList();
    }
  });
  btnNext.addEventListener("click", async () => {
    if (state.page * state.pageSize < count) {
      state.page += 1;
      await renderList();
    }
  });

  const pageInfo = el("div", { text: `Página ${page} de ${Math.max(1, Math.ceil(count / pageSize))}` });
  Object.assign(pageInfo.style, { color: "var(--muted)", fontSize: ".92rem" });

  pager.append(btnPrev, pageInfo, btnNext);

  /* --- Compose --- */
  pageWrap.append(toolbar, grid, pager);
  section.append(pageWrap);
}

/* ===== Boot ===== */
renderList();
