import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi, columnsApi, tagsApi } from '../api/events';
import type { Event } from '../api/events';
import { schedulesApi } from '../api/schedules';
import { Plus, Layout } from 'lucide-react';
import { KanbanBoard } from '../components/events/KanbanBoard';
import { EventModal } from '../components/events/EventModal';
import { MiniCalendar } from '../components/events/MiniCalendar';
import { FullCalendar } from '../components/events/FullCalendar';

export const EventsPage = () => {
    const queryClient = useQueryClient();
    const today = new Date();

    const [isCreating, setIsCreating] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    // View state
    const [viewMode, setViewMode] = useState<'kanban' | 'calendar'>('kanban');
    const [calendarDate, setCalendarDate] = useState(today);

    // Default queries
    const { data: events, isLoading: eventsLoading } = useQuery({
        queryKey: ['events'],
        queryFn: () => eventsApi.getAll(),
    });

    const { data: columnsData, isLoading: columnsLoading } = useQuery({
        queryKey: ['columns'],
        queryFn: columnsApi.getAll,
    });

    const { data: tagsData } = useQuery({
        queryKey: ['tags'],
        queryFn: tagsApi.getAll,
    });

    const { data: schedules } = useQuery({
        queryKey: ['schedules'],
        queryFn: schedulesApi.getAll,
    });

    /* Mutations */
    const createMutation = useMutation({
        mutationFn: eventsApi.create,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events'] }); setIsCreating(false); setSelectedEvent(null); },
        onError: (err: any) => alert('Error: ' + (err.response?.data?.non_field_errors?.[0] || err.message)),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Event> }) => eventsApi.update(id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events'] }); setIsCreating(false); setSelectedEvent(null); },
        onError: (err: any) => alert('Error: ' + (err.response?.data?.non_field_errors?.[0] || err.message)),
    });

    const deleteMutation = useMutation({
        mutationFn: eventsApi.delete,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events'] }); setIsCreating(false); setSelectedEvent(null); },
    });

    const updateOrderMutation = useMutation({
        mutationFn: eventsApi.updateOrder,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events'] }); },
    });

    const handleEdit = (e: React.MouseEvent, ev: Event) => {
        e.stopPropagation();
        setSelectedEvent(ev);
        setIsCreating(true);
    };

    const handleSave = (data: Partial<Event>) => {
        if (selectedEvent) {
            updateMutation.mutate({ id: selectedEvent.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleOrderChange = (updates: { id: number; column: number | null; order: number }[]) => {
        updateOrderMutation.mutate(updates);
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;
    const isLoading = eventsLoading || columnsLoading;
    const sortedColumns = columnsData?.sort((a, b) => a.order - b.order) || [];

    if (viewMode === 'calendar') {
        return (
            <div className="h-full relative overflow-hidden flex flex-col">
                <FullCalendar
                    events={events || []}
                    schedules={schedules || []}
                    currentDate={calendarDate}
                    onDateChange={setCalendarDate}
                    onDayClick={() => { setSelectedEvent(null); setIsCreating(true); }}
                    onEventClick={handleEdit}
                    onClose={() => setViewMode('kanban')}
                />

                {/* ── Modal ── */}
                {isCreating && (
                    <EventModal
                        event={selectedEvent}
                        columns={sortedColumns}
                        allTags={tagsData || []}
                        onClose={() => { setIsCreating(false); setSelectedEvent(null); }}
                        onSave={handleSave}
                        onDelete={(id) => deleteMutation.mutate(id)}
                        isSaving={isSaving}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="events-page h-full flex flex-col overflow-hidden relative">

            {/* ── Header ── */}
            <div className="events-header shrink-0 flex items-center justify-between mb-0 border-b border-white/5 pb-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Layout className="w-5 h-5 text-hk-accent/70" />
                        <h2 className="text-2xl font-bold font-serif text-hk-text tracking-wide">Tablero</h2>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => { setSelectedEvent(null); setIsCreating(true); }}
                        className="sched-add-btn whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Añadir Evento
                    </button>
                </div>
            </div>

            {/* ── Main View (Kanban + Side Calendar) ── */}
            <div className="flex-1 overflow-hidden mt-6 pb-2 flex gap-8">
                <div className="flex-1 h-full overflow-hidden relative">
                    {isLoading ? (
                        <div className="flex-1 h-full flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4 text-hk-text-muted/40 animate-pulse">
                                <span className="save-spinner w-8 h-8" />
                                <p className="text-sm tracking-widest uppercase">Cargando Tablero...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full">
                            <KanbanBoard
                                columns={sortedColumns}
                                events={events || []}
                                onEventClick={handleEdit}
                                onOrderChange={handleOrderChange}
                            />
                        </div>
                    )}
                </div>

                <div className="w-[320px] shrink-0 h-full hidden lg:block shadow-2xl rounded-xl border border-white/10 p-1 bg-black/20 overflow-hidden">
                    <div className="h-full flex flex-col">
                        <MiniCalendar
                            currentDate={calendarDate}
                            events={events || []}
                            schedules={schedules || []}
                            onDateChange={setCalendarDate}
                            onDayClick={() => { setSelectedEvent(null); setIsCreating(true); }}
                            isExpanded={true}
                            onExpandToggle={() => setViewMode('calendar')}
                        />
                    </div>
                </div>
            </div>

            {/* ── Modal ── */}
            {isCreating && (
                <EventModal
                    event={selectedEvent}
                    columns={sortedColumns}
                    allTags={tagsData || []}
                    onClose={() => { setIsCreating(false); setSelectedEvent(null); }}
                    onSave={handleSave}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    isSaving={isSaving}
                />
            )}
        </div>
    );
};
