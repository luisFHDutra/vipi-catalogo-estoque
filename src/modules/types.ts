export type UUID = string;

export interface Service {
    id: UUID;
    name: string;
    description: string;
    image_url?: string;
    execution_time_minutes?: number; // sensível: ocultar na visão pública
    cost?: number;                    // sensível: ocultar na visão pública
    is_public: boolean;
    created_at?: string;
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
