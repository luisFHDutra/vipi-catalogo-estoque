import { el, clear } from "../modules/ui.js";
import { Tool } from "../modules/types.js";

// Dados mock para demonstração
let tools: Tool[] = [
    {
        id: "1",
        name: "Chave de Fenda Phillips",
        description: "Chave de fenda para parafusos Phillips",
        quantity: 15,
        min_quantity: 5,
        location: "Gaveta A1",
        updated_at: new Date().toISOString()
    },
    {
        id: "2", 
        name: "Martelo",
        description: "Martelo de 500g",
        quantity: 3,
        min_quantity: 5,
        location: "Prateleira B2",
        updated_at: new Date().toISOString()
    },
    {
        id: "3",
        name: "Furadeira",
        description: "Furadeira elétrica 500W",
        quantity: 2,
        min_quantity: 2,
        location: "Armário C1",
        updated_at: new Date().toISOString()
    }
];

// Estado global
let searchTerm = "";
let filterStatus = "all";
let sortBy = "name";

// Funções de utilidade
function showToast(message: string, type: "success" | "error" | "warning" | "info" = "success") {
    const container = document.getElementById("toast-container")!;
    const toast = el("div", { classes: ["toast", type] });
    
    const icon = type === "success" ? "fas fa-check-circle" :
                 type === "error" ? "fas fa-exclamation-circle" :
                 type === "warning" ? "fas fa-exclamation-triangle" :
                 "fas fa-info-circle";
    
    const iconEl = el("i", { classes: icon.split(' ') });
    const messageEl = el("span", { text: message });
    
    toast.appendChild(iconEl);
    toast.appendChild(messageEl);
    container.appendChild(toast);
    
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
        attrs: { onclick: "closeModal()" }
    });
    closeBtn.innerHTML = "&times;";
    
    header.appendChild(titleEl);
    header.appendChild(closeBtn);
    
    modal.appendChild(header);
    modal.appendChild(content);
    
    container.appendChild(modal);
    container.classList.add("active");
    
    // Função global para fechar modal
    (window as any).closeModal = function() {
        container.classList.remove("active");
        setTimeout(() => {
            container.innerHTML = "";
            if (onClose) onClose();
        }, 300);
    };
}

function getFilteredAndSortedTools(): Tool[] {
    let filtered = tools.filter(tool => {
        const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             tool.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             tool.location?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = filterStatus === "all" ||
                             (filterStatus === "low" && tool.quantity <= tool.min_quantity) ||
                             (filterStatus === "ok" && tool.quantity > tool.min_quantity);
        
        return matchesSearch && matchesFilter;
    });
    
    return filtered.sort((a, b) => {
        switch (sortBy) {
            case "name":
                return a.name.localeCompare(b.name);
            case "quantity":
                return b.quantity - a.quantity;
            case "location":
                return (a.location || "").localeCompare(b.location || "");
            default:
                return 0;
        }
    });
}

function renderEstoquePage() {
    const content = document.getElementById("content")!;
    clear(content);

    // Estatísticas rápidas
    renderQuickStats();

    // Barra de busca e filtros
    renderSearchAndFilters();

    // Lista de ferramentas
    renderToolsList();
}

