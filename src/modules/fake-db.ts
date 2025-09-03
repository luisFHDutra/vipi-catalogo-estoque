import type { Service } from "./types.js";

const KEY = "vipi_services_v1";

function read(): Service[] {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    try { return JSON.parse(raw) as Service[]; } catch { return []; }
}
function write(items: Service[]) {
    localStorage.setItem(KEY, JSON.stringify(items));
}
function genId(): string {
    return (crypto as any).randomUUID?.() ?? (Math.random().toString(36).slice(2) + Date.now().toString(36));
}

export async function uploadServiceImages(files: File[] | FileList): Promise<string[]> {
    const arr = Array.from(files);
    const toDataURL = (f: File) => new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(f);
    });
    const urls: string[] = [];
    for (const f of arr) urls.push(await toDataURL(f));
    return urls;
}

export async function listAllServices(): Promise<Service[]> {
    return read().sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
}

export async function listPublicServices(): Promise<Service[]> {
    return (await listAllServices()).filter(s => s.is_public);
}

export async function createService(payload: Omit<Service, "id" | "created_at">): Promise<Service> {
    const now = new Date().toISOString();
    const images = payload.images ?? (payload.image_url ? [payload.image_url] : []);
    const image_url = images[0];
    const item: Service = { id: genId(), created_at: now, ...payload, images, image_url };
    const items = read();
    items.unshift(item);
    write(items);
    return item;
}

export async function updateService(id: string, patch: Partial<Service>): Promise<Service> {
    const items = read();
    const ix = items.findIndex(i => i.id === id);
    if (ix < 0) throw new Error("Serviço não encontrado");
    const prev = items[ix];

    const images = patch.images ?? prev.images ?? (prev.image_url ? [prev.image_url] : []);
    const image_url = images[0];

    items[ix] = { ...prev, ...patch, images, image_url };
    write(items);
    return items[ix];
}

export async function deleteService(id: string): Promise<void> {
    write(read().filter(i => i.id !== id));
}

export async function toggleVisibility(id: string, makePublic: boolean): Promise<void> {
    await updateService(id, { is_public: makePublic });
}
