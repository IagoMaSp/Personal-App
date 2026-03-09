import { api } from './client';

export interface Event {
    id: number;
    title: string;
    description: string;
    date: string; // YYYY-MM-DD
    start_time: string | null; // HH:MM:SS
    end_time: string | null; // HH:MM:SS
    is_all_day: boolean;
    color: string;
    created_at: string;
    updated_at: string;
}

export const eventsApi = {
    getAll: async (year?: number, month?: number): Promise<Event[]> => {
        let url = '/events/';
        if (year !== undefined && month !== undefined) {
            url += `?year=${year}&month=${month}`;
        }
        const response = await api.get(url);
        return response.data;
    },

    getById: async (id: number): Promise<Event> => {
        const response = await api.get(`/events/${id}/`);
        return response.data;
    },

    create: async (data: Partial<Event>): Promise<Event> => {
        const response = await api.post('/events/', data);
        return response.data;
    },

    update: async (id: number, data: Partial<Event>): Promise<Event> => {
        const response = await api.patch(`/events/${id}/`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/events/${id}/`);
    }
};
