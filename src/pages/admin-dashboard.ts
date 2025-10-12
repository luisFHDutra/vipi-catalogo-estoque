import { el, clear } from "../modules/ui.js";
import { supabase } from "../supabase/supabaseClient.js";

supabase.auth.onAuthStateChange(
  (event: string, session: any) => {
    console.log("Evento:", event);
    console.log("Sessão:", session);
  }
);

/* ===== Tipos (alinha com o schema) ===== */
type DBService = {
  id: number;
  created_at: string | null;
  name: string;
  description: string | null;
  total_time: number | null;   // horas
  price: number | null;        // R$
  visibility: "public" | "private" | null;
  notes: string | null;
  images: string[] | null;     // json[] com URLs
};

/* ===== Helpers ===== */
const view = () => document.getElementById("view")!;
const asNumber = (v: string | null) => {
  if (!v) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const textOrNull = (t: string | null) => (!t || !t.trim()) ? null : t;

const BUCKET = "service-images"; // Supabase Storage bucket (público)

/** Upload múltiplo para o Storage -> retorna URLs públicas */
async function uploadImages(files: FileList): Promise<string[]> {
  const urls: string[] = [];
  for (const file of Array.from(files)) {
    const now = new Date();
    const path = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
    if (upErr) throw upErr;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    if (!data?.publicUrl) throw new Error("Falha ao obter URL pública");
    urls.push(data.publicUrl);
  }
  return urls;
}

/* ===== Router ===== */
type Route = "#/servicos" | "#/novo" | `#/editar/${string}`;
const currentRoute = (): Route => (window.location.hash || "#/servicos") as Route;
const goto = (r: Route) => { if (window.location.hash !== r) window.location.hash = r; else render(); };

/* ===== Navegação superior (estilo homepage) ===== */
function setupTopNav() {
  document.getElementById("nav-servicos")?.addEventListener("click", (e) => { e.preventDefault(); goto("#/servicos"); });
  document.getElementById("nav-novo")?.addEventListener("click", (e) => { e.preventDefault(); goto("#/novo"); });
  document.getElementById("nav-estoque")?.addEventListener("click", () => { /* link direto */ });
  document.getElementById("nav-publico")?.addEventListener("click", () => { /* link direto */ });
  document.getElementById("nav-sair")?.addEventListener("click", async (e) => {
    e.preventDefault();
    await supabase.auth.signOut();
    window.location.href = "./homepage.html";
  });
}

/* ===== CRUD (Supabase) ===== */
async function listAllServices(): Promise<DBService[]> {
  const { data, error } = await supabase
    .from("service")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DBService[];
}

async function getServiceById(id: number): Promise<DBService | null> {
  const { data, error } = await supabase
    .from("service")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as DBService | null;
}

async function createService(payload: Omit<DBService, "id" | "created_at">) {
  const { error } = await supabase.from("service").insert(payload);
  if (error) throw error;
}

async function updateService(id: number, payload: Partial<Omit<DBService, "id" | "created_at">>) {
  const { error } = await supabase.from("service").update(payload).eq("id", id);
  if (error) throw error;
}

async function deleteService(id: number) {
  const { error } = await supabase.from("service").delete().eq("id", id);
  if (error) throw error;
}

/* ===== Views ===== */

// LISTA
async function renderList() {
  const root = view();
  clear(root);

  const page = el("div", { classes: ["page"] });

  const grid = el("div", { classes: ["admin-grid"] });
  const items = await listAllServices();

  items.forEach(svc => {
    const card = el("div", { classes: ["card"] });

    const cover = svc.images?.[0];
    if (cover) {
      const img = el("img", { attrs: { src: cover, alt: svc.name }, classes: ["img-cover"] });
      card.append(img);
    }

    const title = el("h3", { text: svc.name });
    const meta = el("p", {
      classes: ["muted"],
      text:
        `${svc.visibility === "public" ? "Público" : "Privado"} • ` +
        (svc.total_time != null ? `${svc.total_time} h` : "sem tempo") +
        (svc.price != null ? ` • Valor: R$ ${Number(svc.price).toFixed(2)}` : "")
    });

    const actions = el("div", { classes: ["admin-actions"] });
    const btnEdit = el("button", { classes: ["btn", "ghost"], text: "Editar" });
    const btnToggle = el("button", { classes: ["btn", "secondary"], text: svc.visibility === "public" ? "Tornar Privado" : "Tornar Público" });
    const btnDel = el("button", { classes: ["btn", "danger"], text: "Excluir" });

    btnEdit.addEventListener("click", (e) => { e.stopPropagation(); goto(`#/editar/${svc.id}`); });
    btnToggle.addEventListener("click", async (e) => {
      e.stopPropagation();
      const nextVis = svc.visibility === "public" ? "private" : "public";
      await updateService(svc.id, { visibility: nextVis });
      await renderList();
    });
    btnDel.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (confirm(`Excluir "${svc.name}"?`)) { await deleteService(svc.id); await renderList(); }
    });

    actions.append(btnEdit, btnToggle, btnDel);
    card.append(title, meta, actions);

    card.addEventListener("click", () => openDetailsModal(svc));
    grid.append(card);
  });

  page.append(grid);
  root.append(page);
}