function renderQuickStats() {
    const content = document.getElementById("content")!;
    
    const statsCard = el("div", { classes: ["card", "modern-card"] });
    const statsTitle = el("h3", { 
        text: "📊 Resumo do Estoque",
        attrs: { style: "margin-bottom: 20px; display: flex; align-items: center; gap: 12px;" }
    });
    
    const totalTools = tools.length;
    const lowStockTools = tools.filter(t => t.quantity <= t.min_quantity).length;
    const totalQuantity = tools.reduce((sum, t) => sum + t.quantity, 0);
    const avgQuantity = totalTools > 0 ? Math.round(totalQuantity / totalTools) : 0;
    
    const statsGrid = el("div", { 
        classes: ["grid"],
        attrs: { style: "grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;" }
    });
    
    // Estatística 1: Total de Ferramentas
    const totalCard = el("div", { classes: ["stats-card"] });
    const totalIcon = el("i", { classes: ["fas", "fa-tools"], attrs: { style: "font-size: 2rem; color: var(--primary); margin-bottom: 10px;" } });
    const totalLabel = el("p", { text: "Ferramentas", attrs: { style: "margin: 0; color: var(--muted); font-size: 0.9rem;" } });
    const totalValue = el("h4", { 
        text: totalTools.toString(),
        attrs: { style: "color: var(--primary); margin: 8px 0; font-size: 2.5rem; font-weight: 700;" }
    });
    totalCard.appendChild(totalIcon);
    totalCard.appendChild(totalLabel);
    totalCard.appendChild(totalValue);
    
    // Estatística 2: Estoque Baixo
    const lowStockCard = el("div", { classes: ["stats-card"] });
    const lowStockIcon = el("i", { classes: ["fas", "fa-exclamation-triangle"], attrs: { style: "font-size: 2rem; color: var(--warning); margin-bottom: 10px;" } });
    const lowStockLabel = el("p", { text: "Estoque Baixo", attrs: { style: "margin: 0; color: var(--muted); font-size: 0.9rem;" } });
    const lowStockValue = el("h4", { 
        text: lowStockTools.toString(),
        attrs: { style: `color: ${lowStockTools > 0 ? 'var(--warning)' : 'var(--success)'}; margin: 8px 0; font-size: 2.5rem; font-weight: 700;` }
    });
    lowStockCard.appendChild(lowStockIcon);
    lowStockCard.appendChild(lowStockLabel);
    lowStockCard.appendChild(lowStockValue);
    
    // Estatística 3: Total de Itens
    const itemsCard = el("div", { classes: ["stats-card"] });
    const itemsIcon = el("i", { classes: ["fas", "fa-boxes"], attrs: { style: "font-size: 2rem; color: var(--info); margin-bottom: 10px;" } });
    const itemsLabel = el("p", { text: "Total de Itens", attrs: { style: "margin: 0; color: var(--muted); font-size: 0.9rem;" } });
    const itemsValue = el("h4", { 
        text: totalQuantity.toString(),
        attrs: { style: "color: var(--info); margin: 8px 0; font-size: 2.5rem; font-weight: 700;" }
    });
    itemsCard.appendChild(itemsIcon);
    itemsCard.appendChild(itemsLabel);
    itemsCard.appendChild(itemsValue);
    
    // Estatística 4: Média por Ferramenta
    const avgCard = el("div", { classes: ["stats-card"] });
    const avgIcon = el("i", { classes: ["fas", "fa-chart-line"], attrs: { style: "font-size: 2rem; color: var(--success); margin-bottom: 10px;" } });
    const avgLabel = el("p", { text: "Média por Item", attrs: { style: "margin: 0; color: var(--muted); font-size: 0.9rem;" } });
    const avgValue = el("h4", { 
        text: avgQuantity.toString(),
        attrs: { style: "color: var(--success); margin: 8px 0; font-size: 2.5rem; font-weight: 700;" }
    });
    avgCard.appendChild(avgIcon);
    avgCard.appendChild(avgLabel);
    avgCard.appendChild(avgValue);
    
    statsGrid.appendChild(totalCard);
    statsGrid.appendChild(lowStockCard);
    statsGrid.appendChild(itemsCard);
    statsGrid.appendChild(avgCard);
    
    statsCard.appendChild(statsTitle);
    statsCard.appendChild(statsGrid);
    content.appendChild(statsCard);
}

