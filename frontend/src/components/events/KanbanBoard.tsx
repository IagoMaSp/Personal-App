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

interface KanbanBoardProps {
    columns: BoardColumn[];
    events: Event[];
    onEventClick: (e: React.MouseEvent, event: Event) => void;
    onOrderChange: (updates: { id: number; column: number | null; order: number }[]) => void;
}

export const KanbanBoard = ({ columns, events: initialEvents, onEventClick, onOrderChange }: KanbanBoardProps) => {
    const [activeEvent, setActiveEvent] = useState<Event | null>(null);
    const [localEvents, setLocalEvents] = useState<Event[]>(initialEvents);

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
                const colId = Number(overId);

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
                            <KanbanColumn
                                key={col.id}
                                column={col}
                                events={colEvents}
                                onEventClick={onEventClick}
                            />
                        );
                    })}
                </div>

                <DragOverlay>
                    {activeEvent ? (
                        <div className="opacity-90 rotate-2 scale-105 transition-transform shadow-2xl">
                            <EventCard event={activeEvent} onClick={() => { }} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};
