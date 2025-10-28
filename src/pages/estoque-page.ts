import { el, clear } from "../modules/ui.js";
import type { Tool } from "../modules/types.js";
import { supabase } from "../supabase/supabaseClient.js";

let tools: Tool[] = [];
let searchTerm = "";
let filterStatus: "all" | "low" | "ok" = "all";
let sortBy: "name" | "quantity" | "location" = "name";

function showToast(
  message: string,
  type: "success" | "error" | "warning" | "info" = "success"
) {
  const container = document.getElementById("toast-container")!;
  const toast = el("div", { classes: ["toast", type] });
  toast.append(el("span", { text: message }));
  container.append(toast);
  setTimeout(() => {
    toast.classList.add("slide-out");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showModal(title: string, content: HTMLElement, onClose?: () => void) {
  const container = document.getElementById("modal-container")!;
  const modal = el("div", { classes: ["modal"] });

  const header = el("div", { classes: ["modal-header"] });
  const titleEl = el("h3", { classes: ["modal-title"], text: title });
  const closeBtn = el("button", {
    classes: ["modal-close"],
    attrs: { onclick: "closeModal()" },
  });
  closeBtn.innerHTML = "&times;";

  header.append(titleEl, closeBtn);
  modal.append(header, content);
  container.append(modal);
  container.classList.add("active");

  (window as any).closeModal = function () {
    container.classList.remove("active");
    setTimeout(() => {
      container.innerHTML = "";
      onClose?.();
    }, 300);
  };
}

async function fetchTools() {
  const { data, error } = await supabase
    .from("tool")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    showToast("Erro ao carregar ferramentas!", "error");
    return;
  }

  tools = (data ?? []).map((t: any) => ({
    id: String(t.id),
    name: t.name,
    description: t.description ?? undefined,
    quantity: Number(t.quantity ?? 0),
    min_quantity: Number(t.min_quantity ?? 0),
    location: t.location ?? undefined,
    updated_at: t.created_at,
  }));

  renderEstoquePage();
}

function subscribeRealtime() {
  supabase
    .channel("tools-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "tool" },
      () => fetchTools()
    )
    .subscribe();
}

function getFilteredAndSortedTools(): Tool[] {
  const filtered = tools.filter((tool) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      tool.name.toLowerCase().includes(s) ||
      tool.description?.toLowerCase().includes(s) ||
      tool.location?.toLowerCase().includes(s);

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "low" && tool.quantity <= tool.min_quantity) ||
      (filterStatus === "ok" && tool.quantity > tool.min_quantity);

    return matchesSearch && matchesFilter;
  });

  return filtered.sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "quantity") return b.quantity - a.quantity;
    return (a.location || "").localeCompare(b.location || "");
  });
}

function renderEstoquePage() {
  const content = document.getElementById("content")!;
  clear(content);
  renderQuickStats();
  renderSearchAndFilters();
  renderToolsList();
}

function renderQuickStats() {
  const content = document.getElementById("content")!;
  const statsCard = el("div", { classes: ["card", "modern-card"] });
  const title = el("h3", { text: "Resumo do Estoque", attrs: { style: "margin-bottom:20px;" } });

  const totalTools = tools.length;
  const lowStockTools = tools.filter((t) => t.quantity <= t.min_quantity).length;
  const totalQuantity = tools.reduce((s, t) => s + t.quantity, 0);
  const avgQuantity = totalTools > 0 ? Math.round(totalQuantity / totalTools) : 0;

  const grid = el("div", {
    classes: ["grid"],
    attrs: { style: "grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;" },
  });

  grid.append(
    stat("Ferramentas", String(totalTools)),
    stat("Estoque Baixo", String(lowStockTools)),
    stat("Total de Itens", String(totalQuantity)),
    stat("Média por Item", String(avgQuantity))
  );

  statsCard.append(title, grid);
  content.append(statsCard);

  function stat(label: string, value: string) {
    const c = el("div", { classes: ["stats-card"] });
    c.append(
      el("p", { text: label, attrs: { style: "margin:0;color:var(--muted);font-size:.9rem;" } }),
      el("h4", { text: value, attrs: { style: "margin:8px 0;font-size:2.2rem;color:var(--sec2);" } })
    );
    return c;
  }
}

