import { clear, el } from "../modules/ui.js";
import { listPublicServices } from "../modules/services-api.js";
function openDetailsModalPublic(svc) {
    const bd = el("div", { classes: ["modal-backdrop", "show"] });
    const m = el("div", { classes: ["modal"] });
    const head = el("header");
    head.append(el("h3", { text: svc.name }));
    const content = el("div", { classes: ["content"] });
    const imgs = (svc.images?.length ? svc.images : (svc.image_url ? [svc.image_url] : []));
    let idx = 0;
    const gallery = el("div", { classes: ["carousel"] });
    const frame = el("div", { classes: ["frame"] });
    const main = el("img", { classes: ["img"], attrs: { src: imgs[0] ?? "", alt: svc.name } });
    function setIndex(i) {
        if (!imgs.length)
            return;
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
    if (imgs.length > 1)
        gallery.append(prev, next);
    content.append(gallery);
    if (svc.description) {
        content.append(el("h4", { text: "Descrição" }), el("p", { text: svc.description }));
    }
    const foot = el("footer");
    const btnClose = el("button", { classes: ["btn"], text: "Fechar" });
    btnClose.addEventListener("click", () => document.body.removeChild(bd));
    foot.append(btnClose);
    function cleanup() {
        document.removeEventListener("keydown", onKey);
        try {
            document.body.removeChild(bd);
        }
        catch { }
    }
    function onKey(e) { if (e.key === "Escape")
        cleanup(); }
    m.append(head, content, foot);
    bd.append(m);
    bd.addEventListener("click", (e) => { if (e.target === bd)
        cleanup(); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(bd);
}
/* Lightbox igual ao do Admin (cole abaixo da função acima) */
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
function card(svc) {
    const a = el("div", { classes: ["card"] });
    const cover = (svc.images && svc.images[0]) || svc.image_url;
    if (cover) {
        const img = document.createElement("img");
        img.src = cover;
        img.alt = svc.name;
        img.className = "img-cover";
        a.appendChild(img);
    }
    const title = el("h3", { text: svc.name });
    const desc = el("p", { text: svc.description ?? "" });
    const badge = el("span", { classes: ["badge"], text: "Público" });
    a.append(title, desc, badge);
    a.addEventListener("click", () => openDetailsModalPublic(svc));
    return a;
}
async function main() {
    const grid = document.getElementById("services-grid");
    clear(grid);
    const services = await listPublicServices();
    services.forEach(s => grid.appendChild(card(s)));
}
main().catch(console.error);
