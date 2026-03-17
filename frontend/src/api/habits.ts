import { api } from './client'

export interface Habit {
    id: number
    name: string
    icon: string | null
    color: string
    frequency: 'daily' | 'weekly'
    target_days: number[]
    current_streak: number
    completion_rate_30d: number
    completed_today: boolean
    is_active: boolean
    created_at: string
}

export interface HabitLog {
    id: number
    habit: number
    date: string
    completed: boolean
}

export const habitsApi = {
    getAll: async (): Promise<Habit[]> => {
        const response = await api.get('/habits/')
        return response.data
    },

    create: async (data: Partial<Habit>): Promise<Habit> => {
        const response = await api.post('/habits/', data)
        return response.data
    },

    update: async (id: number, data: Partial<Habit>): Promise<Habit> => {
        const response = await api.patch(`/habits/${id}/`, data)
        return response.data
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/habits/${id}/`)
    },

    toggleToday: async (id: number): Promise<Habit> => {
        const response = await api.post(`/habits/${id}/toggle_today/`)
        return response.data
    },

    getLogs: async (habitId: number, startDate?: string, endDate?: string): Promise<HabitLog[]> => {
        const params = new URLSearchParams()
        if (startDate) params.append('start_date', startDate)
        if (endDate) params.append('end_date', endDate)

        const response = await api.get(`/habits/${habitId}/logs/?${params.toString()}`)
        return response.data
    }
}