function renderSearchAndFilters() {
  const content = document.getElementById("content")!;
  const card = el("div", { classes: ["card", "modern-card"] });

  const title = el("h3", { text: "Buscar e Filtrar", attrs: { style: "margin-bottom:20px;" } });
  const row = el("div", { classes: ["search-container"] });

  const searchInput = el("input", {
    classes: ["search-input"],
    attrs: {
      type: "text",
      placeholder: "Buscar por nome, descrição ou localização...",
      value: searchTerm,
      oninput: "handleSearch(this.value)",
    },
  });

  const filterSelect = el("select", {
    classes: ["filter-select"],
    attrs: { value: filterStatus, onchange: "handleFilter(this.value)" },
  });
  filterSelect.append(
    el("option", { text: "Todos os itens", attrs: { value: "all" } }),
    el("option", { text: "Estoque baixo", attrs: { value: "low" } }),
    el("option", { text: "Estoque OK", attrs: { value: "ok" } })
  );

  const sortSelect = el("select", {
    classes: ["filter-select"],
    attrs: { value: sortBy, onchange: "handleSort(this.value)" },
  });
  sortSelect.append(
    el("option", { text: "Ordenar por nome", attrs: { value: "name" } }),
    el("option", { text: "Ordenar por quantidade", attrs: { value: "quantity" } }),
    el("option", { text: "Ordenar por localização", attrs: { value: "location" } })
  );

  const actions = el("div", { attrs: { style: "display:flex;gap:12px;flex-wrap:wrap;margin-top:16px;" } });
  const addBtn = el("button", { classes: ["btn"], attrs: { onclick: "showAddToolModal()" } });
  addBtn.innerHTML = '<i class="fas fa-plus"></i> Nova Ferramenta';

  const reportBtn = el("button", { classes: ["btn", "btn-secondary"], attrs: { onclick: "showDetailedReport()" } });
  reportBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Relatório';

  const exportBtn = el("button", { classes: ["btn", "btn-success"], attrs: { onclick: "exportStockData()" } });
  exportBtn.innerHTML = '<i class="fas fa-download"></i> Exportar';

  actions.append(addBtn, reportBtn, exportBtn);
  row.append(searchInput, filterSelect, sortSelect);
  card.append(title, row, actions);
  content.append(card);

  (window as any).handleSearch = (v: string) => { searchTerm = v; renderToolsList(); };
  (window as any).handleFilter = (v: string) => { filterStatus = v as typeof filterStatus; renderToolsList(); };
  (window as any).handleSort = (v: string) => { sortBy = v as typeof sortBy; renderToolsList(); };
}

function renderToolsList() {
  const content = document.getElementById("content")!;
  document.getElementById("tools-list")?.remove();

  const card = el("div", { classes: ["card", "modern-card"], attrs: { id: "tools-list" } });
  const title = el("h3", { text: "Ferramentas em Estoque", attrs: { style: "margin-bottom:20px;" } });

  const filtered = getFilteredAndSortedTools();
  const count = el("p", { text: `${filtered.length} de ${tools.length} ferramentas`, attrs: { style: "color:var(--muted);margin-bottom:20px;" } });

  card.append(title, count);

  if (!filtered.length) {
    const empty = el("div", { attrs: { style: "text-align:center;padding:60px 20px;color:var(--muted);" } });
    empty.append(
      el("h4", { text: "Nenhuma ferramenta encontrada", attrs: { style: "margin:0 0 10px 0;" } }),
      el("p", { text: "Ajuste os filtros de busca ou adicione uma nova ferramenta.", attrs: { style: "margin:0;" } })
    );
    card.append(empty);
  } else {
    const grid = el("div", {
      classes: ["grid"],
      attrs: { style: "grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px;" },
    });
    filtered.forEach((tool) => grid.append(createToolCard(tool)));
    card.append(grid);
  }

  content.append(card);
}

function createToolCard(tool: Tool): HTMLElement {
  const c = el("div", { classes: ["card"] });

  const low = tool.quantity <= tool.min_quantity;
  const status = el("div", { classes: ["status-badge", low ? "warning" : "success"] });
  status.textContent = low ? "Estoque Baixo" : "Em Estoque";

  const header = el("div", { attrs: { style: "display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;" } });
  header.append(el("h4", { text: tool.name, attrs: { style: "margin:0;font-size:1.2rem;font-weight:700;" } }), status);

  const desc = el("p", { text: tool.description || "Sem descrição", attrs: { style: "color:var(--muted);margin:0 0 16px 0;font-size:.95rem;" } });

  const info = el("div", { attrs: { style: "background:#fafbff;border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:12px;" } });
  info.append(
    kv("Quantidade:", String(tool.quantity), low ? "var(--warning)" : "var(--success)"),
    kv("Mínimo:", String(tool.min_quantity)),
    kv("Local:", tool.location || "Não informado")
  );

  const actions = el("div", { attrs: { style: "display:flex;gap:8px;" } });
  const edit = el("button", { classes: ["btn", "btn-secondary", "btn-sm"], attrs: { onclick: `editTool('${tool.id}')` } }); edit.innerHTML = '<i class="fas fa-edit"></i> Editar';
  const del = el("button", { classes: ["btn", "btn-danger", "btn-sm"], attrs: { onclick: `deleteTool('${tool.id}')` } }); del.innerHTML = '<i class="fas fa-trash"></i> Excluir';
  actions.append(edit, del);

  c.append(header, desc, info, actions);
  return c;

  function kv(k: string, v: string, color?: string) {
    const row = el("div", { attrs: { style: "display:flex;justify-content:space-between;align-items:center;margin:6px 0;" } });
    row.append(
      el("span", { text: k, attrs: { style: "color:var(--muted);" } }),
      el("span", { text: v, attrs: { style: color ? `color:${color};font-weight:700;` : "" } })
    );
    return row;
  }
}

