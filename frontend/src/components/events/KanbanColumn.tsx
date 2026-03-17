import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { BoardColumn as ColumnType, Event } from '../../api/events';
import { EventCard } from './EventCard';

interface KanbanColumnProps {
    column: ColumnType;
    events: Event[];
    onEventClick: (e: React.MouseEvent, event: Event) => void;
    onEditColumn?: (col: ColumnType) => void;
}

import { MoreHorizontal } from 'lucide-react';

export const KanbanColumn = ({ column, events, onEventClick, onEditColumn }: KanbanColumnProps) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `col-${column.id}`,
        data: { type: 'Column', column }
    });

    const eventIds = useMemo(() => events.map(e => e.id.toString()), [events]);

    const isOverLimit = column.wip_limit > 0 && events.length > column.wip_limit;
    const showWarning = isOverLimit || (isOver && column.wip_limit > 0 && (events.length + 1) > column.wip_limit);

    const accent = column.color || '#6b8ea5';
    const displayName = column.name;

    // Progress bar: only if has wip limit
    const wipPct = column.wip_limit > 0 ? Math.min(100, (events.length / column.wip_limit) * 100) : null;

    return (
        <div
            className={`kanban-col ${isOver ? 'kanban-col--over' : ''} ${showWarning ? 'kanban-col--warn' : ''}`}
            style={{ '--col-accent': accent } as React.CSSProperties}
        >
            {/* Column top accent line */}
            <div className="kanban-col-accent-line" style={{ background: showWarning ? '#ef4444' : accent }} />

            {/* Header */}
            <div className="kanban-col-header">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Colored dot */}
                    <span
                        className="kanban-col-dot"
                        style={{ background: showWarning ? '#ef4444' : accent, boxShadow: `0 0 6px ${showWarning ? '#ef4444' : accent}80` }}
                    />
                    <h3 className="kanban-col-name flex-1 truncate">{displayName}</h3>
                    <span
                        className="kanban-col-count"
                        style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}30` }}
                    >
                        {events.length}
                    </span>
                </div>

                {onEditColumn && (
                    <button
                        onClick={() => onEditColumn(column)}
                        className="p-1 text-hk-text-muted hover:text-white rounded hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="px-3 pb-2 flex justify-end">
                {column.wip_limit > 0 && (
                    <span className={`kanban-col-wip ${showWarning ? 'kanban-col-wip--warn' : ''}`}>
                        Máx: {column.wip_limit}
                    </span>
                )}
            </div>

            {/* WIP progress bar */}
            {wipPct !== null && (
                <div className="kanban-col-progress-track">
                    <div
                        className="kanban-col-progress-fill"
                        style={{
                            width: `${wipPct}%`,
                            background: showWarning
                                ? 'linear-gradient(90deg, #dc2626, #ef4444)'
                                : `linear-gradient(90deg, ${accent}80, ${accent})`
                        }}
                    />
                </div>
            )}

            {/* Drop zone */}
            <div
                ref={setNodeRef}
                className={`kanban-col-body ${isOver ? 'kanban-col-body--over' : ''}`}
            >
                <SortableContext items={eventIds} strategy={verticalListSortingStrategy}>
                    {events.map((event, idx) => (
                        <EventCard key={event.id} event={event} onClick={onEventClick} index={idx} />
                    ))}
                </SortableContext>

                {events.length === 0 && (
                    <div className="kanban-col-empty">
                        <div className="kanban-col-empty-ring" style={{ borderColor: `${accent}25` }} />
                        <p className="kanban-col-empty-text">Arrastra eventos aquí</p>
                    </div>
                )}
            </div>
        </div>
    );
};