function renderSearchAndFilters() {
    const content = document.getElementById("content")!;
    
    const searchCard = el("div", { classes: ["card", "modern-card"] });
    const searchTitle = el("h3", { 
        text: "🔍 Buscar e Filtrar",
        attrs: { style: "margin-bottom: 20px; display: flex; align-items: center; gap: 12px;" }
    });
    
    const searchContainer = el("div", { classes: ["search-container"] });
    
    // Campo de busca
    const searchInput = el("input", {
        classes: ["search-input"],
        attrs: {
            type: "text",
            placeholder: "Buscar por nome, descrição ou localização...",
            value: searchTerm,
            oninput: "handleSearch(this.value)"
        }
    });
    
    // Filtro por status
    const filterSelect = el("select", {
        classes: ["filter-select"],
        attrs: {
            value: filterStatus,
            onchange: "handleFilter(this.value)"
        }
    });
    
    const allOption = el("option", { text: "Todos os itens", attrs: { value: "all" } });
    const lowOption = el("option", { text: "Estoque baixo", attrs: { value: "low" } });
    const okOption = el("option", { text: "Estoque OK", attrs: { value: "ok" } });
    
    filterSelect.appendChild(allOption);
    filterSelect.appendChild(lowOption);
    filterSelect.appendChild(okOption);
    
    // Ordenação
    const sortSelect = el("select", {
        classes: ["filter-select"],
        attrs: {
            value: sortBy,
            onchange: "handleSort(this.value)"
        }
    });
    
    const sortNameOption = el("option", { text: "Ordenar por nome", attrs: { value: "name" } });
    const sortQuantityOption = el("option", { text: "Ordenar por quantidade", attrs: { value: "quantity" } });
    const sortLocationOption = el("option", { text: "Ordenar por localização", attrs: { value: "location" } });
    
    sortSelect.appendChild(sortNameOption);
    sortSelect.appendChild(sortQuantityOption);
    sortSelect.appendChild(sortLocationOption);
    
    // Botões de ação
    const actionsContainer = el("div", { 
        attrs: { style: "display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;" }
    });
    
    const addButton = el("button", { 
        classes: ["btn", "btn-primary"],
        attrs: { onclick: "showAddToolModal()" }
    });
    addButton.innerHTML = '<i class="fas fa-plus"></i> Nova Ferramenta';
    
    const reportButton = el("button", { 
        classes: ["btn", "btn-secondary"],
        attrs: { onclick: "showDetailedReport()" }
    });
    reportButton.innerHTML = '<i class="fas fa-chart-bar"></i> Relatório';
    
    const exportButton = el("button", { 
        classes: ["btn", "btn-success"],
        attrs: { onclick: "exportStockData()" }
    });
    exportButton.innerHTML = '<i class="fas fa-download"></i> Exportar';
    
    actionsContainer.appendChild(addButton);
    actionsContainer.appendChild(reportButton);
    actionsContainer.appendChild(exportButton);
    
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(filterSelect);
    searchContainer.appendChild(sortSelect);
    
    searchCard.appendChild(searchTitle);
    searchCard.appendChild(searchContainer);
    searchCard.appendChild(actionsContainer);
    content.appendChild(searchCard);
    
    // Funções globais
    (window as any).handleSearch = function(value: string) {
        searchTerm = value;
        renderToolsList();
    };
    
    (window as any).handleFilter = function(value: string) {
        filterStatus = value;
        renderToolsList();
    };
    
    (window as any).handleSort = function(value: string) {
        sortBy = value;
        renderToolsList();
    };
}

function renderToolsList() {
    const content = document.getElementById("content")!;
    
    const existingList = document.getElementById("tools-list");
    if (existingList) {
        existingList.remove();
    }

    const toolsCard = el("div", { 
        classes: ["card", "modern-card"],
        attrs: { id: "tools-list" }
    });
    
    const filteredTools = getFilteredAndSortedTools();
    
    const toolsTitle = el("h3", { 
        text: "🔧 Ferramentas em Estoque",
        attrs: { style: "margin-bottom: 20px; display: flex; align-items: center; gap: 12px;" }
    });
    const toolsCount = el("p", { 
        text: `${filteredTools.length} de ${tools.length} ferramentas`,
        attrs: { style: "color: var(--muted); margin-bottom: 20px;" }
    });
    
    toolsCard.appendChild(toolsTitle);
    toolsCard.appendChild(toolsCount);

    if (filteredTools.length === 0) {
        const emptyMsg = el("div", { 
            attrs: { style: "text-align: center; padding: 60px 20px; color: var(--muted);" }
        });
        const emptyIcon = el("i", { classes: ["fas", "fa-search"], attrs: { style: "font-size: 4rem; margin-bottom: 20px; opacity: 0.5;" } });
        const emptyText = el("h4", { text: "Nenhuma ferramenta encontrada", attrs: { style: "margin: 0 0 10px 0;" } });
        const emptySubtext = el("p", { text: "Tente ajustar os filtros de busca ou adicione uma nova ferramenta.", attrs: { style: "margin: 0;" } });
        
        emptyMsg.appendChild(emptyIcon);
        emptyMsg.appendChild(emptyText);
        emptyMsg.appendChild(emptySubtext);
        toolsCard.appendChild(emptyMsg);
    } else {
        const toolsGrid = el("div", { 
            classes: ["grid"],
            attrs: { style: "grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;" }
        });
        
        filteredTools.forEach(tool => {
            const toolCard = createToolCard(tool);
            toolsGrid.appendChild(toolCard);
        });
        
        toolsCard.appendChild(toolsGrid);
    }

    content.appendChild(toolsCard);
}

