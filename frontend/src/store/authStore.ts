import { create } from 'zustand';
import { api } from '../api/client';

interface AuthState {
    isAuthenticated: boolean;
    username: string | null;
    isLoading: boolean;
    checkSession: () => Promise<void>;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    username: null,
    isLoading: true, // Start true until session is checked on load

    checkSession: async () => {
        try {
            const response = await api.get('/users/session/');
            set({ isAuthenticated: true, username: response.data.username, isLoading: false });
        } catch {
            set({ isAuthenticated: false, username: null, isLoading: false });
        }
    },

    login: async (username, password) => {
        try {
            const response = await api.post('/users/login/', { username, password });
            set({ isAuthenticated: true, username: response.data.username });
            return true;
        } catch {
            return false;
        }
    },

    logout: async () => {
        try {
            await api.post('/users/logout/');
        } finally {
            // Clear state even if logout network request fails
            set({ isAuthenticated: false, username: null });
        }
    }
}));
