import { el, clear } from "../modules/ui.js";
import { listAllServices, createService, updateService, deleteService, uploadServiceImages, toggleVisibility } from "../modules/services-api.js";
import { getSupabase, isSupabaseConfigured } from "../supabase/client.js";
import { isLocalLoggedIn, localLogout } from "../modules/local-auth.js";
/* ===== Helpers ===== */
const view = () => document.getElementById("view");
const HOUR = 60;
const minutesToHours = (min) => min == null ? "" : (min / HOUR).toFixed(Number.isInteger(min / HOUR) ? 0 : 2);
const hoursToMinutes = (h) => {
    const n = Number(h.replace(",", "."));
    return Number.isFinite(n) ? Math.round(n * HOUR) : undefined;
};
const asNumber = (v) => {
    if (!v)
        return undefined;
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : undefined;
};
const tryParseJSON = (t) => (!t || !t.trim()) ? undefined : (() => { try {
    return JSON.parse(t);
}
catch {
    return t;
} })();
const currentRoute = () => (window.location.hash || "#/servicos");
const goto = (r) => { if (window.location.hash !== r)
    window.location.hash = r;
else
    render(); };
/* ===== Menu (dropdown) ===== */
function setupMenu() {
    const btn = document.getElementById("menuBtn");
    const dd = document.getElementById("menuDropdown");
    if (!btn || !dd)
        return;
    const open = () => { dd.classList.add("show"); btn.setAttribute("aria-expanded", "true"); dd.setAttribute("aria-hidden", "false"); };
    const close = () => { dd.classList.remove("show"); btn.setAttribute("aria-expanded", "false"); dd.setAttribute("aria-hidden", "true"); };
    btn.addEventListener("click", (e) => { e.preventDefault(); dd.classList.contains("show") ? close() : open(); });
    document.addEventListener("click", (e) => { const t = e.target; if (!dd.contains(t) && !btn.contains(t))
        close(); });
    window.addEventListener("hashchange", close);
    window.addEventListener("keydown", (e) => { if (e.key === "Escape")
        close(); });
    document.getElementById("menuServicos")?.addEventListener("click", (e) => { e.preventDefault(); goto("#/servicos"); close(); });
    document.getElementById("menuNovo")?.addEventListener("click", (e) => { e.preventDefault(); goto("#/novo"); close(); });
    document.getElementById("menuEstoque")?.addEventListener("click", () => close());
    document.getElementById("menuPublico")?.addEventListener("click", () => close());
    document.getElementById("menuLogout")?.addEventListener("click", async (e) => {
        e.preventDefault();
        if (isSupabaseConfigured) {
            const sb = await getSupabase();
            await sb.auth.signOut();
        }
        else {
            localLogout();
        }
        window.location.href = "./login.html";
    });
}
/* ===== Views ===== */
// LISTA
async function renderList() {
    const root = view();
    clear(root);
    const page = el("div", { classes: ["page"] });
    const header = el("div", { classes: ["card"] });
    header.append(el("h2", { text: "Serviços" }), el("p", { classes: ["muted"], text: "Clique em um card para ver galeria e detalhes. Use os botões para editar, publicar/privar ou excluir." }));
    const grid = el("div", { classes: ["admin-grid"] });
    const items = await listAllServices();
    items.forEach(svc => {
        const card = el("div", { classes: ["card"] });
        const cover = (svc.images && svc.images[0]) || svc.image_url;
        if (cover) {
            const img = el("img", { attrs: { src: cover, alt: svc.name }, classes: ["img-cover"] });
            card.append(img);
        }
        const title = el("h3", { text: svc.name });
        const meta = el("p", {
            classes: ["muted"],
            text: `${svc.is_public ? "Público" : "Privado"} • ` +
                (svc.execution_time_minutes != null ? `${minutesToHours(svc.execution_time_minutes)} h` : "sem tempo") +
                (svc.charged_value != null ? ` • Valor: R$ ${Number(svc.charged_value).toFixed(2)}` : "")
        });
        const actions = el("div", { classes: ["admin-actions"] });
        const btnEdit = el("button", { classes: ["btn", "ghost"], text: "Editar" });
        const btnToggle = el("button", { classes: ["btn", "secondary"], text: svc.is_public ? "Tornar Privado" : "Tornar Público" });
        const btnDel = el("button", { classes: ["btn", "danger"], text: "Excluir" });
        btnEdit.addEventListener("click", (e) => { e.stopPropagation(); goto(`#/editar/${svc.id}`); });
        btnToggle.addEventListener("click", async (e) => { e.stopPropagation(); await toggleVisibility(svc.id, !svc.is_public); await renderList(); });
        btnDel.addEventListener("click", async (e) => {
            e.stopPropagation();
            if (confirm(`Excluir "${svc.name}"?`)) {
                await deleteService(svc.id);
                await renderList();
            }
        });
        actions.append(btnEdit, btnToggle, btnDel);
        card.append(title, meta, actions);
        card.addEventListener("click", () => openDetailsModal(svc, false));
        grid.append(card);
    });
    page.append(header, grid);
    root.append(page);
}
// FORM (novo/editar) — HORAS + VALOR COBRADO + múltiplas imagens
function renderForm(existing) {
    const root = view();
    clear(root);
    const page = el("div", { classes: ["page"] }); // << wrapper centralizador
    const box = el("div", { classes: ["card"] });
    box.append(el("h2", { text: existing ? "Editar Serviço" : "Cadastrar Serviço" }));
    const form = el("form", { classes: ["form"] });
    const fldName = el("input", { attrs: { id: "fName", required: "true", type: "text", placeholder: "Nome do serviço *" } });
    const fldDesc = el("textarea", { attrs: { id: "fDesc", placeholder: "Descrição / Detalhes técnicos" } });
    const row1 = el("div", { classes: ["form-row"] });
    const fldHours = el("input", { attrs: { id: "fHours", type: "number", min: "0", step: "0.25", placeholder: "Tempo total (horas)" } });
    const fldValue = el("input", { attrs: { id: "fValue", type: "number", min: "0", step: "0.01", placeholder: "Valor cobrado (R$)" } });
    row1.append(wrap("Tempo total (h)", fldHours, "Use horas decimais. Ex.: 1.5 = 1h30."), wrap("Valor cobrado (R$)", fldValue));
    const row2 = el("div", { classes: ["form-row"] });
    const selVis = el("select", { attrs: { id: "fVis" } });
    selVis.append(new Option("Privado", "false"), new Option("Público", "true"));
    const fldImgs = el("input", { attrs: { id: "fImgs", type: "file", accept: "image/*", multiple: "true" } });
    row2.append(wrap("Visibilidade", selVis), wrap("Imagens (múltiplas)", fldImgs, "Você pode selecionar várias fotos."));
    const imagesBox = el("div");
    imagesBox.style.marginTop = "6px";
    const fldNotes = el("textarea", { attrs: { id: "fNotes", placeholder: 'Notas internas (JSON ou texto livre)' } });
    const bar = el("div");
    const btnSave = el("button", { classes: ["btn"], text: "Salvar" });
    const btnCancel = el("button", { classes: ["btn", "ghost"], text: "Cancelar" });
    bar.append(btnSave, btnCancel);
    form.append(wrap("Nome do serviço *", fldName), wrap("Descrição", fldDesc), row1, row2, imagesBox, wrap("Notas internas", fldNotes, "JSON será parseado; texto comum também é aceito."), bar, el("p", { classes: ["note"], text: "Tempo/valor não aparecem no catálogo público." }));
    // Estado de imagens (igual ao seu)
    let currentImages = existing?.images?.slice() ?? (existing?.image_url ? [existing.image_url] : []);
    function refreshThumbs() {
        imagesBox.innerHTML = "";
        if (!currentImages?.length)
            return;
        const row = el("div", { classes: ["thumbs-row"] });
        currentImages.forEach((url, idx) => {
            const box = el("div", { classes: ["thumb"] });
            const img = el("img", { attrs: { src: url, alt: `img-${idx}` } });
            const rm = el("button", { classes: ["btn", "danger", "rm"], text: "×" });
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
    let editingId;
    if (existing) {
        editingId = existing.id;
        fldName.value = existing.name ?? "";
        fldDesc.value = existing.description ?? "";
        fldHours.value = minutesToHours(existing.execution_time_minutes);
        fldValue.value = existing.charged_value != null ? String(existing.charged_value) : "";
        selVis.value = String(!!existing.is_public);
        fldNotes.value = existing.annotations
            ? (typeof existing.annotations === "string" ? existing.annotations : JSON.stringify(existing.annotations, null, 2))
            : "";
    }
    refreshThumbs();
    form.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const payload = {
            name: fldName.value.trim(),
            description: fldDesc.value.trim() || undefined,
            execution_time_minutes: hoursToMinutes(fldHours.value),
            charged_value: asNumber(fldValue.value),
            is_public: selVis.value === "true",
            annotations: tryParseJSON(fldNotes.value),
            images: currentImages.slice()
        };
        if (!payload.name) {
            alert("Nome é obrigatório.");
            return;
        }
        const files = fldImgs.files;
        if (files && files.length > 0) {
            try {
                const urls = await uploadServiceImages(files);
                payload.images = [...(payload.images ?? []), ...urls];
            }
            catch (e) {
                alert("Falha no upload de imagens: " + (e?.message ?? e));
                return;
            }
        }
        if (payload.images && payload.images.length)
            payload.image_url = payload.images[0];
        if (!editingId)
            await createService(payload);
        else
            await updateService(editingId, payload);
        goto("#/servicos");
    });
    btnCancel.addEventListener("click", (e) => { e.preventDefault(); goto("#/servicos"); });
    box.append(form);
    page.append(box);
    root.append(page);
    function wrap(label, field, help) {
        const w = el("label");
        w.append(el("span", { text: label }));
        w.append(field);
        if (help)
            w.append(el("div", { classes: ["note"], text: help }));
        return w;
    }
}
// MODAL de detalhes com galeria (Admin)
// publicMode=false: mostra tempo e valor; true: esconde.
function openDetailsModal(svc, publicMode) {
    const bd = el("div", { classes: ["modal-backdrop", "show"] });
    const m = el("div", { classes: ["modal"] });
    const head = el("header");
    head.append(el("h3", { text: svc.name }));
    const content = el("div", { classes: ["content"] });
    const imgs = (svc.images?.length ? svc.images : (svc.image_url ? [svc.image_url] : []));
    let idx = 0;
    // Galeria enxuta: 1 imagem visível + setas
    const gallery = el("div", { classes: ["carousel"] });
    const frame = el("div", { classes: ["frame"] });
    const main = el("img", { classes: ["img"], attrs: { src: imgs[0] ?? "", alt: svc.name } });
    function setIndex(i) {
        if (!imgs.length)
            return;
        idx = (i + imgs.length) % imgs.length;
        main.src = imgs[idx];
    }
    // Clique: abre LIGHTBOX (só imagem expande)
    main.addEventListener("click", () => openLightbox(imgs, idx));
    const prev = el("div", { classes: ["nav", "prev"], text: "‹" });
    const next = el("div", { classes: ["nav", "next"], text: "›" });
    prev.addEventListener("click", (e) => { e.stopPropagation(); setIndex(idx - 1); });
    next.addEventListener("click", (e) => { e.stopPropagation(); setIndex(idx + 1); });
    frame.append(main);
    gallery.append(frame);
    if (imgs.length > 1)
        gallery.append(prev, next);
    content.append(gallery);
    // Metadados (sensíveis só no admin)
    const kv = (k, v) => {
        const row = el("div", { classes: ["kv"] });
        row.append(el("div", { classes: ["k"], text: k }), el("div", { text: v }));
        return row;
    };
    content.append(kv("Visibilidade", svc.is_public ? "Público" : "Privado"), ...(!publicMode ? [
        kv("Tempo total", svc.execution_time_minutes != null ? `${minutesToHours(svc.execution_time_minutes)} h` : "—"),
        kv("Valor cobrado", svc.charged_value != null ? `R$ ${Number(svc.charged_value).toFixed(2)}` : "—"),
    ] : []), kv("Criado em", svc.created_at ? new Date(svc.created_at).toLocaleString() : "—"));
    if (svc.description) {
        content.append(el("h4", { text: "Descrição" }), el("p", { text: svc.description }));
    }
    if (svc.annotations) {
        content.append(el("h4", { text: "Anotações" }));
        if (typeof svc.annotations === "object") {
            const pre = el("pre");
            pre.textContent = JSON.stringify(svc.annotations, null, 2);
            content.append(pre);
        }
        else {
            content.append(el("p", { text: String(svc.annotations) }));
        }
    }
    const foot = el("footer");
    const btnEdit = el("button", { classes: ["btn", "ghost"], text: "Editar" });
    const btnClose = el("button", { classes: ["btn"], text: "Fechar" });
    btnEdit.addEventListener("click", () => { document.body.removeChild(bd); goto(`#/editar/${svc.id}`); });
    btnClose.addEventListener("click", () => document.body.removeChild(bd));
    foot.append(btnEdit, btnClose);
    // ESC fecha modal
    function onKey(e) { if (e.key === "Escape")
        cleanup(); }
    function cleanup() {
        document.removeEventListener("keydown", onKey);
        try {
            document.body.removeChild(bd);
        }
        catch { }
    }
    m.append(head, content, foot);
    bd.append(m);
    bd.addEventListener("click", (e) => { if (e.target === bd)
        cleanup(); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(bd);
}
// LIGHTBOX: expande só a imagem (navegação ←/→, fechar com ESC ou clique fora)
function openLightbox(images, startIndex = 0) {
    if (!images.length)
        return;
    let idx = startIndex;
    const bd = el("div", { classes: ["lightbox-backdrop"] });
    const box = el("div", { classes: ["lightbox"] });
    const img = el("img", { classes: ["lightbox-img"], attrs: { src: images[idx] } });
    const prev = el("div", { classes: ["nav", "prev"], text: "‹" });
    const next = el("div", { classes: ["nav", "next"], text: "›" });
    function setIndex(i) {
        idx = (i + images.length) % images.length;
        img.src = images[idx];
    }
    prev.addEventListener("click", (e) => { e.stopPropagation(); setIndex(idx - 1); });
    next.addEventListener("click", (e) => { e.stopPropagation(); setIndex(idx + 1); });
    function onKey(e) {
        if (e.key === "Escape")
            cleanup();
        if (images.length && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
            setIndex(e.key === "ArrowLeft" ? idx - 1 : idx + 1);
        }
    }
    function cleanup() {
        document.removeEventListener("keydown", onKey);
        try {
            document.body.removeChild(bd);
        }
        catch { }
    }
    box.append(img);
    if (images.length > 1)
        box.append(prev, next);
    bd.append(box);
    bd.addEventListener("click", (e) => { if (e.target === bd)
        cleanup(); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(bd);
}
/* ===== Auth placeholder ===== */
let isAuthenticated = false;
async function ensureAuthenticated() {
    if (isAuthenticated)
        return true;
    if (isSupabaseConfigured) {
        const sb = await getSupabase();
        const { data: { session } } = await sb.auth.getSession();
        if (!session) {
            window.location.href = `./login.html?next=./admin.html`;
            return false;
        }
    }
    else {
        if (!isLocalLoggedIn()) {
            window.location.href = `./login.html?next=./admin.html`;
            return false;
        }
    }
    isAuthenticated = true;
    return true;
}
/* ===== Render ===== */
async function render() {
    const authOk = await ensureAuthenticated();
    if (!authOk)
        return;
    const r = currentRoute();
    if (r.startsWith("#/editar/")) {
        const id = r.split("/")[2];
        const all = await listAllServices();
        const svc = all.find(s => s.id === id);
        return renderForm(svc);
    }
    if (r === "#/novo")
        return renderForm();
    return renderList();
}
window.addEventListener("hashchange", () => render());
setupMenu();
render();
