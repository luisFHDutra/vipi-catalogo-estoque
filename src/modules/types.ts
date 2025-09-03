export type UUID = string;

export interface Service {
    id: UUID;
    name: string;
    description?: string;
    images?: string[];
    image_url?: string;
    execution_time_minutes?: number;
    charged_value?: number;
    is_public: boolean;
    annotations?: any;
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
