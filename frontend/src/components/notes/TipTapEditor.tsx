import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Bold, Italic, List, ListOrdered, Heading2, Strikethrough, Code, Quote, CheckSquare, Settings2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface TipTapEditorProps {
    content: string;
    onChange: (content: string) => void;
}

interface ToolbarButtonProps {
    onClick: () => void;
    disabled?: boolean;
    isActive: boolean;
    title: string;
    children: React.ReactNode;
}

const ToolbarButton = ({ onClick, disabled, isActive, title, children }: ToolbarButtonProps) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`
            p-2 rounded-lg transition-all duration-200 relative group
            ${isActive
                ? 'bg-hk-accent/20 text-hk-accent shadow-[0_0_8px_rgba(107,142,165,0.2)]'
                : 'text-hk-text-muted hover:bg-hk-border hover:text-hk-text'}
            disabled:opacity-30 disabled:cursor-not-allowed
        `}
    >
        {isActive && (
            <span className="absolute inset-0 rounded-lg border border-hk-accent/30 animate-pulse pointer-events-none" />
        )}
        {children}
    </button>
);

export const TipTapEditor = ({ content, onChange }: TipTapEditorProps) => {
    const [showSettings, setShowSettings] = useState(false);
    const [lineHeight, setLineHeight] = useState(() => localStorage.getItem('hk-editor-line-height') || '1.75');
    const [paragraphGap, setParagraphGap] = useState(() => localStorage.getItem('hk-editor-paragraph-gap') || '1em');
    const settingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        document.documentElement.style.setProperty('--editor-line-height', lineHeight);
        localStorage.setItem('hk-editor-line-height', lineHeight);
    }, [lineHeight]);

    useEffect(() => {
        document.documentElement.style.setProperty('--editor-paragraph-gap', paragraphGap);
        localStorage.setItem('hk-editor-paragraph-gap', paragraphGap);
    }, [paragraphGap]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
                setShowSettings(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit,
            TaskList,
            TaskItem.configure({ nested: true }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'notes-editor prose prose-invert max-w-none focus:outline-none min-h-[280px] p-5 text-hk-text leading-relaxed'
            }
        }
    });

    if (!editor) return null;

    return (
        <div className="notes-editor-wrapper flex flex-col rounded-xl overflow-hidden border border-hk-border/60 shadow-lg shadow-black/30">
            {/* Toolbar */}
            <div className="flex items-center gap-1 bg-hk-surface/80 backdrop-blur-sm px-3 py-2 border-b border-hk-border/60 flex-wrap relative z-10">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="Negrita"
                >
                    <Bold className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="Cursiva"
                >
                    <Italic className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    disabled={!editor.can().chain().focus().toggleStrike().run()}
                    isActive={editor.isActive('strike')}
                    title="Tachado"
                >
                    <Strikethrough className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    disabled={!editor.can().chain().focus().toggleCode().run()}
                    isActive={editor.isActive('code')}
                    title="Código"
                >
                    <Code className="w-3.5 h-3.5" />
                </ToolbarButton>

                <span className="w-px h-5 bg-hk-border mx-1 opacity-60" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="Encabezado"
                >
                    <Heading2 className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    title="Cita"
                >
                    <Quote className="w-3.5 h-3.5" />
                </ToolbarButton>

                <span className="w-px h-5 bg-hk-border mx-1 opacity-60" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Lista"
                >
                    <List className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Lista numerada"
                >
                    <ListOrdered className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                    isActive={editor.isActive('taskList')}
                    title="Lista de tareas (Checklist)"
                >
                    <CheckSquare className="w-3.5 h-3.5" />
                </ToolbarButton>

                <div className="ml-auto flex items-center gap-2">
                    <div className="relative" ref={settingsRef}>
                        <button
                            type="button"
                            onClick={() => setShowSettings(!showSettings)}
                            className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'text-hk-accent bg-hk-accent/10' : 'text-hk-text-muted hover:text-hk-text'}`}
                            title="Ajustes de espaciado"
                        >
                            <Settings2 className="w-4 h-4" />
                        </button>

                        {showSettings && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-hk-surface border border-hk-border rounded-xl shadow-xl p-3 z-50 flex flex-col gap-3">
                                <div className="text-xs font-semibold text-hk-text mb-1 uppercase tracking-wider">Espaciado</div>

                                <label className="flex flex-col gap-1.5">
                                    <span className="text-[10px] text-hk-text-muted">Interlineado</span>
                                    <select
                                        value={lineHeight}
                                        onChange={(e) => setLineHeight(e.target.value)}
                                        className="bg-hk-bg border border-hk-border rounded-lg px-2 py-1.5 text-xs text-hk-text outline-none focus:border-hk-accent"
                                    >
                                        <option value="1.25">Compacto (1.25)</option>
                                        <option value="1.5">Ligero (1.5)</option>
                                        <option value="1.75">Normal (1.75)</option>
                                        <option value="2">Holgado (2)</option>
                                    </select>
                                </label>

                                <label className="flex flex-col gap-1.5">
                                    <span className="text-[10px] text-hk-text-muted">Espacio entre párrafos</span>
                                    <select
                                        value={paragraphGap}
                                        onChange={(e) => setParagraphGap(e.target.value)}
                                        className="bg-hk-bg border border-hk-border rounded-lg px-2 py-1.5 text-xs text-hk-text outline-none focus:border-hk-accent"
                                    >
                                        <option value="0.25em">Muy junto</option>
                                        <option value="0.5em">Junto</option>
                                        <option value="1em">Normal</option>
                                        <option value="1.5em">Separado</option>
                                        <option value="2em">Muy separado</option>
                                    </select>
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-[10px] text-hk-text-muted/50 font-mono tracking-widest pl-2 ml-1 border-l border-hk-border/60">
                    {editor.getText().trim() ? editor.getText().trim().split(/\s+/).length : 0} PALABRAS
                </div>
            </div>

            {/* Editor Content */}
            <div className="relative bg-hk-bg/60">
                {/* Decorative left glow line */}
                <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-hk-accent/20 to-transparent pointer-events-none" />
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};
