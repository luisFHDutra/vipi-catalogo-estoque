import type { Service } from "./types.js";
import { getSupabase, isSupabaseConfigured } from "../supabase/client.js";
import * as local from "./fake-db.js";

const BUCKET = "servicos";

/* ===== SUPABASE ===== */
async function sb_uploadServiceImages(files: File[] | FileList): Promise<string[]> {
    const supabase = await getSupabase();
    if (!supabase) throw new Error("Supabase não configurado");

    const toPath = (name: string) => {
        const ext = name.includes(".") ? name.split(".").pop() : "jpg";
        return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    };

    const urls: string[] = [];
    for (const f of Array.from(files)) {
        const p = toPath(f.name);
        const { data, error } = await supabase.storage.from(BUCKET).upload(p, f, { cacheControl: "3600", upsert: false });
        if (error) throw error;
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
        urls.push(pub.publicUrl);
    }
    return urls;
}

async function sb_listAllServices(): Promise<Service[]> {
    const supabase = await getSupabase();
    if (!supabase) throw new Error("Supabase não configurado");
    const { data, error } = await supabase.from("services")
        .select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data as Service[];
}

async function sb_listPublicServices(): Promise<Service[]> {
    const supabase = await getSupabase();
    if (!supabase) throw new Error("Supabase não configurado");
    const { data, error } = await supabase.from("services")
        .select("id, name, description, images, image_url, is_public, created_at")
        .eq("is_public", true)
        .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Service[];
}

async function sb_createService(payload: Omit<Service, "id" | "created_at">): Promise<Service> {
    const supabase = await getSupabase();
    if (!supabase) throw new Error("Supabase não configurado");
    const images = payload.images ?? (payload.image_url ? [payload.image_url] : []);
    const image_url = images[0];
    const { data, error } = await supabase.from("services")
        .insert({ ...payload, images, image_url })
        .select("*").single();
    if (error) throw error;
    return data as Service;
}

async function sb_updateService(id: string, payload: Partial<Service>): Promise<Service> {
    const supabase = await getSupabase();
    if (!supabase) throw new Error("Supabase não configurado");
    const images = payload.images ?? (payload.image_url ? [payload.image_url] : undefined);
    const patch = images ? { ...payload, image_url: images[0], images } : payload;
    const { data, error } = await supabase.from("services")
        .update(patch).eq("id", id).select("*").single();
    if (error) throw error;
    return data as Service;
}

async function sb_deleteService(id: string): Promise<void> {
    const supabase = await getSupabase();
    if (!supabase) throw new Error("Supabase não configurado");
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) throw error;
}

async function sb_toggleVisibility(id: string, makePublic: boolean): Promise<void> {
    await sb_updateService(id, { is_public: makePublic });
}

/* ===== EXPORT: escolhe provider ===== */
export const uploadServiceImages = isSupabaseConfigured ? sb_uploadServiceImages : local.uploadServiceImages;
export const listAllServices = isSupabaseConfigured ? sb_listAllServices : local.listAllServices;
export const listPublicServices = isSupabaseConfigured ? sb_listPublicServices : local.listPublicServices;
export const createService = isSupabaseConfigured ? sb_createService : local.createService;
export const updateService = isSupabaseConfigured ? sb_updateService : local.updateService;
export const deleteService = isSupabaseConfigured ? sb_deleteService : local.deleteService;
export const toggleVisibility = isSupabaseConfigured ? sb_toggleVisibility : local.toggleVisibility;
