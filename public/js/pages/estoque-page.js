import { el, clear } from "../modules/ui.js";
import { supabase } from "../supabase/supabaseClient.js";
let tools = [];
let searchTerm = "";
let filterStatus = "all";
let sortBy = "name";
function showToast(message, type = "success") {
	const container = document.getElementById("toast-container");
	const toast = el("div", { classes: ["toast", type] });
	toast.append(el("span", { text: message }));
	container.append(toast);
	setTimeout(() => {
		toast.classList.add("slide-out");
		setTimeout(() => toast.remove(), 300);
	}, 3000);
}
function showModal(title, content, onClose) {
	const container = document.getElementById("modal-container");
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
	window.closeModal = function () {
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
	tools = (data ?? []).map((t) => ({
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
function getFilteredAndSortedTools() {
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
	const content = document.getElementById("content");
	clear(content);
	renderQuickStats();
	renderSearchAndFilters();
	renderToolsList();
}
function renderQuickStats() {
	const content = document.getElementById("content");
	const statsCard = el("div", { classes: ["card", "modern-card"] });
	const title = el("h3", {
		text: "Resumo do Estoque",
		attrs: { style: "margin-bottom:20px;" },
	});
	const totalTools = tools.length;
	const lowStockTools = tools.filter(
		(t) => t.quantity <= t.min_quantity
	).length;
	const totalQuantity = tools.reduce((s, t) => s + t.quantity, 0);
	const avgQuantity =
		totalTools > 0 ? Math.round(totalQuantity / totalTools) : 0;
	const grid = el("div", {
		classes: ["grid"],
		attrs: {
			style:
				"grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;",
		},
	});
	grid.append(
		stat("Ferramentas", String(totalTools)),
		stat("Estoque Baixo", String(lowStockTools)),
		stat("Total de Itens", String(totalQuantity)),
		stat("Média por Item", String(avgQuantity))
	);
	statsCard.append(title, grid);
	content.append(statsCard);
	function stat(label, value) {
		const c = el("div", { classes: ["stats-card"] });
		c.append(
			el("p", {
				text: label,
				attrs: { style: "margin:0;color:var(--muted);font-size:.9rem;" },
			}),
			el("h4", {
				text: value,
				attrs: { style: "margin:8px 0;font-size:2.2rem;color:var(--sec2);" },
			})
		);
		return c;
	}
}
function renderSearchAndFilters() {
	const content = document.getElementById("content");
	const card = el("div", { classes: ["card", "modern-card"] });
	const title = el("h3", {
		text: "Buscar e Filtrar",
		attrs: { style: "margin-bottom:20px;" },
	});
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
		el("option", {
			text: "Ordenar por quantidade",
			attrs: { value: "quantity" },
		}),
		el("option", {
			text: "Ordenar por localização",
			attrs: { value: "location" },
		})
	);
	const actions = el("div", {
		attrs: { style: "display:flex;gap:12px;flex-wrap:wrap;margin-top:16px;" },
	});
	const addBtn = el("button", {
		classes: ["btn"],
		attrs: { onclick: "showAddToolModal()" },
	});
	addBtn.innerHTML = '<i class="fas fa-plus"></i> Nova Ferramenta';
	const reportBtn = el("button", {
		classes: ["btn", "btn-secondary"],
		attrs: { onclick: "showDetailedReport()" },
	});
	reportBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Relatório';
	const exportBtn = el("button", {
		classes: ["btn", "btn-success"],
		attrs: { onclick: "exportStockData()" },
	});
	exportBtn.innerHTML = '<i class="fas fa-download"></i> Exportar';
	actions.append(addBtn, reportBtn, exportBtn);
	row.append(searchInput, filterSelect, sortSelect);
	card.append(title, row, actions);
	content.append(card);
	window.handleSearch = (v) => {
		searchTerm = v;
		renderToolsList();
	};
	window.handleFilter = (v) => {
		filterStatus = v;
		renderToolsList();
	};
	window.handleSort = (v) => {
		sortBy = v;
		renderToolsList();
	};
}
function renderToolsList() {
	const content = document.getElementById("content");
	document.getElementById("tools-list")?.remove();
	const card = el("div", {
		classes: ["card", "modern-card"],
		attrs: { id: "tools-list" },
	});
	const title = el("h3", {
		text: "Ferramentas em Estoque",
		attrs: { style: "margin-bottom:20px;" },
	});
	const filtered = getFilteredAndSortedTools();
	const count = el("p", {
		text: `${filtered.length} de ${tools.length} ferramentas`,
		attrs: { style: "color:var(--muted);margin-bottom:20px;" },
	});
	card.append(title, count);
	if (!filtered.length) {
		const empty = el("div", {
			attrs: {
				style: "text-align:center;padding:60px 20px;color:var(--muted);",
			},
		});
		empty.append(
			el("h4", {
				text: "Nenhuma ferramenta encontrada",
				attrs: { style: "margin:0 0 10px 0;" },
			}),
			el("p", {
				text: "Ajuste os filtros de busca ou adicione uma nova ferramenta.",
				attrs: { style: "margin:0;" },
			})
		);
		card.append(empty);
	} else {
		const grid = el("div", {
			classes: ["grid"],
			attrs: {
				style:
					"grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px;",
			},
		});
		filtered.forEach((tool) => grid.append(createToolCard(tool)));
		card.append(grid);
	}
	content.append(card);
}
function createToolCard(tool) {
	const c = el("div", { classes: ["card"] });
	const low = tool.quantity <= tool.min_quantity;
	const status = el("div", {
		classes: ["status-badge", low ? "warning" : "success"],
	});
	status.textContent = low ? "Estoque Baixo" : "Em Estoque";
	const header = el("div", {
		attrs: {
			style:
				"display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;",
		},
	});
	header.append(
		el("h4", {
			text: tool.name,
			attrs: { style: "margin:0;font-size:1.2rem;font-weight:700;" },
		}),
		status
	);
	const desc = el("p", {
		text: tool.description || "Sem descrição",
		attrs: { style: "color:var(--muted);margin:0 0 16px 0;font-size:.95rem;" },
	});
	const info = el("div", {
		attrs: {
			style:
				"background:#fafbff;border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:12px;",
		},
	});
	info.append(
		kv(
			"Quantidade:",
			String(tool.quantity),
			low ? "var(--warning)" : "var(--success)"
		),
		kv("Mínimo:", String(tool.min_quantity)),
		kv("Local:", tool.location || "Não informado")
	);
	const actions = el("div", { attrs: { style: "display:flex;gap:8px;" } });
	const edit = el("button", {
		classes: ["btn", "btn-secondary", "btn-sm"],
		attrs: { onclick: `editTool('${tool.id}')` },
	});
	edit.innerHTML = '<i class="fas fa-edit"></i> Editar';
	const del = el("button", {
		classes: ["btn", "btn-danger", "btn-sm"],
		attrs: { onclick: `deleteTool('${tool.id}')` },
	});
	del.innerHTML = '<i class="fas fa-trash"></i> Excluir';
	actions.append(edit, del);
	c.append(header, desc, info, actions);
	return c;
	function kv(k, v, color) {
		const row = el("div", {
			attrs: {
				style:
					"display:flex;justify-content:space-between;align-items:center;margin:6px 0;",
			},
		});
		row.append(
			el("span", { text: k, attrs: { style: "color:var(--muted);" } }),
			el("span", {
				text: v,
				attrs: { style: color ? `color:${color};font-weight:700;` : "" },
			})
		);
		return row;
	}
}
window.showAddToolModal = function () {
	const form = el("form", {
		classes: ["form"],
		attrs: { onsubmit: "handleAddTool(event)" },
	});
	form.append(
		el("input", {
			attrs: {
				type: "text",
				name: "name",
				placeholder: "Nome da ferramenta",
				required: "true",
			},
		}),
		el("textarea", {
			attrs: {
				name: "description",
				placeholder: "Descrição (opcional)",
				rows: "3",
			},
		}),
		el("input", {
			attrs: {
				type: "number",
				name: "quantity",
				placeholder: "Quantidade atual",
				min: "0",
				required: "true",
			},
		}),
		el("input", {
			attrs: {
				type: "number",
				name: "min_quantity",
				placeholder: "Quantidade mínima",
				min: "0",
				required: "true",
			},
		}),
		el("input", {
			attrs: {
				type: "text",
				name: "location",
				placeholder: "Localização (opcional)",
			},
		}),
		btnRow()
	);
	showModal("Nova Ferramenta", form);
	function btnRow() {
		const r = el("div", {
			attrs: { style: "display:flex;gap:12px;margin-top:20px;" },
		});
		const save = el("button", { classes: ["btn"], attrs: { type: "submit" } });
		save.innerHTML = '<i class="fas fa-save"></i> Salvar';
		const cancel = el("button", {
			classes: ["btn", "btn-secondary"],
			attrs: { type: "button", onclick: "closeModal()" },
		});
		cancel.innerHTML = '<i class="fas fa-times"></i> Cancelar';
		r.append(save, cancel);
		return r;
	}
};
window.handleAddTool = async function (event) {
	event.preventDefault();
	const f = event.target;
	const d = new FormData(f);
	const payload = {
		name: String(d.get("name") || "").trim(),
		description: d.get("description") || null,
		quantity: parseFloat(String(d.get("quantity") || "0")),
		min_quantity: parseFloat(String(d.get("min_quantity") || "0")),
		location: d.get("location") || null,
	};
	const { error } = await supabase.from("tool").insert([payload]);
	if (error) return showToast("Erro ao adicionar ferramenta!", "error");
	window.closeModal();
	await fetchTools();
	showToast("Ferramenta adicionada com sucesso!", "success");
};
window.editTool = function (id) {
	const t = tools.find((x) => x.id === id);
	if (!t) return;
	const form = el("form", {
		classes: ["form"],
		attrs: { onsubmit: "handleEditTool(event)" },
	});
	const hid = el("input", {
		attrs: { type: "hidden", name: "id", value: t.id },
	});
	const name = el("input", {
		attrs: { type: "text", name: "name", value: t.name, required: "true" },
	});
	const desc = el("textarea", { attrs: { name: "description", rows: "3" } });
	desc.value = t.description || "";
	const qty = el("input", {
		attrs: {
			type: "number",
			name: "quantity",
			value: String(t.quantity),
			min: "0",
			required: "true",
		},
	});
	const min = el("input", {
		attrs: {
			type: "number",
			name: "min_quantity",
			value: String(t.min_quantity),
			min: "0",
			required: "true",
		},
	});
	const loc = el("input", {
		attrs: { type: "text", name: "location", value: t.location || "" },
	});
	const btns = el("div", {
		attrs: { style: "display:flex;gap:12px;margin-top:20px;" },
	});
	const save = el("button", { classes: ["btn"], attrs: { type: "submit" } });
	save.innerHTML = '<i class="fas fa-save"></i> Salvar';
	const cancel = el("button", {
		classes: ["btn", "btn-secondary"],
		attrs: { type: "button", onclick: "closeModal()" },
	});
	cancel.innerHTML = '<i class="fas fa-times"></i> Cancelar';
	btns.append(save, cancel);
	form.append(hid, name, desc, qty, min, loc, btns);
	showModal("Editar Ferramenta", form);
	window.handleEditTool = async function (event) {
		event.preventDefault();
		const f = event.target;
		const d = new FormData(f);
		const payload = {
			name: String(d.get("name") || "").trim(),
			description: d.get("description") || null,
			quantity: parseFloat(String(d.get("quantity") || "0")),
			min_quantity: parseFloat(String(d.get("min_quantity") || "0")),
			location: d.get("location") || null,
		};
		const { error } = await supabase
			.from("tool")
			.update(payload)
			.eq("id", Number(String(d.get("id") || "")));
		if (error) return showToast("Erro ao atualizar ferramenta!", "error");
		window.closeModal();
		await fetchTools();
		showToast("Ferramenta atualizada com sucesso!", "success");
	};
};
window.deleteTool = function (id) {
	const t = tools.find((x) => x.id === id);
	if (!t) return;
	const box = el("div", { attrs: { style: "text-align:center;" } });
	box.append(
		el("p", {
			text: `Tem certeza que deseja excluir a ferramenta "${t.name}"?`,
			attrs: { style: "font-size:1.05rem;margin-bottom:18px;" },
		}),
		el("p", {
			text: "Esta ação não pode ser desfeita.",
			attrs: { style: "color:var(--muted);margin-bottom:26px;" },
		})
	);
	const row = el("div", {
		attrs: { style: "display:flex;gap:12px;justify-content:center;" },
	});
	const ok = el("button", {
		classes: ["btn", "btn-danger"],
		attrs: { onclick: `confirmDelete('${id}')` },
	});
	ok.innerHTML = '<i class="fas fa-trash"></i> Excluir';
	const cancel = el("button", {
		classes: ["btn", "btn-secondary"],
		attrs: { onclick: "closeModal()" },
	});
	cancel.innerHTML = '<i class="fas fa-times"></i> Cancelar';
	row.append(ok, cancel);
	box.append(row);
	showModal("Confirmar Exclusão", box);
	window.confirmDelete = async function (toolId) {
		const { error } = await supabase
			.from("tool")
			.delete()
			.eq("id", Number(toolId));
		if (error) return showToast("Erro ao excluir ferramenta!", "error");
		window.closeModal();
		await fetchTools();
		showToast("Ferramenta excluída com sucesso!", "success");
	};
};
// Generate a richer, dashboard-style Excel relatorio (XLSX) using SheetJS, and download it.
window.showDetailedReport = async function () {
	// Load ExcelJS from CDN if needed
	if (!window.ExcelJS) {
		await new Promise((resolve, reject) => {
			const s = document.createElement("script");
			s.src = "https://cdn.jsdelivr.net/npm/exceljs/dist/exceljs.min.js";
			s.onload = resolve;
			s.onerror = () => reject(new Error("Failed to load ExcelJS"));
			document.head.appendChild(s);
		}).catch((e) => {
			console.error(e);
			showToast(
				"Não foi possível carregar a biblioteca de relatório (ExcelJS).",
				"error"
			);
			return;
		});
	}

	const now = new Date();
	const dateLabel = now.toLocaleDateString("pt-BR");
	const timeLabel = now.toLocaleTimeString("pt-BR");

	// Prepare metrics
	const totalTools = tools.length;
	const lowCount = tools.filter((t) => t.quantity <= t.min_quantity).length;
	const totalQty = tools.reduce((s, t) => s + t.quantity, 0);
	const avgQty = totalTools ? Math.round(totalQty / totalTools) : 0;
	const locations = Array.from(
		new Set(tools.map((t) => t.location).filter(Boolean))
	).length;

	// Create workbook & sheets using ExcelJS
	const workbook = new ExcelJS.Workbook();
	workbook.creator = "VIPI Catalog";
	workbook.created = now;

	const ws = workbook.addWorksheet("Dash_Geral", {
		views: [{ state: "frozen", ySplit: 6 }],
	});
	const detalhes = workbook.addWorksheet("Detalhes", {
		views: [{ state: "frozen", ySplit: 1 }],
	});

	// Columns layout
	const colsCount = 11;
	// make the bar column a bit narrower to reduce visual bar size
	ws.columns = Array.from({ length: colsCount }).map((_, i) => ({
		width: i === 1 ? 12 : i === 0 ? 28 : 14,
	}));

	// Header band
	ws.mergeCells(1, 1, 1, colsCount);
	const titleCell = ws.getCell(1, 1);
	titleCell.value = `VIPI Catalog — Relatório de Estoque   Gerado em: ${dateLabel} ${timeLabel}`;
	titleCell.font = {
		name: "Calibri",
		size: 16,
		bold: true,
		color: { argb: "FFFFFFFF" },
	};
	titleCell.alignment = { vertical: "middle", horizontal: "left" };
	// blue site theme for entire sheet
	titleCell.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FF0B3D91" },
	};
	ws.getRow(1).height = 36;

	// KPI labels and values (rows 3 and 4)
	const kpiLabels = [
		"Produtos Cadastrados",
		"Quantidade em Estoque",
		"Acima do Estoque Mínimo",
		"Abaixo do Estoque Mínimo",
		"Locais",
	];
	const kpiValues = [
		totalTools,
		totalQty,
		totalTools - lowCount,
		lowCount,
		locations,
	];
	// blue variations for KPI tiles (site theme)
	const kpiColors = [
		"FF0B3D91",
		"FF1565C0",
		"FF1976D2",
		"FF42A5F5",
		"FF90CAF9",
	];

	// write label and value cells and merge each tile across 2 columns
	for (let i = 0; i < kpiLabels.length; i++) {
		const startCol = i * 2 + 1; // 1-based
		ws.mergeCells(3, startCol, 3, startCol + 1);
		ws.mergeCells(4, startCol, 4, startCol + 1);
		const labelCell = ws.getCell(3, startCol);
		const valueCell = ws.getCell(4, startCol);
		labelCell.value = kpiLabels[i];
		valueCell.value = kpiValues[i];
		labelCell.alignment = { horizontal: "center", vertical: "middle" };
		valueCell.alignment = { horizontal: "center", vertical: "middle" };
		labelCell.font = {
			name: "Calibri",
			size: 10,
			bold: true,
			color: { argb: "FFFFFFFF" },
		};
		valueCell.font = {
			name: "Calibri",
			size: 20,
			bold: true,
			color: { argb: "FFFFFFFF" },
		};
		labelCell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: kpiColors[i] },
		};
		valueCell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: kpiColors[i] },
		};
		// border
		const border = { style: "thin", color: { argb: "FFDDDDDD" } };
		labelCell.border = {
			top: border,
			left: border,
			bottom: border,
			right: border,
		};
		valueCell.border = {
			top: border,
			left: border,
			bottom: border,
			right: border,
		};
	}
	ws.getRow(3).height = 20;
	ws.getRow(4).height = 48;

	// Observations row
	const obsRow = 6;
	ws.mergeCells(obsRow, 1, obsRow, colsCount);
	ws.getCell(obsRow, 1).value = "Observações: Gerado pelo VIPI Catalog";

	// Detalhes sheet
	detalhes.columns = [
		{ header: "Nome", key: "name", width: 30 },
		{ header: "Descrição", key: "description", width: 40 },
		{ header: "Quantidade", key: "quantity", width: 12 },
		{ header: "Mínimo", key: "min_quantity", width: 10 },
		{ header: "Localização", key: "location", width: 20 },
		{ header: "Status", key: "status", width: 14 },
	];
	const rows = getFilteredAndSortedTools().map((t) => ({
		name: t.name,
		description: t.description || "",
		quantity: t.quantity,
		min_quantity: t.min_quantity,
		location: t.location || "",
		status: t.quantity <= t.min_quantity ? "Estoque Baixo" : "Em Estoque",
	}));
	detalhes.addRows(rows);
	// style header
	detalhes.getRow(1).eachCell((cell) => {
		// header uses site blue theme
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FF1976D2" },
		};
		cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
		cell.alignment = { horizontal: "center" };
		cell.border = { bottom: { style: "thin", color: { argb: "FFCCCCCC" } } };
	});
	// zebra
	for (let r = 2; r <= detalhes.rowCount; r++) {
		if (r % 2 === 0) continue;
		detalhes.getRow(r).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				// use a light blue instead of light green for zebra rows
				fgColor: { argb: "FFE3F2FD" },
			};
		});
	}

	// highlight status cells: use softer colors for both red and green, and use dark text for contrast
	for (let r = 2; r <= detalhes.rowCount; r++) {
		const statusCell = detalhes.getRow(r).getCell(6); // Status is column 6
		const statusValue = String(statusCell.value || "").trim();
		if (statusValue === "Estoque Baixo") {
			// slightly stronger red for low stock
			statusCell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "FFE57373" },
			};
			// use white text for contrast on stronger color
			statusCell.font = { color: { argb: "FFFFFFFF" }, bold: true };
			statusCell.alignment = { horizontal: "center" };
		} else if (statusValue === "Em Estoque") {
			// slightly stronger green for OK status
			statusCell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "FF66BB6A" },
			};
			statusCell.font = { color: { argb: "FFFFFFFF" }, bold: true };
			statusCell.alignment = { horizontal: "center" };
		}
	}

	// write workbook to buffer and download
	try {
		const buffer = await workbook.xlsx.writeBuffer();
		const blob = new Blob([buffer], {
			type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `relatorio-estoque-${now.toISOString().slice(0, 10)}.xlsx`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
		showToast("Relatório XLSX gerado com ExcelJS com sucesso.");
	} catch (err) {
		console.error(err);
		showToast("Erro ao gerar o arquivo XLSX (ExcelJS).", "error");
	}
};

// Export the current (filtered) tools list as CSV
window.exportStockData = function () {
	try {
		const rows = getFilteredAndSortedTools();
		const headers = [
			"Nome",
			"Descrição",
			"Quantidade",
			"Mínimo",
			"Localização",
			"Status",
		];
		const escape = (v) => {
			if (v === null || v === undefined) return "";
			const s = String(v);
			if (s.includes('"') || s.includes(",") || s.includes("\n")) {
				return '"' + s.replace(/"/g, '""') + '"';
			}
			return s;
		};
		const lines = [headers.map(escape).join(",")];
		rows.forEach((t) => {
			const status =
				t.quantity <= t.min_quantity ? "Estoque Baixo" : "Em Estoque";
			lines.push(
				[
					escape(t.name),
					escape(t.description || ""),
					escape(t.quantity),
					escape(t.min_quantity),
					escape(t.location || ""),
					escape(status),
				].join(",")
			);
		});
		const csv = lines.join("\n");
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		const d = new Date();
		a.download = `estoque-${d.toISOString().slice(0, 10)}.csv`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
		showToast("CSV gerado com sucesso.");
	} catch (e) {
		console.error(e);
		showToast("Erro ao gerar CSV.", "error");
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
