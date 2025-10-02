// public/js/pages/public-catalog.js (ou .ts)
import { clear, el } from "../modules/ui.js";
import { supabase } from "../supabase/supabaseClient.js";

/* ===== Tipos (apenas o que usamos no catálogo público) ===== */
type PublicService = {
  id: number;
  created_at: string | null;
  name: string;
  description: string | null;
  images: string[] | null; // capa = images[0]
};

/* ===== Data (Supabase) ===== */
async function listPublicServices(): Promise<PublicService[]> {
  const { data, error } = await supabase
    .from("service")
    .select("id, name, description, images, created_at")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as PublicService[];
}

/* ===== UI ===== */
function openDetailsModalPublic(svc: PublicService) {
  const bd = el("div", { classes: ["modal-backdrop", "show"] });
  const m = el("div", { classes: ["modal"] });

  const head = el("header");
  head.append(el("h3", { text: svc.name }));

  const content = el("div", { classes: ["content"] });

  const imgs = (svc.images ?? []) as string[];
  let idx = 0;

  // Galeria
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
    try { document.body.removeChild(bd); } catch {}
  }
  function onKey(e: KeyboardEvent) { if (e.key === "Escape") cleanup(); }

  m.append(head, content, foot);
  bd.append(m);
  bd.addEventListener("click", (e) => { if (e.target === bd) cleanup(); });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(bd);
}

/* Lightbox */
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
    try { document.body.removeChild(bd); } catch {}
  }

  box.append(img);
  if (images.length > 1) box.append(prev, next);
  bd.append(box);

  bd.addEventListener("click", (e) => { if (e.target === bd) cleanup(); });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(bd);
}

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

async function main() {
  const grid = document.getElementById("services-grid")!;
  clear(grid);

  try {
    const services = await listPublicServices();
    services.forEach(s => grid.appendChild(card(s)));
  } catch (e) {
    console.error(e);
    grid.append(el("p", { classes: ["note"], text: "Falha ao carregar os serviços." }));
  }
}

main();
