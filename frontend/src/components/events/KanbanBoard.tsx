import React, { useState, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type {
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Event, BoardColumn } from '../../api/events';
import { KanbanColumn } from './KanbanColumn';
import { EventCard } from './EventCard';
import { ColumnEditorModal } from './ColumnEditorModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { columnsApi } from '../../api/events';
import { Plus } from 'lucide-react';

interface KanbanBoardProps {
    columns: BoardColumn[];
    events: Event[];
    onEventClick: (e: React.MouseEvent, event: Event) => void;
    onOrderChange: (updates: { id: number; column: number | null; order: number }[]) => void;
}

export const KanbanBoard = ({ columns, events: initialEvents, onEventClick, onOrderChange }: KanbanBoardProps) => {
    const queryClient = useQueryClient();
    const [activeEvent, setActiveEvent] = useState<Event | null>(null);
    const [localEvents, setLocalEvents] = useState<Event[]>(initialEvents);

    // Column Editor State
    const [isEditingCol, setIsEditingCol] = useState(false);
    const [selectedCol, setSelectedCol] = useState<BoardColumn | null>(null);

    const createColMutation = useMutation({
        mutationFn: columnsApi.create,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['columns'] }); setIsEditingCol(false); }
    });

    const updateColMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<BoardColumn> }) => columnsApi.update(id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['columns'] }); setIsEditingCol(false); }
    });

    const deleteColMutation = useMutation({
        mutationFn: columnsApi.delete,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['columns'] }); setIsEditingCol(false); }
    });

    const handleSaveColumn = (data: Partial<BoardColumn>) => {
        if (selectedCol) {
            updateColMutation.mutate({ id: selectedCol.id, data });
        } else {
            createColMutation.mutate({ ...data, order: columns.length });
        }
    };

    useEffect(() => {
        setLocalEvents(initialEvents);
    }, [initialEvents]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // minimum distance to consider it a drag vs a click
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const e = localEvents.find(e => e.id.toString() === active.id);
        if (e) setActiveEvent(e);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveEvent = active.data.current?.type === 'Event';
        const isOverEvent = over.data.current?.type === 'Event';
        const isOverColumn = over.data.current?.type === 'Column';

        if (!isActiveEvent) return;

        // Dropping an event over another event
        if (isActiveEvent && isOverEvent) {
            setLocalEvents((prevEvents) => {
                const activeIndex = prevEvents.findIndex((t) => t.id.toString() === activeId);
                const overIndex = prevEvents.findIndex((t) => t.id.toString() === overId);

                if (prevEvents[activeIndex].column !== prevEvents[overIndex].column) {
                    const newEvents = [...prevEvents];
                    newEvents[activeIndex] = { ...newEvents[activeIndex], column: prevEvents[overIndex].column };
                    return arrayMove(newEvents, activeIndex, overIndex);
                }

                return arrayMove(prevEvents, activeIndex, overIndex);
            });
        }

        // Dropping an event over an empty column
        if (isActiveEvent && isOverColumn) {
            setLocalEvents((prevEvents) => {
                const activeIndex = prevEvents.findIndex((t) => t.id.toString() === activeId);
                const colIdStr = String(overId).replace('col-', '');
                const colId = Number(colIdStr);

                if (prevEvents[activeIndex].column !== colId) {
                    const newEvents = [...prevEvents];
                    newEvents[activeIndex] = { ...newEvents[activeIndex], column: colId };
                    return arrayMove(newEvents, activeIndex, activeIndex);
                }
                return prevEvents;
            });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveEvent(null);
        const { active, over } = event;

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        // After local state settles, prepare batch update payload for API
        const updates = localEvents.map((evt, index) => ({
            id: evt.id,
            column: evt.column,
            order: index
        }));

        // Check if there are differences from prop events
        // Simple heuristic: if the first modified event has changed its column or index diff, fire API.
        onOrderChange(updates);
    };

    return (
        <div className="h-full">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="kanban-board-container flex gap-[1.125rem] h-full overflow-x-auto pb-4 custom-scrollbar">
                    {columns.map(col => {
                        const colEvents = localEvents.filter(e => e.column === col.id);
                        return (
                            <div key={col.id} className="group shrink-0 h-full flex flex-col">
                                <KanbanColumn
                                    column={col}
                                    events={colEvents}
                                    onEventClick={onEventClick}
                                    onEditColumn={(c) => { setSelectedCol(c); setIsEditingCol(true); }}
                                />
                            </div>
                        );
                    })}
                    {/* Add Column Button */}
                    <div className="shrink-0 w-80 h-full p-2">
                        <button
                            onClick={() => { setSelectedCol(null); setIsEditingCol(true); }}
                            className="w-full flex items-center gap-2 justify-center py-3 bg-white/[0.02] hover:bg-white/5 border border-dashed border-white/10 hover:border-white/20 rounded-xl text-hk-text-muted hover:text-white transition-colors h-14"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-medium tracking-wide">Nueva Columna</span>
                        </button>
                    </div>
                </div>

                <DragOverlay>
                    {activeEvent ? (
                        <div className="opacity-90 rotate-2 scale-105 transition-transform shadow-2xl">
                            <EventCard event={activeEvent} onClick={() => { }} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Column Editor Modal */}
            <ColumnEditorModal
                isOpen={isEditingCol}
                column={selectedCol}
                onClose={() => setIsEditingCol(false)}
                onSave={handleSaveColumn}
                onDelete={(id) => deleteColMutation.mutate(id)}
                isSaving={createColMutation.isPending || updateColMutation.isPending}
            />
        </div>
    );
};