function createToolCard(tool: Tool): HTMLElement {
    const card = el("div", { classes: ["tool-card"] });
    
    const isLowStock = tool.quantity <= tool.min_quantity;
    const statusClass = isLowStock ? "warning" : "success";
    const statusText = isLowStock ? "Estoque Baixo" : "Em Estoque";
    const statusIcon = isLowStock ? ["fas", "fa-exclamation-triangle"] : ["fas", "fa-check-circle"];
    
    // Header do card
    const cardHeader = el("div", { attrs: { style: "display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;" } });
    const title = el("h4", { 
        text: tool.name,
        attrs: { style: "margin: 0; font-size: 1.2rem; font-weight: 600;" }
    });
    const statusBadge = el("div", { classes: ["status-badge", statusClass] });
    statusBadge.innerHTML = `<i class="${statusIcon.join(' ')}"></i> ${statusText}`;
    
    cardHeader.appendChild(title);
    cardHeader.appendChild(statusBadge);
    
    // Descrição
    const description = el("p", { 
        text: tool.description || "Sem descrição",
        attrs: { style: "color: var(--muted); margin: 0 0 16px 0; font-size: 0.9rem;" }
    });
    
    // Informações do estoque
    const stockInfo = el("div", { attrs: { style: "background: rgba(255, 255, 255, 0.03); border-radius: 12px; padding: 16px; margin-bottom: 16px;" } });
    
    const quantityDiv = el("div", { attrs: { style: "display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;" } });
    const quantityLabel = el("span", { text: "Quantidade:", attrs: { style: "color: var(--muted);" } });
    const quantityValue = el("span", { 
        text: tool.quantity.toString(),
        attrs: { style: `color: ${isLowStock ? 'var(--warning)' : 'var(--success)'}; font-weight: 700; font-size: 1.1rem;` }
    });
    quantityDiv.appendChild(quantityLabel);
    quantityDiv.appendChild(quantityValue);
    
    const minDiv = el("div", { attrs: { style: "display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;" } });
    const minLabel = el("span", { text: "Mínimo:", attrs: { style: "color: var(--muted);" } });
    const minValue = el("span", { text: tool.min_quantity.toString(), attrs: { style: "color: var(--fg);" } });
    minDiv.appendChild(minLabel);
    minDiv.appendChild(minValue);
    
    const locationDiv = el("div", { attrs: { style: "display: flex; justify-content: space-between; align-items: center;" } });
    const locationLabel = el("span", { text: "Local:", attrs: { style: "color: var(--muted);" } });
    const locationValue = el("span", { 
        text: tool.location || "Não informado",
        attrs: { style: "color: var(--fg);" }
    });
    locationDiv.appendChild(locationLabel);
    locationDiv.appendChild(locationValue);
    
    stockInfo.appendChild(quantityDiv);
    stockInfo.appendChild(minDiv);
    stockInfo.appendChild(locationDiv);
    
    // Botões de ação
    const buttonsDiv = el("div", { attrs: { style: "display: flex; gap: 8px;" } });
    const editButton = el("button", { 
        classes: ["btn", "btn-secondary", "btn-sm"],
        attrs: { onclick: `editTool('${tool.id}')` }
    });
    editButton.innerHTML = '<i class="fas fa-edit"></i> Editar';
    
    const deleteButton = el("button", { 
        classes: ["btn", "btn-danger", "btn-sm"],
        attrs: { onclick: `deleteTool('${tool.id}')` }
    });
    deleteButton.innerHTML = '<i class="fas fa-trash"></i> Excluir';
    
    buttonsDiv.appendChild(editButton);
    buttonsDiv.appendChild(deleteButton);
    
    card.appendChild(cardHeader);
    card.appendChild(description);
    card.appendChild(stockInfo);
    card.appendChild(buttonsDiv);
    
    return card;
}

