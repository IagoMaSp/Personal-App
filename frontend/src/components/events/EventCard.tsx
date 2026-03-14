import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Event } from '../../api/events';
import { Calendar, CheckSquare, AlertCircle } from 'lucide-react';
import { parseISO, format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface EventCardProps {
    event: Event;
    onClick: (e: React.MouseEvent, event: Event) => void;
}

const LEGACY_MAP: Record<string, string> = {
    'bg-hk-accent': '#6b8ea5', 'bg-blue-500': '#3b82f6',
    'bg-green-500': '#10b981', 'bg-yellow-500': '#f59e0b',
    'bg-purple-500': '#8b5cf6', 'bg-pink-500': '#ec4899',
    'bg-red-500': '#ef4444',
};

const toHex = (c: string) => LEGACY_MAP[c] ?? (c?.startsWith('#') ? c : '#6b8ea5');

export const EventCard = ({ event, onClick }: EventCardProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: event.id.toString(), data: { type: 'Event', event } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const isPastOrDueSoon = () => {
        if (!event.date) return false;
        const eventDate = parseISO(event.date);
        const now = new Date();
        const diff = differenceInDays(eventDate, now);
        return diff < 2; // Past, today, or tomorrow
    };

    const isDue = isPastOrDueSoon();
    const eventColor = toHex(event.color);

    const checkListTotal = event.subtasks?.length || 0;
    const checkListDone = event.subtasks?.filter(s => s.is_completed).length || 0;
    const checkListProgress = checkListTotal > 0 ? Math.round((checkListDone / checkListTotal) * 100) : null;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={(e) => onClick(e, event)}
            className={`
                relative p-4 mb-3 rounded-lg shadow-sm border border-white/5 bg-hk-bg cursor-grab active:cursor-grabbing hover:bg-white/[0.02] transition-colors
                ${isDue ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : ''}
            `}
        >
            <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg" style={{ backgroundColor: eventColor }} />

            <div className="ml-2">
                <div className="flex justify-between items-start mb-2 gap-2">
                    <h4 className="font-semibold text-hk-text text-sm line-clamp-2 leading-tight flex-1">
                        {event.title}
                    </h4>
                    {event.priority === 'High' && (
                        <span className="shrink-0 text-[10px] uppercase font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">Alta</span>
                    )}
                    {event.priority === 'Medium' && (
                        <span className="shrink-0 text-[10px] uppercase font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">Med</span>
                    )}
                    {isDue && (
                        <AlertCircle className="w-4 h-4 text-red-500 absolute top-2 right-2 opacity-70" />
                    )}
                </div>

                {event.tags_details && event.tags_details.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3 mt-2">
                        {event.tags_details.map(tag => (
                            <span key={tag.id} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-hk-text-muted/80">
                                {tag.name}
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-4 mt-auto text-xs text-hk-text-muted/60">
                    <div className={`flex items-center gap-1.5 ${isDue ? 'text-red-400/80 font-medium' : ''}`}>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{event.date ? format(parseISO(event.date), 'd MMM', { locale: es }) : 'Sin fecha'}</span>
                    </div>

                    {checkListTotal > 0 && (
                        <div className="flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>{checkListDone}/{checkListTotal}</span>
                        </div>
                    )}
                </div>

                {checkListProgress !== null && (
                    <div className="mt-2.5 h-1 w-full bg-black/40 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-hk-accent/60 transition-all duration-300"
                            style={{ width: `${checkListProgress}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