// FORM (novo/editar) — com upload no Storage
function renderForm(existing?: DBService) {
  const root = view();
  clear(root);

  const page = el("div", { classes: ["page"] });
  const box = el("div", { classes: ["card"] });
  box.append(el("h2", { text: existing ? "Editar Serviço" : "Cadastrar Serviço" }));

  const form = el("form", { classes: ["form"] });

  const fldName = el("input", { attrs: { id: "fName", required: "true", type: "text", placeholder: "Nome do serviço *" } }) as HTMLInputElement;
  const fldDesc = el("textarea", { attrs: { id: "fDesc", placeholder: "Descrição / Detalhes técnicos" } }) as HTMLTextAreaElement;

  const row1 = el("div", { classes: ["form-row"] });
  const fldHours = el("input", { attrs: { id: "fHours", type: "number", min: "0", step: "0.25", placeholder: "Tempo total (horas)" } }) as HTMLInputElement;
  const fldValue = el("input", { attrs: { id: "fValue", type: "number", min: "0", step: "0.01", placeholder: "Valor cobrado (R$)" } }) as HTMLInputElement;
  row1.append(
    wrap("Tempo total (h)", fldHours, "Use horas decimais. Ex.: 1.5 = 1h30."),
    wrap("Valor cobrado (R$)", fldValue)
  );

  const row2 = el("div", { classes: ["form-row"] });
  const selVis = el("select", { attrs: { id: "fVis" } }) as HTMLSelectElement;
  selVis.append(new Option("Privado", "private"), new Option("Público", "public"));
  const fldImgs = el("input", { attrs: { id: "fImgs", type: "file", accept: "image/*", multiple: "true" } }) as HTMLInputElement;
  row2.append(wrap("Visibilidade", selVis), wrap("Imagens (múltiplas)", fldImgs, "Você pode selecionar várias fotos."));

  const imagesBox = el("div");
  imagesBox.style.marginTop = "6px";

  const fldNotes = el("textarea", { attrs: { id: "fNotes", placeholder: "Notas internas (texto ou JSON como string)" } }) as HTMLTextAreaElement;

  const bar = el("div");
  const btnSave = el("button", { classes: ["btn"], text: "Salvar" });
  const btnCancel = el("button", { classes: ["btn", "ghost"], text: "Cancelar" });
  bar.append(btnSave, btnCancel);

  form.append(
    wrap("Nome do serviço *", fldName),
    wrap("Descrição", fldDesc),
    row1,
    row2,
    imagesBox,
    wrap("Notas internas", fldNotes, "Conteúdo é salvo como texto (pode conter JSON)."),
    bar,
    el("p", { classes: ["note"], text: "Tempo/valor não aparecem no catálogo público." })
  );

  // Estado UI (pré-visualização). Não persiste localmente, apenas mostra o que será gravado no DB.
  let currentImages: string[] = existing?.images?.slice() ?? [];

  function refreshThumbs() {
    imagesBox.innerHTML = "";
    if (!currentImages.length) return;

    const row = el("div", { classes: ["thumbs-row"] });
    currentImages.forEach((url, idx) => {
      const box = el("div", { classes: ["thumb"] });
      const img = el("img", { attrs: { src: url, alt: `img-${idx}` } }) as HTMLImageElement;

      const rm = el("button", { classes: ["btn", "danger", "rm"], text: "×" }) as HTMLButtonElement;
      rm.addEventListener("click", (e) => {
        e.preventDefault();
        currentImages.splice(idx, 1);
        refreshThumbs();
      });

      box.append(img, rm);
      row.append(box);
    });
    imagesBox.append(row);
  }

  // Preencher se edição
  let editingId: number | null = null;
  if (existing) {
    editingId = existing.id;
    fldName.value = existing.name ?? "";
    fldDesc.value = existing.description ?? "";
    fldHours.value = existing.total_time != null ? String(existing.total_time) : "";
    fldValue.value = existing.price != null ? String(existing.price) : "";
    selVis.value = existing.visibility ?? "private";
    fldNotes.value = existing.notes ?? "";
  }
  refreshThumbs();

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();

    const payload: Omit<DBService, "id" | "created_at"> = {
      name: fldName.value.trim(),
      description: textOrNull(fldDesc.value),
      total_time: asNumber(fldHours.value),
      price: asNumber(fldValue.value),
      visibility: (selVis.value as "public" | "private") || "private",
      notes: textOrNull(fldNotes.value),
      images: currentImages.slice(),
    };
    if (!payload.name) { alert("Nome é obrigatório."); return; }

    // Upload para o Storage e gravação dos URLs no DB
    const files = fldImgs.files;
    if (files && files.length > 0) {
      try {
        const newUrls = await uploadImages(files);
        payload.images = [...(payload.images ?? []), ...newUrls];
      } catch (e: any) {
        alert("Falha no upload de imagens: " + (e?.message ?? e));
        return;
      }
    }

    try {
      if (editingId == null) await createService(payload);
      else await updateService(editingId, payload);
      goto("#/servicos");
    } catch (e: any) {
      alert("Erro ao salvar no Supabase: " + (e?.message ?? e));
    }
  });

  btnCancel.addEventListener("click", (e) => { e.preventDefault(); goto("#/servicos"); });

  box.append(form);
  page.append(box);
  root.append(page);

  function wrap(label: string, field: HTMLElement, help?: string) {
    const w = el("label");
    w.append(el("span", { text: label }));
    w.append(field);
    if (help) w.append(el("div", { classes: ["note"], text: help }));
    return w;
  }
}