// Funções globais
(window as any).showAddToolModal = function() {
    const formContent = el("form", { 
        classes: ["form"],
        attrs: { onsubmit: "handleAddTool(event)" }
    });
    
    const nameInput = el("input", { 
        attrs: { 
            type: "text",
            name: "name",
            placeholder: "Nome da ferramenta",
            required: "true"
        }
    });
    
    const descTextarea = el("textarea", { 
        attrs: { 
            name: "description",
            placeholder: "Descrição (opcional)",
            rows: "3"
        }
    });
    
    const quantityInput = el("input", { 
        attrs: { 
            type: "number",
            name: "quantity",
            placeholder: "Quantidade atual",
            min: "0",
            required: "true"
        }
    });
    
    const minQuantityInput = el("input", { 
        attrs: { 
            type: "number",
            name: "min_quantity",
            placeholder: "Quantidade mínima",
            min: "0",
            required: "true"
        }
    });
    
    const locationInput = el("input", { 
        attrs: { 
            type: "text",
            name: "location",
            placeholder: "Localização (opcional)"
        }
    });
    
    const buttonsDiv = el("div", { attrs: { style: "display: flex; gap: 12px; margin-top: 20px;" } });
    const saveButton = el("button", { 
        classes: ["btn", "btn-primary"],
        attrs: { type: "submit" }
    });
    saveButton.innerHTML = '<i class="fas fa-save"></i> Salvar';
    
    const cancelButton = el("button", { 
        classes: ["btn", "btn-secondary"],
        attrs: { 
            type: "button",
            onclick: "closeModal()"
        }
    });
    cancelButton.innerHTML = '<i class="fas fa-times"></i> Cancelar';
    
    buttonsDiv.appendChild(saveButton);
    buttonsDiv.appendChild(cancelButton);
    
    formContent.appendChild(nameInput);
    formContent.appendChild(descTextarea);
    formContent.appendChild(quantityInput);
    formContent.appendChild(minQuantityInput);
    formContent.appendChild(locationInput);
    formContent.appendChild(buttonsDiv);
    
    showModal("➕ Nova Ferramenta", formContent);
};

