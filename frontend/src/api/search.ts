import { api } from './client';
import type { Note } from './notes';
import type { Book } from './books';

export interface SearchResults {
    notes: Note[];
    books: Book[];
}

export const searchApi = {
    search: async (query: string): Promise<SearchResults> => {
        const response = await api.get('/search/', { params: { q: query } });
        return response.data;
    }
};
