import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { BoardColumn as ColumnType, Event } from '../../api/events';
import { EventCard } from './EventCard';

interface KanbanColumnProps {
    column: ColumnType;
    events: Event[];
    onEventClick: (e: React.MouseEvent, event: Event) => void;
}

export const KanbanColumn = ({ column, events, onEventClick }: KanbanColumnProps) => {
    const { setNodeRef, isOver } = useDroppable({
        id: column.id.toString(),
        data: {
            type: 'Column',
            column
        }
    });

    const eventIds = useMemo(() => events.map(e => e.id.toString()), [events]);

    const isOverLimit = column.wip_limit > 0 && events.length > column.wip_limit;
    // Highlight red if it's over limit, or if it's currently dragging over and WILL be over limit.
    const showWarning = isOverLimit || (isOver && column.wip_limit > 0 && (events.length + 1) > column.wip_limit);

    return (
        <div className="flex flex-col flex-none w-[320px] bg-black/20 rounded-xl max-h-full border border-white/5 overflow-hidden">
            <div className={`p-4 flex items-center justify-between border-b border-white/5 shadow-sm
                ${showWarning ? 'bg-red-500/10' : 'bg-black/20'} transition-colors duration-300`}>
                <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-hk-text tracking-wide">
                        {column.name === 'To Do' ? 'Pendiente' : column.name === 'In Progress' ? 'En progreso' : column.name === 'Done' ? 'Completado' : column.name}
                    </h3>
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-hk-accent/20 text-hk-accent text-xs font-medium">
                        {events.length}
                    </span>
                </div>
                {column.wip_limit > 0 && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border
                        ${showWarning ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-hk-text-muted/60 border-white/10'}`}>
                        Máx: {column.wip_limit}
                    </span>
                )}
            </div>

            <div
                ref={setNodeRef}
                className={`p-3 flex-1 overflow-y-auto min-h-[150px] transition-colors
                    ${isOver ? 'bg-white/[0.02]' : ''}`}
            >
                <SortableContext items={eventIds} strategy={verticalListSortingStrategy}>
                    {events.map(event => (
                        <EventCard key={event.id} event={event} onClick={onEventClick} />
                    ))}
                </SortableContext>
                {events.length === 0 && (
                    <div className="h-full flex items-center justify-center text-sm text-hk-text-muted/30 italic pb-10">
                        Arrastra eventos aquí
                    </div>
                )}
            </div>
        </div>
    );
};
