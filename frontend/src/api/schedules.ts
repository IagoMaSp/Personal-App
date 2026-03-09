import { api } from './client';

export interface Schedule {
    id: number;
    title: string;
    description: string;
    day_of_week: number; // 0=Monday, 6=Sunday
    start_time: string; // HH:MM:SS format
    end_time: string;   // HH:MM:SS format
    color: string;
    created_at: string;
    updated_at: string;
}

export const schedulesApi = {
    getAll: async (): Promise<Schedule[]> => {
        const response = await api.get('/schedules/');
        return response.data;
    },

    getById: async (id: number): Promise<Schedule> => {
        const response = await api.get(`/schedules/${id}/`);
        return response.data;
    },

    create: async (data: Partial<Schedule>): Promise<Schedule> => {
        const response = await api.post('/schedules/', data);
        return response.data;
    },

    update: async (id: number, data: Partial<Schedule>): Promise<Schedule> => {
        const response = await api.patch(`/schedules/${id}/`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/schedules/${id}/`);
    }
};
