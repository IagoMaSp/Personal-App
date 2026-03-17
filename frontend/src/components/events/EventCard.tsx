import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Event } from '../../api/events';
import { Calendar, CheckSquare, AlertCircle, GripVertical } from 'lucide-react';
import { parseISO, format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface EventCardProps {
    event: Event;
    onClick: (e: React.MouseEvent, event: Event) => void;
    index?: number;
}

const LEGACY_MAP: Record<string, string> = {
    'bg-hk-accent': '#6b8ea5', 'bg-blue-500': '#3b82f6',
    'bg-green-500': '#10b981', 'bg-yellow-500': '#f59e0b',
    'bg-purple-500': '#8b5cf6', 'bg-pink-500': '#ec4899',
    'bg-red-500': '#ef4444',
};

const toHex = (c: string) => LEGACY_MAP[c] ?? (c?.startsWith('#') ? c : '#6b8ea5');

const PRIORITY_CONFIG = {
    High: { label: 'Alta', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
    Medium: { label: 'Med', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
    Low: { label: 'Baja', color: '#6b8ea5', bg: 'rgba(107,142,165,0.12)', border: 'rgba(107,142,165,0.25)' },
} as const;

export const EventCard = ({ event, onClick, index = 0 }: EventCardProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: event.id.toString(),
        data: { type: 'Event', event },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        animationDelay: `${index * 0.04}s`,
    };

    const isPastOrDueSoon = () => {
        if (!event.date) return false;
        return differenceInDays(parseISO(event.date), new Date()) < 2;
    };

    const isDue = isPastOrDueSoon();
    const eventColor = toHex(event.color);
    const priority = event.priority as keyof typeof PRIORITY_CONFIG | undefined;
    const priorityCfg = priority ? PRIORITY_CONFIG[priority] : null;

    const checkListTotal = event.subtasks?.length || 0;
    const checkListDone = event.subtasks?.filter(s => s.is_completed).length || 0;
    const checkListProgress = checkListTotal > 0 ? Math.round((checkListDone / checkListTotal) * 100) : null;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            onClick={(e) => onClick(e, event)}
            className={`ev-card ${isDragging ? 'ev-card--dragging' : ''} ${isDue ? 'ev-card--due' : ''}`}
        >
            {/* Colored left border accent */}
            <div className="ev-card-accent" style={{ background: eventColor, boxShadow: `0 0 8px ${eventColor}60` }} />

            {/* Drag handle */}
            <div className="ev-card-drag-handle" {...listeners} onClick={(e) => e.stopPropagation()}>
                <GripVertical className="w-3 h-3 text-hk-text-muted/30" />
            </div>

            {/* Content */}
            <div className="ev-card-body">
                {/* Title row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="ev-card-title">{event.title}</h4>
                    <div className="flex items-center gap-1 shrink-0">
                        {priorityCfg && (
                            <span
                                className="ev-card-priority"
                                style={{ color: priorityCfg.color, background: priorityCfg.bg, border: `1px solid ${priorityCfg.border}` }}
                            >
                                {priorityCfg.label}
                            </span>
                        )}
                        {isDue && <AlertCircle className="w-3.5 h-3.5 text-red-400/80" />}
                    </div>
                </div>

                {/* Tags */}
                {event.tags_details && event.tags_details.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {event.tags_details.map(tag => (
                            <span key={tag.id} className="ev-card-tag">
                                {tag.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="ev-card-footer">
                    <div className={`ev-card-date ${isDue ? 'ev-card-date--due' : ''}`}>
                        <Calendar className="w-3 h-3" />
                        <span>{event.date ? format(parseISO(event.date), 'd MMM', { locale: es }) : 'Sin fecha'}</span>
                    </div>
                    {checkListTotal > 0 && (
                        <div className="ev-card-checklist">
                            <CheckSquare className="w-3 h-3" />
                            <span>{checkListDone}/{checkListTotal}</span>
                        </div>
                    )}
                </div>

                {/* Subtask progress bar */}
                {checkListProgress !== null && (
                    <div className="ev-card-progress-track">
                        <div
                            className="ev-card-progress-fill"
                            style={{
                                width: `${checkListProgress}%`,
                                background: checkListProgress === 100
                                    ? 'linear-gradient(90deg, #059669, #10b981)'
                                    : `linear-gradient(90deg, ${eventColor}80, ${eventColor})`
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
