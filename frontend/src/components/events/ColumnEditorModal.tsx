import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import type { BoardColumn } from '../../api/events';

interface ColumnEditorModalProps {
    column?: BoardColumn | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<BoardColumn>) => void;
    onDelete?: (id: number) => void;
    isSaving: boolean;
}

const PRESET_COLORS = [
    '#6b8ea5', // Default Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#3b82f6', // Blue
    '#14b8a6', // Teal
    '#f43f5e', // Rose
    '#64748b', // Slate
    '#a8a29e', // Stone
    '#d97706', // Orange
];

export const ColumnEditorModal = ({ column, isOpen, onClose, onSave, onDelete, isSaving }: ColumnEditorModalProps) => {
    const isEdit = !!column;

    const [name, setName] = useState('');
    const [color, setColor] = useState(PRESET_COLORS[0]);
    const [wipLimit, setWipLimit] = useState(0);

    useEffect(() => {
        if (isOpen) {
            if (column) {
                setName(column.name);
                setColor(column.color || PRESET_COLORS[0]);
                setWipLimit(column.wip_limit || 0);
            } else {
                setName('');
                setColor(PRESET_COLORS[0]);
                setWipLimit(0);
            }
        }
    }, [isOpen, column]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, color, wip_limit: wipLimit });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-hk-surface border border-white/10 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden relative">
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20">
                    <h2 className="text-lg font-bold font-serif text-hk-text">
                        {isEdit ? 'Editar Columna' : 'Nueva Columna'}
                    </h2>
                    <button onClick={onClose} className="p-1 text-hk-text-muted hover:text-white rounded hover:bg-white/5 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5">
                    <form id="col-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-hk-text-muted/60 mb-1.5 font-bold">
                                Nombre de la Columna
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Ej: En Producción..."
                                className="w-full bg-black/20 border border-white/5 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-hk-accent/50 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-wider text-hk-text-muted/60 mb-1.5 font-bold">
                                Límite WIP (En Progreso)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={wipLimit}
                                onChange={e => setWipLimit(parseInt(e.target.value) || 0)}
                                className="w-full bg-black/20 border border-white/5 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-hk-accent/50 transition-colors"
                            />
                            <p className="text-[10px] text-hk-text-muted mt-1 opacity-70">
                                0 = Sin límite. Útil para metodologías ágiles.
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-wider text-hk-text-muted/60 mb-2 font-bold">
                                Color Distintivo
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {PRESET_COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        className={`w-6 h-6 rounded-full transition-all duration-200 ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-offset-hk-surface z-10' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                                        style={{ backgroundColor: c, '--tw-ring-color': c } as React.CSSProperties}
                                    />
                                ))}
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-white/5 bg-black/40 flex items-center justify-between">
                    {isEdit && onDelete ? (
                        <button
                            type="button"
                            onClick={() => {
                                if (confirm('¿Seguro que deseas eliminar esta columna? Los eventos adentro podrían perderse o reasignarse.')) {
                                    onDelete(column!.id);
                                }
                            }}
                            className="p-2 text-hk-text-muted hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                            title="Eliminar columna"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    ) : <div />}

                    <div className="flex items-center gap-3">
                        <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-hk-text-muted hover:text-white transition-colors">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="col-form"
                            disabled={isSaving || !name.trim()}
                            className="flex items-center gap-2 px-4 py-1.5 bg-hk-accent hover:bg-hk-accent/90 text-white text-sm font-bold rounded-lg shadow-lg shadow-hk-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'Guardando...' : <><Save className="w-3.5 h-3.5" /> Guardar</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
