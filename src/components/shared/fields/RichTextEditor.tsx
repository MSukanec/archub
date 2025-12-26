import { useCallback, useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
  Bold, 
  Italic, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Youtube as YoutubeIcon,
  Unlink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
}
export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Escribe aquí tu mensaje...',
  minHeight = '150px',
  disabled = false,
  className,
  'data-testid': testId,
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const [youtubeOpen, setYoutubeOpen] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
        link: false, // Disable StarterKit's Link to use our custom config
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer hover:text-primary/80',
        },
      }),
      Youtube.configure({
        width: 480,
        height: 270,
        HTMLAttributes: {
          class: 'rounded-lg my-4',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyNodeClass: 'text-muted-foreground',
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html === '<p></p>'? '': html);
    },
  });
  useEffect(() => {
    if (!editor) return;
    const currentContent = editor.getHTML();
    const normalizedCurrent = currentContent === '<p></p>'? '': currentContent;
    const normalizedValue = value || '';
    
    if (normalizedValue !== normalizedCurrent) {
      editor.commands.setContent(normalizedValue, { emitUpdate: false });
    }
  }, [editor, value]);
  const setLink = useCallback(() => {
    if (!editor) return;
    
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    setLinkUrl('');
    setLinkOpen(false);
  }, [editor, linkUrl]);
  const insertYoutube = useCallback(() => {
    if (!editor || !youtubeUrl) return;
    
    editor.commands.setYoutubeVideo({ src: youtubeUrl });
    setYoutubeUrl('');
    setYoutubeOpen(false);
  }, [editor, youtubeUrl]);
  if (!editor) {
    return null;
  }
  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled: btnDisabled = false,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={btnDisabled || disabled}
      className={cn(
        'h-8 w-8 p-0',
        isActive && 'bg-muted'
      )}
      title={title}
    >
      {children}
    </Button>
  );
  return (
    <div 
      className={cn(
        'rounded-md border border-input bg-background',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      data-testid={testId}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input p-1.5 bg-muted/30">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Negrita"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Cursiva"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Tachado"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px h-6 bg-border mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Lista desordenada"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Lista ordenada"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px h-6 bg-border mx-1" />
        <Popover open={linkOpen} onOpenChange={setLinkOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn('h-8 w-8 p-0', editor.isActive('link') && 'bg-muted')}
              title="Insertar enlace"
              disabled={disabled}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="start">
            <div className="space-y-3">
              <p className="text-sm font-medium">Insertar enlace</p>
              <Input
                placeholder="https://ejemplo.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter'&& setLink()}
                data-testid="input-link-url"
              />
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={setLink}
                  data-testid="button-insert-link"
                >
                  Insertar
                </Button>
                {editor.isActive('link') && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      editor.chain().focus().unsetLink().run();
                      setLinkOpen(false);
                    }}
                    data-testid="button-remove-link"
                  >
                    <Unlink className="h-4 w-4 mr-1" />
                    Quitar
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Popover open={youtubeOpen} onOpenChange={setYoutubeOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Insertar video de YouTube"
              disabled={disabled}
            >
              <YoutubeIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="start">
            <div className="space-y-3">
              <p className="text-sm font-medium">Insertar video de YouTube</p>
              <Input
                placeholder="https://youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter'&& insertYoutube()}
                data-testid="input-youtube-url"
              />
              <Button 
                type="button" 
                size="sm" 
                onClick={insertYoutube}
                data-testid="button-insert-youtube"
              >
                Insertar
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <EditorContent
        editor={editor}
        className={cn(
          'prose prose-sm dark:prose-invert max-w-none p-3',
          '[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[inherit]',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none'
        )}
        style={{ minHeight }}
      />
    </div>
  );
}