(window as any).showDetailedReport = function() {
    const reportContent = el("div");
    
    const totalTools = tools.length;
    const lowStockTools = tools.filter(t => t.quantity <= t.min_quantity).length;
    const totalQuantity = tools.reduce((sum, t) => sum + t.quantity, 0);
    const avgQuantity = totalTools > 0 ? Math.round(totalQuantity / totalTools) : 0;
    
    const reportDate = el("p", { 
        text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
        attrs: { style: "color: var(--muted); font-size: 0.9rem; margin-bottom: 20px;" }
    });
    
    const statsGrid = el("div", { 
        classes: ["grid"],
        attrs: { style: "grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 30px;" }
    });
    
    const stats = [
        { label: "Total de Ferramentas", value: totalTools, icon: "fas fa-tools", color: "var(--primary)" },
        { label: "Estoque Baixo", value: lowStockTools, icon: "fas fa-exclamation-triangle", color: lowStockTools > 0 ? "var(--warning)" : "var(--success)" },
        { label: "Total de Itens", value: totalQuantity, icon: "fas fa-boxes", color: "var(--info)" },
        { label: "Média por Item", value: avgQuantity, icon: "fas fa-chart-line", color: "var(--success)" }
    ];
    
    stats.forEach(stat => {
        const statCard = el("div", { 
            classes: ["stats-card"],
            attrs: { style: "text-align: center;" }
        });
        const statIcon = el("i", { classes: stat.icon.split(' '), attrs: { style: `font-size: 2rem; color: ${stat.color}; margin-bottom: 10px;` } });
        const statLabel = el("h4", { text: stat.label, attrs: { style: "margin: 0 0 8px 0; font-size: 1rem;" } });
        const statValue = el("p", { 
            text: stat.value.toString(),
            attrs: { style: `font-size: 2em; color: ${stat.color}; font-weight: bold; margin: 0;` }
        });
        statCard.appendChild(statIcon);
        statCard.appendChild(statLabel);
        statCard.appendChild(statValue);
        statsGrid.appendChild(statCard);
    });
    
    const lowStockSection = el("div", { attrs: { style: "margin-top: 30px;" } });
    const lowStockTitle = el("h4", { text: "⚠️ Ferramentas com Estoque Baixo", attrs: { style: "margin-bottom: 16px;" } });
    const lowStockList = el("div", { attrs: { id: "low-stock-details" } });
    
    const lowStockToolsList = tools.filter(t => t.quantity <= t.min_quantity);
    
    if (lowStockToolsList.length === 0) {
        const noAlerts = el("p", { 
            text: "✅ Todas as ferramentas estão com estoque adequado!",
            attrs: { style: "color: var(--success); font-weight: bold; text-align: center; padding: 20px; background: rgba(40, 167, 69, 0.1); border-radius: 12px;" }
        });
        lowStockList.appendChild(noAlerts);
    } else {
        lowStockToolsList.forEach(tool => {
            const alertItem = el("div", { 
                attrs: { style: "padding: 16px; border: 1px solid var(--warning); border-radius: 12px; margin: 10px 0; background: rgba(255, 193, 7, 0.1);" }
            });
            const alertTitle = el("strong", { text: tool.name, attrs: { style: "color: var(--warning);" } });
            const alertDetails = el("span", { text: ` - ${tool.quantity}/${tool.min_quantity} unidades (${tool.location || 'Local não informado'})` });
            alertItem.appendChild(alertTitle);
            alertItem.appendChild(alertDetails);
            lowStockList.appendChild(alertItem);
        });
    }
    
    lowStockSection.appendChild(lowStockTitle);
    lowStockSection.appendChild(lowStockList);
    
    reportContent.appendChild(reportDate);
    reportContent.appendChild(statsGrid);
    reportContent.appendChild(lowStockSection);
    
    showModal("📊 Relatório Detalhado", reportContent);
};

