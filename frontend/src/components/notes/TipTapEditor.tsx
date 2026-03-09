import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Heading2, Strikethrough, Code, Quote } from 'lucide-react';

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
    const editor = useEditor({
        extensions: [StarterKit],
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
            <div className="flex items-center gap-1 bg-hk-surface/80 backdrop-blur-sm px-3 py-2 border-b border-hk-border/60">
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

                <div className="ml-auto text-[10px] text-hk-text-muted/50 font-mono tracking-widest">
                    EDIC.
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
