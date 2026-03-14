import { api } from './client';

export interface Tag {
    id: number;
    name: string;
    color: string;
}

export interface BoardColumn {
    id: number;
    name: string;
    order: number;
    wip_limit: number;
}

export interface Subtask {
    id: number;
    event: number;
    title: string;
    is_completed: boolean;
    order: number;
}

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
    column: number | null;
    order: number;
    priority: 'Low' | 'Medium' | 'High';
    tags: number[]; // array of tag IDs
    tags_details?: Tag[];
    subtasks?: Subtask[];
    time?: string; // Form-only helper field
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

    updateOrder: async (updates: { id: number; column: number | null; order: number }[]): Promise<void> => {
        await api.post('/events/update_order/', updates);
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/events/${id}/`);
    }
};

export const columnsApi = {
    getAll: async (): Promise<BoardColumn[]> => {
        const response = await api.get('/columns/');
        return response.data;
    },

    create: async (data: Partial<BoardColumn>): Promise<BoardColumn> => {
        const response = await api.post('/columns/', data);
        return response.data;
    },

    update: async (id: number, data: Partial<BoardColumn>): Promise<BoardColumn> => {
        const response = await api.patch(`/columns/${id}/`, data);
        return response.data;
    },

    updateOrder: async (updates: { id: number; order: number }[]): Promise<void> => {
        await api.post('/columns/update_order/', updates);
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/columns/${id}/`);
    }
};

export const tagsApi = {
    getAll: async (): Promise<Tag[]> => {
        const response = await api.get('/tags/');
        return response.data;
    },

    create: async (data: Partial<Tag>): Promise<Tag> => {
        const response = await api.post('/tags/', data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/tags/${id}/`);
    }
};

export const subtasksApi = {
    create: async (data: Partial<Subtask>): Promise<Subtask> => {
        const response = await api.post('/subtasks/', data);
        return response.data;
    },

    update: async (id: number, data: Partial<Subtask>): Promise<Subtask> => {
        const response = await api.patch(`/subtasks/${id}/`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/subtasks/${id}/`);
    }
};
