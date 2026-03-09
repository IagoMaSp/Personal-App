import { api } from './client';

export interface Category {
    id: number;
    name: string;
    color: string;
}

export interface Note {
    id: number;
    title: string;
    content: string;
    icon: string | null;
    pinned: boolean;
    created_at: string;
    updated_at: string;
    categories: Category[];
}

export const notesApi = {
    getAll: async (): Promise<Note[]> => {
        const response = await api.get('/notes/');
        return response.data;
    },

    getById: async (id: number): Promise<Note> => {
        const response = await api.get(`/notes/${id}/`);
        return response.data;
    },

    create: async (data: { title: string; content?: string; pinned?: boolean; icon?: string | null; category_ids?: number[] }): Promise<Note> => {
        const response = await api.post('/notes/', data);
        return response.data;
    },

    update: async (id: number, data: Partial<Note> & { category_ids?: number[] }): Promise<Note> => {
        const response = await api.patch(`/notes/${id}/`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/notes/${id}/`);
    }
};


export const categoriesApi = {
    getAll: async (): Promise<Category[]> => {
        const response = await api.get('/categories/');
        return response.data;
    },

    create: async (data: { name: string; color?: string }): Promise<Category> => {
        const response = await api.post('/categories/', data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/categories/${id}/`);
    }
};
