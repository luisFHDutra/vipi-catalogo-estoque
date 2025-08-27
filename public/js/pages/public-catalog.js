import { el, clear } from "../modules/ui.js";
async function fetchPublicServices() {
    // Implementaremos com Supabase no Bloco 4.
    // Por ora, dados mock para visualizar o layout.
    return [
        { id: "1", name: "Torneamento CNC", description: "Alta precisão.", is_public: true, image_url: "", execution_time_minutes: 120, cost: 500 },
        { id: "2", name: "Fresamento 3 eixos", description: "Versátil.", is_public: true, image_url: "" }
    ];
}
function renderServiceCard(svc) {
    const card = el("a", { classes: ["card"], attrs: { href: "#svc-" + svc.id } });
    const title = el("h3", { text: svc.name });
    const desc = el("p", { text: svc.description ?? "" });
    const badge = el("span", { classes: ["badge"], text: "Público" });
    // **Não** exibir custo/tempo aqui (dados sensíveis).
    card.append(title, desc, badge);
    return card;
}
async function main() {
    const grid = document.getElementById("services-grid");
    clear(grid);
    const services = await fetchPublicServices();
    services.filter(s => s.is_public).forEach(s => grid.appendChild(renderServiceCard(s)));
}
main().catch(console.error);