(window as any).showAddToolModal = function () {
  const form = el("form", { classes: ["form"], attrs: { onsubmit: "handleAddTool(event)" } });
  form.append(
    el("input", { attrs: { type: "text", name: "name", placeholder: "Nome da ferramenta", required: "true" } }),
    el("textarea", { attrs: { name: "description", placeholder: "Descrição (opcional)", rows: "3" } }),
    el("input", { attrs: { type: "number", name: "quantity", placeholder: "Quantidade atual", min: "0", required: "true" } }),
    el("input", { attrs: { type: "number", name: "min_quantity", placeholder: "Quantidade mínima", min: "0", required: "true" } }),
    el("input", { attrs: { type: "text", name: "location", placeholder: "Localização (opcional)" } }),
    btnRow()
  );
  showModal("Nova Ferramenta", form);
  function btnRow() {
    const r = el("div", { attrs: { style: "display:flex;gap:12px;margin-top:20px;" } });
    const save = el("button", { classes: ["btn"], attrs: { type: "submit" } }); save.innerHTML = '<i class="fas fa-save"></i> Salvar';
    const cancel = el("button", { classes: ["btn", "btn-secondary"], attrs: { type: "button", onclick: "closeModal()" } }); cancel.innerHTML = '<i class="fas fa-times"></i> Cancelar';
    r.append(save, cancel); return r;
  }
};

(window as any).handleAddTool = async function (event: Event) {
  event.preventDefault();
  const f = event.target as HTMLFormElement; const d = new FormData(f);
  const payload = {
    name: String(d.get("name") || "").trim(),
    description: (d.get("description") as string) || null,
    quantity: parseFloat(String(d.get("quantity") || "0")),
    min_quantity: parseFloat(String(d.get("min_quantity") || "0")),
    location: (d.get("location") as string) || null,
  };
  const { error } = await supabase.from("tool").insert([payload]);
  if (error) return showToast("Erro ao adicionar ferramenta!", "error");
  (window as any).closeModal(); await fetchTools(); showToast("Ferramenta adicionada com sucesso!", "success");
};

(window as any).editTool = function (id: string) {
  const t = tools.find((x) => x.id === id); if (!t) return;
  const form = el("form", { classes: ["form"], attrs: { onsubmit: "handleEditTool(event)" } });
  const hid = el("input", { attrs: { type: "hidden", name: "id", value: t.id } });
  const name = el("input", { attrs: { type: "text", name: "name", value: t.name, required: "true" } });
  const desc = el("textarea", { attrs: { name: "description", rows: "3" } }) as HTMLTextAreaElement; desc.value = t.description || "";
  const qty = el("input", { attrs: { type: "number", name: "quantity", value: String(t.quantity), min: "0", required: "true" } });
  const min = el("input", { attrs: { type: "number", name: "min_quantity", value: String(t.min_quantity), min: "0", required: "true" } });
  const loc = el("input", { attrs: { type: "text", name: "location", value: t.location || "" } });
  const btns = el("div", { attrs: { style: "display:flex;gap:12px;margin-top:20px;" } });
  const save = el("button", { classes: ["btn"], attrs: { type: "submit" } }); save.innerHTML = '<i class="fas fa-save"></i> Salvar';
  const cancel = el("button", { classes: ["btn", "btn-secondary"], attrs: { type: "button", onclick: "closeModal()" } }); cancel.innerHTML = '<i class="fas fa-times"></i> Cancelar';
  btns.append(save, cancel);
  form.append(hid, name, desc, qty, min, loc, btns);
  showModal("Editar Ferramenta", form);

  (window as any).handleEditTool = async function (event: Event) {
    event.preventDefault();
    const f = event.target as HTMLFormElement; const d = new FormData(f);
    const payload = {
      name: String(d.get("name") || "").trim(),
      description: (d.get("description") as string) || null,
      quantity: parseFloat(String(d.get("quantity") || "0")),
      min_quantity: parseFloat(String(d.get("min_quantity") || "0")),
      location: (d.get("location") as string) || null,
    };
    const { error } = await supabase.from("tool").update(payload).eq("id", Number(String(d.get("id") || "")));
    if (error) return showToast("Erro ao atualizar ferramenta!", "error");
    (window as any).closeModal(); await fetchTools(); showToast("Ferramenta atualizada com sucesso!", "success");
  };
};

