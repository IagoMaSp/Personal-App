import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, RefreshCw, X } from 'lucide-react';
import type { Event } from '../../api/events';
import type { Schedule } from '../../api/schedules';

const DAYS_HEADER = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const LEGACY_MAP: Record<string, string> = {
    'bg-hk-accent': '#6b8ea5', 'bg-blue-500': '#3b82f6',
    'bg-green-500': '#10b981', 'bg-yellow-500': '#f59e0b',
    'bg-purple-500': '#8b5cf6', 'bg-pink-500': '#ec4899',
    'bg-red-500': '#ef4444',
};

const toHex = (c: string) => LEGACY_MAP[c] ?? (c?.startsWith('#') ? c : '#6b8ea5');
const fmt5 = (t: string | null | undefined) => t ? t.slice(0, 5) : '';
const todayStr = () => new Date().toISOString().split('T')[0];

interface PillProps {
    label: string;
    hex: string;
    icon?: React.ReactNode;
    time?: string;
    onClick?: (e: React.MouseEvent) => void;
    dashed?: boolean;
}

const EventPill = ({ label, hex, icon, time, onClick, dashed }: PillProps) => (
    <div
        className={`cal-pill ${dashed ? 'cal-pill--dashed' : ''}`}
        style={{ '--pill-color': hex } as React.CSSProperties}
        onClick={onClick}
        title={label}
    >
        <span className="cal-pill-dot" style={{ background: hex }} />
        {icon && <span className="cal-pill-icon">{icon}</span>}
        {time && <span className="cal-pill-time">{time}</span>}
        <span className="cal-pill-label">{label}</span>
    </div>
);

interface FullCalendarProps {
    events: Event[];
    schedules: Schedule[];
    currentDate: Date;
    onDateChange: (date: Date) => void;
    onDayClick: (dateStr: string) => void;
    onEventClick: (e: React.MouseEvent, event: Event) => void;
    onClose: () => void;
}

export const FullCalendar = ({ events, schedules, currentDate, onDateChange, onDayClick, onEventClick, onClose }: FullCalendarProps) => {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const [cellsVisible, setCellsVisible] = useState(false);
    useEffect(() => {
        setCellsVisible(false);
        const t = setTimeout(() => setCellsVisible(true), 80);
        return () => clearTimeout(t);
    }, [currentMonth, currentYear]);

    const prevMonth = () => {
        const next = new Date(currentYear, currentMonth - 1, 1);
        onDateChange(next);
    };

    const nextMonth = () => {
        const next = new Date(currentYear, currentMonth + 1, 1);
        onDateChange(next);
    };

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    const todayISO = todayStr();

    const calendarCells = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarCells.push({ day: daysInPrevMonth - firstDayOfMonth + i + 1, isCurrentMonth: false, dateString: '', events: [], schedules: [] });
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const monthStr = (currentMonth + 1).toString().padStart(2, '0');
        const dayStr = i.toString().padStart(2, '0');
        const dateString = `${currentYear}-${monthStr}-${dayStr}`;
        const jsDay = new Date(currentYear, currentMonth, i).getDay();
        const appDay = jsDay === 0 ? 6 : jsDay - 1;
        calendarCells.push({
            day: i, isCurrentMonth: true, dateString,
            events: events.filter(e => e.date === dateString),
            schedules: schedules.filter(s => s.day_of_week === appDay),
            isToday: dateString === todayISO,
        });
    }

    const remaining = 42 - calendarCells.length;
    for (let i = 1; i <= remaining; i++) {
        calendarCells.push({ day: i, isCurrentMonth: false, dateString: '', events: [], schedules: [] });
    }

    return (
        <div className="flex flex-col h-full bg-hk-bg p-2 lg:p-8 animate-in zoom-in-95 duration-200 fade-in">
            {/* ── Header ── */}
            <div className="events-header">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-hk-accent/70" />
                        <h2 className="text-2xl font-bold font-serif text-hk-text tracking-wide">Calendario Grande</h2>
                    </div>

                    {/* Month navigator */}
                    <div className="month-nav">
                        <button onClick={prevMonth} className="month-nav-arrow" title="Mes anterior">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="month-nav-label">
                            {MONTHS[currentMonth]} {currentYear}
                        </span>
                        <button onClick={nextMonth} className="month-nav-arrow" title="Mes siguiente">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <button onClick={() => onDateChange(new Date())} className="today-btn">
                        Hoy
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => onDayClick(todayISO)}
                        className="sched-add-btn"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Añadir Evento
                    </button>
                    <button onClick={onClose} className="px-3 py-2 border border-white/5 bg-black/20 hover:bg-white/10 rounded-lg text-hk-text-muted hover:text-white transition-colors" title="Volver al Tablero">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── Calendar ── */}
            <div className="cal-container">
                {/* Day-of-week headers */}
                <div className="cal-dow-headers">
                    {DAYS_HEADER.map(d => (
                        <div key={d} className="cal-dow-header">{d}</div>
                    ))}
                </div>

                {/* Cells grid */}
                <div className="cal-grid">
                    {calendarCells.map((cell, idx) => (
                        <div
                            key={idx}
                            className={`cal-cell
                                ${cell.isCurrentMonth ? 'cal-cell--current' : 'cal-cell--other'}
                                ${(cell as any).isToday ? 'cal-cell--today' : ''}
                            `}
                            style={{
                                opacity: cellsVisible && cell.isCurrentMonth ? 1 : cell.isCurrentMonth ? 0 : undefined,
                                transform: cellsVisible && cell.isCurrentMonth ? 'none' : cell.isCurrentMonth ? 'scale(0.97)' : undefined,
                                transition: `opacity 0.3s ease ${(idx % 7) * 0.03}s, transform 0.3s ease ${(idx % 7) * 0.03}s`,
                            }}
                            onClick={() => cell.isCurrentMonth && onDayClick(cell.dateString)}
                        >
                            {/* Day number */}
                            <div className="cal-cell-top">
                                <span className={`cal-day-num ${(cell as any).isToday ? 'cal-day-num--today' : ''}`}>
                                    {cell.day}
                                </span>
                                {cell.isCurrentMonth && (
                                    <Plus className="cal-cell-add-hint" />
                                )}
                            </div>

                            {/* Events & schedules */}
                            <div className="cal-cell-body">
                                {cell.schedules?.map((s: Schedule) => (
                                    <EventPill
                                        key={`s-${s.id}`}
                                        hex={toHex(s.color)}
                                        label={s.title}
                                        time={fmt5(s.start_time)}
                                        icon={<RefreshCw className="w-2.5 h-2.5" />}
                                        dashed
                                    />
                                ))}
                                {cell.events.map((ev: Event) => (
                                    <EventPill
                                        key={`e-${ev.id}`}
                                        hex={toHex(ev.color)}
                                        label={ev.title}
                                        time={ev.is_all_day ? undefined : fmt5(ev.start_time)}
                                        onClick={e => onEventClick(e, ev)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
