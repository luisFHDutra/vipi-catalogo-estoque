export type UUID = string;

export interface Service {
  id: number;
  created_at: string;       // Timestamp vindo do Supabase
  name: string;
  description?: string;
  total_time?: number;       // Horas ou minutos, conforme regra de negócio
  price?: number;            // Preço do serviço
  visibility: "public" | "private"; // Controle de exibição
  notes?: string;    
  images: string[];       // Observações (opcional)
}

export interface Tool {
    id: UUID;
    name: string;
    description?: string;
    quantity: number;
    min_quantity: number;
    location?: string;
    updated_at?: string;
}
