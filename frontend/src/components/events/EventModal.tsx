import React, { useState } from 'react';
import { X, Save, Trash2, CheckSquare } from 'lucide-react';
import type { Event, BoardColumn as ColumnType, Tag, Subtask } from '../../api/events';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subtasksApi } from '../../api/events';


interface EventModalProps {
    event: Event | null;
    columns: ColumnType[];
    allTags: Tag[];
    onClose: () => void;
    onSave: (data: Partial<Event>) => void;
    onDelete?: (id: number) => void;
    isSaving?: boolean;
}

export const EventModal = ({ event, columns, allTags, onClose, onSave, onDelete, isSaving }: EventModalProps) => {
    const isEditing = !!event;
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState<Partial<Event>>({
        title: event?.title || '',
        description: event?.description || '',
        date: event?.date || new Date().toISOString().split('T')[0],
        time: event?.start_time || '', // we merge this back
        color: event?.color || 'bg-hk-accent',
        priority: event?.priority || 'Medium',
        column: event?.column || (columns.length > 0 ? columns[0].id : null),
        tags: event?.tags || [],
    });

    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

    const subtaskCreateMutation = useMutation({
        mutationFn: subtasksApi.create,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] })
    });

    const subtaskUpdateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: Partial<Subtask> }) => subtasksApi.update(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] })
    });

    const subtaskDeleteMutation = useMutation({
        mutationFn: subtasksApi.delete,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] })
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTagToggle = (tagId: number) => {
        setFormData(prev => {
            const tags = prev.tags || [];
            if (tags.includes(tagId)) {
                return { ...prev, tags: tags.filter(id => id !== tagId) };
            } else {
                return { ...prev, tags: [...tags, tagId] };
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload: Partial<Event> = {
            title: formData.title,
            description: formData.description,
            date: formData.date,
            color: formData.color,
            priority: formData.priority,
            column: formData.column,
            tags: formData.tags
        };

        if (formData.time) {
            payload.start_time = formData.time.length === 5 ? `${formData.time}:00` : formData.time;
            payload.end_time = null;
        } else {
            payload.start_time = null;
            payload.end_time = null;
        }

        onSave(payload);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm shadow-2xl animate-in fade-in duration-200 p-4">
            <div className="bg-hk-surface border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20">
                    <h2 className="text-xl font-bold font-serif text-hk-text">
                        {isEditing ? 'Editar Evento' : 'Nuevo Evento'}
                    </h2>
                    <button onClick={onClose} className="p-1.5 text-hk-text-muted hover:text-white rounded-md hover:bg-white/5 transition-colors" type="button">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="overflow-y-auto flex-1 p-5 custom-scrollbar">
                    <form id="event-form" onSubmit={handleSubmit} className="space-y-6">

                        <div>
                            <input
                                autoFocus
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Título del evento..."
                                className="w-full bg-transparent border-none text-2xl font-bold font-serif text-white placeholder:text-white/20 focus:outline-none focus:ring-0"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-hk-text-muted/60 mb-1.5 font-bold">Fecha y Hora</label>
                                <div className="flex bg-black/20 rounded-lg border border-white/5 p-1 gap-1">
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        required
                                        className="flex-1 bg-transparent border-none text-sm text-hk-text focus:outline-none cursor-pointer"
                                    />
                                    <input
                                        type="time"
                                        name="time"
                                        value={formData.time || ''}
                                        onChange={handleChange}
                                        className="w-28 bg-white/5 rounded px-2 border-none text-sm text-hk-text focus:outline-none cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-hk-text-muted/60 mb-1.5 font-bold">Estado (Columna)</label>
                                <select
                                    name="column"
                                    value={formData.column || ''}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/5 rounded-lg py-2 px-3 text-sm text-hk-text focus:outline-none focus:border-hk-accent/50 appearance-none cursor-pointer"
                                    required
                                >
                                    {columns.map(col => (
                                        <option key={col.id} value={col.id}>{col.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-hk-text-muted/60 mb-1.5 font-bold">Prioridad</label>
                                <div className="flex gap-2">
                                    {(['Low', 'Medium', 'High'] as const).map(p => (
                                        <label key={p} className={`flex-1 flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-colors text-sm font-medium
                                            ${formData.priority === p
                                                ? (p === 'High' ? 'bg-red-500/20 border-red-500/50 text-red-400' : p === 'Medium' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500' : 'bg-green-500/20 border-green-500/50 text-green-400')
                                                : 'bg-black/20 border-white/5 text-hk-text-muted hover:bg-white/5'
                                            }`}
                                        >
                                            <input type="radio" name="priority" value={p} checked={formData.priority === p} onChange={handleChange} className="hidden" />
                                            {p === 'High' ? 'Alta' : p === 'Medium' ? 'Media' : 'Baja'}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Color */}
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-hk-text-muted/60 mb-1.5 font-bold">Color</label>
                                <div className="flex gap-2 p-1.5 bg-black/20 rounded-lg border border-white/5 flex-wrap">
                                    {[
                                        'bg-hk-accent', 'bg-blue-500', 'bg-purple-500',
                                        'bg-pink-500', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'
                                    ].map(colorClass => (
                                        <button
                                            key={colorClass}
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, color: colorClass }))}
                                            className={`w-6 h-6 rounded-full transition-transform ${colorClass} ${formData.color === colorClass ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100'}`}
                                            aria-label={`Seleccionar color ${colorClass}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        {allTags.length > 0 && (
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-hk-text-muted/60 mb-1.5 font-bold">Etiquetas</label>
                                <div className="flex flex-wrap gap-2">
                                    {allTags.map(tag => {
                                        const isSelected = (formData.tags || []).includes(tag.id);
                                        return (
                                            <button
                                                key={tag.id}
                                                type="button"
                                                onClick={() => handleTagToggle(tag.id)}
                                                className={`px-3 py-1 text-xs rounded-full border transition-colors font-medium
                                                    ${isSelected ? 'bg-hk-accent/20 border-hk-accent/50 text-hk-accent' : 'bg-black/20 border-white/5 text-hk-text-muted hover:border-white/20'}`}
                                            >
                                                {tag.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Description (Markdown) */}
                        <div className="pt-2 border-t border-white/5">
                            <label className="block text-xs uppercase tracking-wider text-hk-text-muted/60 mb-1.5 font-bold">Descripción (Markdown)</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Escribe los detalles aquí... Soporta Markdown (**negrita**, *cursiva*, etc)"
                                className="w-full bg-black/20 border border-white/5 rounded-lg p-3 text-sm text-hk-text focus:outline-none focus:border-hk-accent/50 min-h-[120px] resize-y font-mono"
                            />
                        </div>

                        {/* Subtasks (Checklist) - ONLY if editing an existing event */}
                        {isEditing && (
                            <div className="pt-2 border-t border-white/5">
                                <label className="block text-xs uppercase tracking-wider text-hk-text-muted/60 mb-3 font-bold flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4" />
                                    Checklist / Subtareas
                                </label>

                                <div className="space-y-2 mb-3">
                                    {event.subtasks?.map(sub => (
                                        <div key={sub.id} className="flex items-center gap-3 group bg-black/20 border border-white/5 p-2 rounded-lg hover:border-white/10 transition-colors">
                                            <button
                                                type="button"
                                                onClick={() => subtaskUpdateMutation.mutate({ id: sub.id, data: { is_completed: !sub.is_completed } })}
                                                className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0
                                                    ${sub.is_completed ? 'bg-hk-accent border-hk-accent text-white' : 'border-white/20 hover:border-hk-accent/50'}`}
                                            >
                                                {sub.is_completed && <CheckSquare className="w-3.5 h-3.5" />}
                                            </button>
                                            <span className={`flex-1 text-sm transition-colors ${sub.is_completed ? 'line-through text-hk-text-muted/50' : 'text-hk-text'}`}>
                                                {sub.title}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => subtaskDeleteMutation.mutate(sub.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-hk-text-muted hover:text-red-400 transition-all rounded hover:bg-white/5 shrink-0"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {event.subtasks?.length === 0 && <p className="text-sm text-hk-text-muted italic">No hay subtareas registradas</p>}
                                </div>

                                <div className="flex gap-2 relative">
                                    <input
                                        type="text"
                                        value={newSubtaskTitle}
                                        onChange={e => setNewSubtaskTitle(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (newSubtaskTitle.trim() && event) {
                                                    subtaskCreateMutation.mutate({ event: event.id, title: newSubtaskTitle.trim(), is_completed: false });
                                                    setNewSubtaskTitle('');
                                                }
                                            }
                                        }}
                                        placeholder="Nueva subtarea... (Enter para añadir)"
                                        className="flex-1 bg-black/20 border border-white/5 rounded-lg py-1.5 px-3 text-sm text-hk-text focus:outline-none focus:border-hk-accent/50"
                                    />
                                </div>
                            </div>
                        )}

                        {!isEditing && (
                            <p className="text-xs text-hk-text-muted italic pt-2 border-t border-white/5">
                                Guarda el evento primero para añadir checklists y subtareas.
                            </p>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-black/40 flex items-center justify-between shrink-0">
                    {isEditing && onDelete ? (
                        <button
                            type="button"
                            onClick={() => { if (confirm('¿Eliminar evento?')) onDelete(event.id); }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-400/10 hover:text-red-300 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                        </button>
                    ) : <div></div>}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-hk-text-muted hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="event-form"
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold bg-hk-accent hover:bg-hk-accent/90 text-white transition-colors disabled:opacity-50"
                        >
                            {isSaving ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                            {isEditing ? 'Guardar Cambios' : 'Crear Evento'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
