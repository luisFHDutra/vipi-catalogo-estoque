import { supabase } from "../supabase/supabaseClient.js";
const TABLE = "service";
/** Lista todos os serviços (qualquer visibilidade). */
export async function listAllServices() {
    const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .order("created_at", { ascending: false });
    if (error)
        throw error;
    return (data ?? []);
}
/** Lista apenas os serviços públicos (visibility = 'public'). */
export async function listPublicServices() {
    const { data, error } = await supabase
        .from(TABLE)
        .select("id, name, description, total_time, price, visibility, notes, created_at")
        .eq("visibility", "public")
        .order("created_at", { ascending: false });
    if (error)
        throw error;
    return (data ?? []);
}
/** Cria um novo serviço. */
export async function createService(payload) {
    const { data, error } = await supabase
        .from(TABLE)
        .insert(payload)
        .select("*")
        .single();
    if (error)
        throw error;
    return data;
}
/** Atualiza um serviço existente pelo ID. */
export async function updateService(id, payload) {
    const { data, error } = await supabase
        .from(TABLE)
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();
    if (error)
        throw error;
    return data;
}
/** Remove um serviço pelo ID. */
export async function deleteService(id) {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error)
        throw error;
}
/** Alterna a visibilidade entre 'public' e 'private'. */
export async function toggleVisibility(id, makePublic) {
    await updateService(id, { visibility: makePublic ? "public" : "private" });
}