(window as any).deleteTool = function (id: string) {
  const t = tools.find((x) => x.id === id); if (!t) return;
  const box = el("div", { attrs: { style: "text-align:center;" } });
  box.append(
    el("p", { text: `Tem certeza que deseja excluir a ferramenta "${t.name}"?`, attrs: { style: "font-size:1.05rem;margin-bottom:18px;" } }),
    el("p", { text: "Esta ação não pode ser desfeita.", attrs: { style: "color:var(--muted);margin-bottom:26px;" } })
  );
  const row = el("div", { attrs: { style: "display:flex;gap:12px;justify-content:center;" } });
  const ok = el("button", { classes: ["btn", "btn-danger"], attrs: { onclick: `confirmDelete('${id}')` } }); ok.innerHTML = '<i class="fas fa-trash"></i> Excluir';
  const cancel = el("button", { classes: ["btn", "btn-secondary"], attrs: { onclick: "closeModal()" } }); cancel.innerHTML = '<i class="fas fa-times"></i> Cancelar';
  row.append(ok, cancel); box.append(row);
  showModal("Confirmar Exclusão", box);

  (window as any).confirmDelete = async function (toolId: string) {
    const { error } = await supabase.from("tool").delete().eq("id", Number(toolId));
    if (error) return showToast("Erro ao excluir ferramenta!", "error");
    (window as any).closeModal(); await fetchTools(); showToast("Ferramenta excluída com sucesso!", "success");
  };
};

(window as any).showDetailedReport = function () {
  const c = el("div");
  const totalTools = tools.length;
  const low = tools.filter((t) => t.quantity <= t.min_quantity).length;
  const totalQty = tools.reduce((s, t) => s + t.quantity, 0);
  const avg = totalTools ? Math.round(totalQty / totalTools) : 0;

  c.append(
    el("p", { text: `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, attrs: { style: "color:var(--muted);font-size:.9rem;margin-bottom:20px;" } })
  );

  const grid = el("div", { classes: ["grid"], attrs: { style: "grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:30px;" } });
  grid.append(
    stat("Total de Ferramentas", totalTools),
    stat("Estoque Baixo", low),
    stat("Total de Itens", totalQty),
    stat("Média por Item", avg)
  );
  c.append(grid);

  const sec = el("div", { attrs: { style: "margin-top:30px;" } });
  sec.append(el("h4", { text: "Ferramentas com Estoque Baixo", attrs: { style: "margin-bottom:12px;" } }));
  const list = el("div");
  const lows = tools.filter((t) => t.quantity <= t.min_quantity);
  if (!lows.length) {
    list.append(el("p", { text: "Todas as ferramentas estão com estoque adequado.", attrs: { style: "color:var(--success);font-weight:700;background:rgba(40,167,69,.1);border:1px solid var(--success);padding:12px;border-radius:10px;text-align:center;" } }));
  } else {
    lows.forEach((t) => {
      list.append(
        el("div", { attrs: { style: "padding:12px;border:1px solid var(--warning);border-radius:12px;margin:8px 0;background:rgba(255,193,7,.1);" } })
          .appendChild(el("span", { text: `${t.name} — ${t.quantity}/${t.min_quantity} (${t.location || "Sem local"})` })) && list.lastChild as any
      );
    });
  }
  sec.append(list);
  c.append(sec);

  showModal("Relatório Detalhado", c);

  function stat(label: string, value: number | string) {
    const k = el("div", { classes: ["stats-card"], attrs: { style: "text-align:center;" } });
    k.append(
      el("h4", { text: label, attrs: { style: "margin:0 0 8px 0;font-size:1rem;color:var(--sec2);" } }),
      el("p", { text: String(value), attrs: { style: "font-size:2em;color:var(--sec2);font-weight:bold;margin:0;" } })
    );
    return k;
  }
};

function setupLogout() {
  document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    showToast("Logout realizado com sucesso!", "info");
  });
}

async function main() {
  await fetchTools();
  subscribeRealtime();
  setupLogout();
}
main();