// MODAL de detalhes com galeria simples
function openDetailsModal(svc: DBService) {
  const bd = el("div", { classes: ["modal-backdrop", "show"] });
  const m = el("div", { classes: ["modal"] });

  const head = el("header");
  head.append(el("h3", { text: svc.name }));

  const content = el("div", { classes: ["content"] });

  // galeria (somente URLs do DB)
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

    const prev = el("div", { classes: ["nav", "prev"], text: "‹" });
    const next = el("div", { classes: ["nav", "next"], text: "›" });
    prev.addEventListener("click", (e) => { e.stopPropagation(); setIndex(idx - 1); });
    next.addEventListener("click", (e) => { e.stopPropagation(); setIndex(idx + 1); });

    frame.append(main);
    gallery.append(frame);
    if (imgs.length > 1) gallery.append(prev, next);
    content.append(gallery);
  }

  // metadados
  const kv = (k: string, v: string) => {
    const row = el("div", { classes: ["kv"] });
    row.append(el("div", { classes: ["k"], text: k }), el("div", { text: v }));
    return row;
  };
  content.append(
    kv("Visibilidade", svc.visibility === "public" ? "Público" : "Privado"),
    kv("Tempo total", svc.total_time != null ? `${svc.total_time} h` : "—"),
    kv("Valor cobrado", svc.price != null ? `R$ ${Number(svc.price).toFixed(2)}` : "—"),
    kv("Criado em", svc.created_at ? new Date(svc.created_at).toLocaleString() : "—"),
  );

  if (svc.description) {
    content.append(el("h4", { text: "Descrição" }), el("p", { text: svc.description }));
  }
  if (svc.notes) {
    content.append(el("h4", { text: "Notas" }));
    const pre = el("pre"); pre.textContent = svc.notes;
    content.append(pre);
  }

  const foot = el("footer");
  const btnEdit = el("button", { classes: ["btn", "ghost"], text: "Editar" });
  const btnClose = el("button", { classes: ["btn"], text: "Fechar" });
  btnEdit.addEventListener("click", () => { document.body.removeChild(bd); goto(`#/editar/${svc.id}`); });
  btnClose.addEventListener("click", () => document.body.removeChild(bd));
  foot.append(btnEdit, btnClose);

  function onKey(e: KeyboardEvent) { if (e.key === "Escape") cleanup(); }
  function cleanup() {
    document.removeEventListener("keydown", onKey);
    try { document.body.removeChild(bd); } catch { }
  }

  m.append(head, content, foot);
  bd.append(m);
  bd.addEventListener("click", (e) => { if (e.target === bd) cleanup(); });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(bd);
}

/* ===== Auth (apenas Supabase) ===== */
let isAuthenticated = false;
async function ensureAuthenticated() {
  if (isAuthenticated) return true;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    // usa o login da homepage e abre modal automaticamente
    window.location.href = `./homepage.html?login=1&next=./admin.html`;
    return false;
  }
  isAuthenticated = true;
  return true;
}

/* ===== Render ===== */
async function render() {
  const authOk = await ensureAuthenticated();
  if (!authOk) return;

  const r = currentRoute();
  if (r.startsWith("#/editar/")) {
    const id = Number(r.split("/")[2]);
    const svc = Number.isFinite(id) ? await getServiceById(id) : null;
    return renderForm(svc ?? undefined);
  }
  if (r === "#/novo") return renderForm();
  return renderList();
}

window.addEventListener("hashchange", () => render());
setupTopNav();
render();
