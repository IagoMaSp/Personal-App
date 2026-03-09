import { api } from './client';

export type BookStatus = 'to_read' | 'reading' | 'read' | 'dropped';

export interface Book {
    id: number;
    title: string;
    author: string;
    cover_image: string | null;
    status: BookStatus;
    rating: number; // 0-5
    synopsis: string;
    review: string;
    created_at: string;
    updated_at: string;
}

export const booksApi = {
    getAll: async (): Promise<Book[]> => {
        const response = await api.get('/books/');
        return response.data;
    },

    getById: async (id: number): Promise<Book> => {
        const response = await api.get(`/books/${id}/`);
        return response.data;
    },

    create: async (data: FormData): Promise<Book> => {
        const response = await api.post('/books/', data);
        return response.data;
    },

    update: async (id: number, data: FormData): Promise<Book> => {
        const response = await api.patch(`/books/${id}/`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/books/${id}/`);
    }
};
