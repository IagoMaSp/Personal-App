import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi, columnsApi, tagsApi } from '../api/events';
import type { Event } from '../api/events';
import { schedulesApi } from '../api/schedules';
import { Plus, Layout, CalendarDays, Sparkles } from 'lucide-react';
import { KanbanBoard } from '../components/events/KanbanBoard';
import { EventModal } from '../components/events/EventModal';
import { MiniCalendar } from '../components/events/MiniCalendar';
import { FullCalendar } from '../components/events/FullCalendar';

export const EventsPage = () => {
    const queryClient = useQueryClient();
    const today = new Date();

    const [isCreating, setIsCreating] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'kanban' | 'calendar'>('kanban');
    const [calendarDate, setCalendarDate] = useState(today);

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

    const createMutation = useMutation({
        mutationFn: eventsApi.create,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events'] }); setIsCreating(false); setSelectedEventId(null); },
        onError: (err: any) => alert('Error: ' + (err.response?.data?.non_field_errors?.[0] || err.message)),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Event> }) => eventsApi.update(id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events'] }); setIsCreating(false); setSelectedEventId(null); },
        onError: (err: any) => alert('Error: ' + (err.response?.data?.non_field_errors?.[0] || err.message)),
    });

    const deleteMutation = useMutation({
        mutationFn: eventsApi.delete,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events'] }); setIsCreating(false); setSelectedEventId(null); },
    });

    const updateOrderMutation = useMutation({
        mutationFn: eventsApi.updateOrder,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events'] }); },
    });

    const handleEdit = (e: React.MouseEvent, ev: Event) => {
        e.stopPropagation();
        setSelectedEventId(ev.id);
        setIsCreating(true);
    };

    const handleSave = (data: Partial<Event>) => {
        if (selectedEventId) updateMutation.mutate({ id: selectedEventId, data });
        else createMutation.mutate(data);
    };

    const handleOrderChange = (updates: { id: number; column: number | null; order: number }[]) => {
        updateOrderMutation.mutate(updates);
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;
    const isLoading = eventsLoading || columnsLoading;
    const sortedColumns = columnsData?.sort((a, b) => a.order - b.order) || [];
    const selectedEventObj = selectedEventId ? (events?.find(e => e.id === selectedEventId) || null) : null;

    // Counts for header
    const totalEvents = events?.length ?? 0;
    const highPriorityCount = events?.filter(e => e.priority === 'High').length ?? 0;

    if (viewMode === 'calendar') {
        return (
            <div className="h-full relative overflow-hidden flex flex-col">
                <FullCalendar
                    events={events || []}
                    schedules={schedules || []}
                    currentDate={calendarDate}
                    onDateChange={setCalendarDate}
                    onDayClick={() => { setSelectedEventId(null); setIsCreating(true); }}
                    onEventClick={handleEdit}
                    onClose={() => setViewMode('kanban')}
                />
                {isCreating && (
                    <EventModal
                        event={selectedEventObj}
                        columns={sortedColumns}
                        allTags={tagsData || []}
                        onClose={() => { setIsCreating(false); setSelectedEventId(null); }}
                        onSave={handleSave}
                        onDelete={(id) => deleteMutation.mutate(id)}
                        isSaving={isSaving}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="ev-page h-full flex flex-col overflow-hidden">

            {/* Decorative ambient particles */}
            <div className="ev-bg-particles" aria-hidden="true">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="ev-particle" style={{ '--i': i } as React.CSSProperties} />
                ))}
            </div>

            {/* ── Header ── */}
            <div className="ev-header shrink-0">
                {/* Left: Title + meta */}
                <div className="flex items-center gap-3">
                    <div className="ev-header-icon">
                        <Layout className="w-5 h-5 text-hk-accent" />
                    </div>
                    <div>
                        <h2 className="ev-title">Tablero de Eventos</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            {totalEvents > 0 && (
                                <span className="ev-meta-pill ev-meta-pill--accent">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    {totalEvents} evento{totalEvents !== 1 ? 's' : ''}
                                </span>
                            )}
                            {highPriorityCount > 0 && (
                                <span className="ev-meta-pill ev-meta-pill--warn">
                                    ⚡ {highPriorityCount} alta prioridad
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: View toggle + add button */}
                <div className="flex items-center gap-3">
                    {/* View toggle */}
                    <div className="ev-view-toggle">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`ev-view-btn ${viewMode === 'kanban' ? 'ev-view-btn--active' : ''}`}
                            title="Vista Tablero"
                        >
                            <Layout className="w-3.5 h-3.5" />
                            <span>Tablero</span>
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`ev-view-btn ${viewMode === 'calendar' ? 'ev-view-btn--active' : ''}`}
                            title="Vista Calendario"
                        >
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>Calendario</span>
                        </button>
                    </div>

                    <button
                        onClick={() => { setSelectedEventId(null); setIsCreating(true); }}
                        className="ev-add-btn"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Añadir Evento</span>
                    </button>
                </div>
            </div>

            {/* ── Divider ── */}
            <div className="ev-header-divider" />

            {/* ── Main View ── */}
            <div className="flex-1 overflow-hidden flex gap-5 mt-0 min-h-0">
                {/* Kanban board */}
                <div className="flex-1 h-full overflow-hidden relative min-w-0">
                    {isLoading ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="ev-loading-ring" />
                                <p className="text-xs text-hk-text-muted/50 tracking-widest uppercase animate-pulse">
                                    Cargando Tablero...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <KanbanBoard
                            columns={sortedColumns}
                            events={events || []}
                            onEventClick={handleEdit}
                            onOrderChange={handleOrderChange}
                        />
                    )}
                </div>

                {/* Mini Calendar sidebar */}
                <div className="ev-calendar-sidebar hidden lg:flex flex-col">
                    <MiniCalendar
                        currentDate={calendarDate}
                        events={events || []}
                        schedules={schedules || []}
                        onDateChange={setCalendarDate}
                        onDayClick={() => { setSelectedEventId(null); setIsCreating(true); }}
                        isExpanded={true}
                        onExpandToggle={() => setViewMode('calendar')}
                    />
                </div>
            </div>

            {/* ── Modal ── */}
            {isCreating && (
                <EventModal
                    event={selectedEventObj}
                    columns={sortedColumns}
                    allTags={tagsData || []}
                    onClose={() => { setIsCreating(false); setSelectedEventId(null); }}
                    onSave={handleSave}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    isSaving={isSaving}
                />
            )}
        </div>
    );
};
