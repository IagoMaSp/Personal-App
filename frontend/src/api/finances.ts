import { api } from './client';

export interface Category {
    id: number;
    name: string;
    type: 'INCOME' | 'EXPENSE';
    color: string | null;
    created_at: string;
    updated_at: string;
}

export interface Transaction {
    id: number;
    title: string;
    amount: string; // Decimal is a string in JS
    type: 'INCOME' | 'EXPENSE';
    category: number | null;
    category_detail?: Category | null;
    date: string; // YYYY-MM-DD
    is_recurring: boolean;
    recurrence_period: 'WEEKLY' | 'MONTHLY' | null;
    created_at: string;
    updated_at: string;
}

export const financesApi = {
    // Categories
    getCategories: async (): Promise<Category[]> => {
        const response = await api.get('/finances/categories/');
        return response.data;
    },
    createCategory: async (data: Partial<Category>): Promise<Category> => {
        const response = await api.post('/finances/categories/', data);
        return response.data;
    },
    updateCategory: async (id: number, data: Partial<Category>): Promise<Category> => {
        const response = await api.patch(`/finances/categories/${id}/`, data);
        return response.data;
    },
    deleteCategory: async (id: number): Promise<void> => {
        await api.delete(`/finances/categories/${id}/`);
    },

    // Transactions
    getTransactions: async (): Promise<Transaction[]> => {
        const response = await api.get('/finances/transactions/');
        return response.data;
    },
    createTransaction: async (data: Partial<Transaction>): Promise<Transaction> => {
        const response = await api.post('/finances/transactions/', data);
        return response.data;
    },
    updateTransaction: async (id: number, data: Partial<Transaction>): Promise<Transaction> => {
        const response = await api.patch(`/finances/transactions/${id}/`, data);
        return response.data;
    },
    deleteTransaction: async (id: number): Promise<void> => {
        await api.delete(`/finances/transactions/${id}/`);
    }
};