(window as any).exportStockData = function() {
    const data = {
        exportDate: new Date().toISOString(),
        totalTools: tools.length,
        tools: tools.map(tool => ({
            nome: tool.name,
            descricao: tool.description,
            quantidade: tool.quantity,
            minimo: tool.min_quantity,
            localizacao: tool.location,
            status: tool.quantity <= tool.min_quantity ? "Estoque Baixo" : "OK"
        }))
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `estoque-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showToast("Dados exportados com sucesso!", "success");
};

(window as any).handleAddTool = function(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const newTool: Tool = {
        id: Date.now().toString(),
        name: formData.get("name") as string,
        description: formData.get("description") as string || undefined,
        quantity: parseInt(formData.get("quantity") as string),
        min_quantity: parseInt(formData.get("min_quantity") as string),
        location: formData.get("location") as string || undefined,
        updated_at: new Date().toISOString()
    };
    
    tools.push(newTool);
    (window as any).closeModal();
    renderToolsList();
    renderQuickStats();
    showToast("Ferramenta adicionada com sucesso!", "success");
};

(window as any).editTool = function(toolId: string) {
    const tool = tools.find(t => t.id === toolId);
    if (!tool) return;
    
    const formContent = el("form", { 
        classes: ["form"],
        attrs: { onsubmit: "handleEditTool(event)" }
    });
    
    const nameInput = el("input", { 
        attrs: { 
            type: "text",
            name: "name",
            value: tool.name,
            required: "true"
        }
    });
    
    const descTextarea = el("textarea", { 
        attrs: { 
            name: "description",
            rows: "3"
        }
    });
    descTextarea.value = tool.description || "";
    
    const quantityInput = el("input", { 
        attrs: { 
            type: "number",
            name: "quantity",
            value: tool.quantity.toString(),
            min: "0",
            required: "true"
        }
    });
    
    const minQuantityInput = el("input", { 
        attrs: { 
            type: "number",
            name: "min_quantity",
            value: tool.min_quantity.toString(),
            min: "0",
            required: "true"
        }
    });
    
    const locationInput = el("input", { 
        attrs: { 
            type: "text",
            name: "location",
            value: tool.location || ""
        }
    });
    
    const hiddenId = el("input", { 
        attrs: { 
            type: "hidden",
            name: "id",
            value: tool.id
        }
    });
    
    const buttonsDiv = el("div", { attrs: { style: "display: flex; gap: 12px; margin-top: 20px;" } });
    const saveButton = el("button", { 
        classes: ["btn", "btn-primary"],
        attrs: { type: "submit" }
    });
    saveButton.innerHTML = '<i class="fas fa-save"></i> Salvar';
    
    const cancelButton = el("button", { 
        classes: ["btn", "btn-secondary"],
        attrs: { 
            type: "button",
            onclick: "closeModal()"
        }
    });
    cancelButton.innerHTML = '<i class="fas fa-times"></i> Cancelar';
    
    buttonsDiv.appendChild(saveButton);
    buttonsDiv.appendChild(cancelButton);
    
    formContent.appendChild(hiddenId);
    formContent.appendChild(nameInput);
    formContent.appendChild(descTextarea);
    formContent.appendChild(quantityInput);
    formContent.appendChild(minQuantityInput);
    formContent.appendChild(locationInput);
    formContent.appendChild(buttonsDiv);
    
    showModal("✏️ Editar Ferramenta", formContent);
    
    (window as any).handleEditTool = function(event: Event) {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        
        const toolId = formData.get("id") as string;
        const toolIndex = tools.findIndex(t => t.id === toolId);
        
        if (toolIndex !== -1) {
            tools[toolIndex] = {
                ...tools[toolIndex],
                name: formData.get("name") as string,
                description: formData.get("description") as string || undefined,
                quantity: parseInt(formData.get("quantity") as string),
                min_quantity: parseInt(formData.get("min_quantity") as string),
                location: formData.get("location") as string || undefined,
                updated_at: new Date().toISOString()
            };
            
            (window as any).closeModal();
            renderToolsList();
            renderQuickStats();
            showToast("Ferramenta atualizada com sucesso!", "success");
        }
    };
};

(window as any).deleteTool = function(toolId: string) {
    const tool = tools.find(t => t.id === toolId);
    if (!tool) return;
    
    const confirmContent = el("div", { attrs: { style: "text-align: center;" } });
    const warningIcon = el("i", { classes: ["fas", "fa-exclamation-triangle"], attrs: { style: "font-size: 3rem; color: var(--warning); margin-bottom: 20px;" } });
    const confirmText = el("p", { 
        text: `Tem certeza que deseja excluir a ferramenta "${tool.name}"?`,
        attrs: { style: "font-size: 1.1rem; margin-bottom: 30px;" }
    });
    const warningText = el("p", { 
        text: "Esta ação não pode ser desfeita.",
        attrs: { style: "color: var(--muted); margin-bottom: 30px;" }
    });
    
    const buttonsDiv = el("div", { attrs: { style: "display: flex; gap: 12px; justify-content: center;" } });
    const confirmButton = el("button", { 
        classes: ["btn", "btn-danger"],
        attrs: { onclick: `confirmDelete('${toolId}')` }
    });
    confirmButton.innerHTML = '<i class="fas fa-trash"></i> Excluir';
    
    const cancelButton = el("button", { 
        classes: ["btn", "btn-secondary"],
        attrs: { onclick: "closeModal()" }
    });
    cancelButton.innerHTML = '<i class="fas fa-times"></i> Cancelar';
    
    buttonsDiv.appendChild(confirmButton);
    buttonsDiv.appendChild(cancelButton);
    
    confirmContent.appendChild(warningIcon);
    confirmContent.appendChild(confirmText);
    confirmContent.appendChild(warningText);
    confirmContent.appendChild(buttonsDiv);
    
    showModal("🗑️ Confirmar Exclusão", confirmContent);
    
    (window as any).confirmDelete = function(id: string) {
        tools = tools.filter(t => t.id !== id);
        (window as any).closeModal();
        renderToolsList();
        renderQuickStats();
        showToast("Ferramenta excluída com sucesso!", "success");
    };
};

function setupLogout() {
    const btn = document.getElementById("logoutBtn");
    if (!btn) return;
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        showToast("Logout realizado com sucesso!", "info");
    });
}

function main() {
    renderEstoquePage();
    setupLogout();
}

main();