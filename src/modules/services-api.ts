// services-api.ts
import type { Service } from "./types.js";
import { supabase } from "../supabase/supabaseClient.js";

const TABLE = "service";

/** Lista todos os serviços (qualquer visibilidade). */
export async function listAllServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Service[];
}

/** Lista apenas os serviços públicos (visibility = 'public'). */
export async function listPublicServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, name, description, total_time, price, visibility, notes, created_at")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Service[];
}

/** Cria um novo serviço. */
export async function createService(
  payload: Omit<Service, "id" | "created_at">
): Promise<Service> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data as Service;
}

/** Atualiza um serviço existente pelo ID. */
export async function updateService(
  id: number,
  payload: Partial<Service>
): Promise<Service> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as Service;
}

/** Remove um serviço pelo ID. */
export async function deleteService(id: number): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

/** Alterna a visibilidade entre 'public' e 'private'. */
export async function toggleVisibility(id: number, makePublic: boolean): Promise<void> {
  await updateService(id, { visibility: makePublic ? "public" : "private" } as Partial<Service>);
}
