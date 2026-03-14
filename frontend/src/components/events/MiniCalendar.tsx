
import type { Event } from '../../api/events';
import type { Schedule } from '../../api/schedules';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, startOfWeek, endOfMonth, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

interface MiniCalendarProps {
    currentDate: Date;
    events: Event[];
    schedules: Schedule[];
    onDateChange: (date: Date) => void;
    onDayClick: (dateStr: string) => void;
    isExpanded: boolean;
    onExpandToggle: () => void;
}

export const MiniCalendar = ({ currentDate, events, schedules, onDateChange, onDayClick, isExpanded, onExpandToggle }: MiniCalendarProps) => {

    const prevMonth = () => onDateChange(subMonths(currentDate, 1));
    const nextMonth = () => onDateChange(addMonths(currentDate, 1));
    const goToToday = () => onDateChange(new Date());

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const dateFormat = "yyyy-MM-dd";
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const getDayItems = (day: Date) => {
        const dateStr = format(day, dateFormat);
        const dayEvents = events.filter(e => e.date === dateStr);
        // Only consider schedules that fall on this day of the week
        const daySchedules = schedules.filter(s => s.day_of_week === day.getDay());
        return { dayEvents, daySchedules };
    };

    if (!isExpanded) {
        // Collapsed View
        return (
            <button
                onClick={onExpandToggle}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/20 hover:bg-white/5 border border-white/5 transition-colors group"
                title="Expandir calendario"
            >
                <CalendarIcon className="w-4 h-4 text-hk-text-muted group-hover:text-hk-accent transition-colors" />
                <span className="text-sm font-medium text-hk-text-muted group-hover:text-white transition-colors capitalize">
                    {format(currentDate, 'MMMM yyyy', { locale: es })}
                </span>
                <Maximize2 className="w-3.5 h-3.5 text-hk-text-muted/50 group-hover:text-hk-text-muted opacity-0 group-hover:opacity-100 transition-all ml-1" />
            </button>
        );
    }

    // Expanded View
    return (
        <div className="flex flex-col h-full bg-hk-surface font-sans">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/5 bg-black/20">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-hk-accent" />
                    <h3 className="text-sm font-bold capitalize text-hk-text">
                        {format(currentDate, 'MMMM yyyy', { locale: es })}
                    </h3>
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={goToToday} className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-hk-text-muted rounded mr-1">
                        Hoy
                    </button>
                    <button onClick={prevMonth} className="p-1 hover:bg-white/10 rounded text-hk-text-muted hover:text-white transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={nextMonth} className="p-1 hover:bg-white/10 rounded text-hk-text-muted hover:text-white transition-colors">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-white/10 mx-1 border-none" />
                    <button onClick={onExpandToggle} className="p-1 hover:bg-hk-accent/20 hover:text-white rounded text-hk-text-muted transition-colors" title="Ver Calendario Completo">
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 gap-px bg-white/5 border-b border-white/5">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
                    <div key={day} className="py-1.5 text-center text-[10px] font-bold text-hk-text-muted/60 bg-hk-surface">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 grid-rows-6 gap-px bg-white/5 flex-1 p-0.5">
                {days.map((day) => {
                    const { dayEvents, daySchedules } = getDayItems(day);
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isCurrentDay = isToday(day);

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => onDayClick(format(day, dateFormat))}
                            className={`
                                relative min-h-[48px] bg-hk-surface p-1 cursor-pointer transition-colors group
                                hover:bg-white/[0.03]
                                ${!isCurrentMonth ? 'opacity-40' : ''}
                                ${isCurrentDay ? 'bg-hk-accent/5' : ''}
                            `}
                        >
                            <div className={`
                                text-[10px] font-bold text-right mb-1 w-5 h-5 ml-auto flex items-center justify-center rounded-full
                                ${isCurrentDay ? 'bg-hk-accent text-white' : 'text-hk-text-muted/80 group-hover:text-hk-text'}
                            `}>
                                {format(day, 'd')}
                            </div>

                            {/* Tiny Indicators */}
                            <div className="flex flex-col gap-0.5">
                                {/* Schedules primarily (they belong here) */}
                                {daySchedules.slice(0, 2).map(s => (
                                    <div key={s.id} className="w-full h-1 rounded-full opacity-60 bg-purple-500/80" title={s.title} />
                                ))}

                                {/* Events secondarily (they are on the Kanban board) */}
                                {dayEvents.slice(0, 3 - Math.min(2, daySchedules.length)).map(e => (
                                    <div
                                        key={e.id}
                                        className="w-full h-1 rounded-full opacity-80"
                                        title={e.title}
                                        style={{ backgroundColor: e.color.includes('bg-') ? undefined : e.color }} // Approximate legacy tailwind classes
                                    >
                                        {e.color.includes('bg-') && <div className={`w-full h-full rounded-full ${e.color}`} />}
                                    </div>
                                ))}

                                {(dayEvents.length + daySchedules.length) > 3 && (
                                    <div className="text-[8px] text-hk-text-muted/60 text-center font-bold">
                                        +{(dayEvents.length + daySchedules.length) - 3}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
