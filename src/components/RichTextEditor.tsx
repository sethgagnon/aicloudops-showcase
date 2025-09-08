import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Youtube from '@tiptap/extension-youtube';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Highlight } from '@tiptap/extension-highlight';
import { Underline } from '@tiptap/extension-underline';
import { Placeholder } from '@tiptap/extension-placeholder';
import { createLowlight } from 'lowlight';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Image as ImageIcon,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Video,
  Table as TableIcon,
  Highlighter,
  FileText,
  Sparkles
} from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Configure lowlight for code syntax highlighting
const lowlight = createLowlight();

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export const RichTextEditor = ({ content, onChange, placeholder = "Start writing..." }: RichTextEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, uploading } = useImageUpload();
  const { toast } = useToast();
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [highlightColorOpen, setHighlightColorOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: false, // Disable to use custom Link extension
        codeBlock: false, // Disable to use CodeBlockLowlight
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80 cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Youtube.configure({
        width: 640,
        height: 480,
        ccLanguage: 'en',
        interfaceLanguage: 'en',
        HTMLAttributes: {
          class: 'rounded-lg my-4 max-w-full',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-border rounded-md my-4',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'bg-muted font-semibold',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border p-2 min-w-[100px]',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-muted rounded-lg p-4 my-4 font-mono text-sm overflow-x-auto',
        },
      }),
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'bg-yellow-200 dark:bg-yellow-800 px-1 rounded',
        },
      }),
      Underline,
      Color.configure({
        types: ['textStyle'],
      }),
      TextStyle,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-4 text-foreground prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-code:text-foreground prose-blockquote:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground',
      },
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
    }

    // Reset file input
    event.target.value = '';
  };

  const addImage = () => {
    fileInputRef.current?.click();
  };

  const addLink = () => {
    const url = linkUrl.trim();
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
      setLinkUrl('');
      setLinkDialogOpen(false);
    }
  };

  const removeLink = () => {
    if (editor) {
      editor.chain().focus().unsetLink().run();
    }
  };

  const setColor = (color: string) => {
    if (editor) {
      editor.chain().focus().setColor(color).run();
    }
    setColorPickerOpen(false);
  };

  const setHighlight = (color: string) => {
    if (editor) {
      editor.chain().focus().toggleHighlight({ color }).run();
    }
    setHighlightColorOpen(false);
  };

  const addVideo = () => {
    const url = window.prompt('Enter YouTube URL:');
    if (url && editor) {
      const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (videoIdMatch) {
        editor.chain().focus().setYoutubeVideo({
          src: url,
          width: 640,
          height: 480,
        }).run();
      } else {
        toast({
          title: "Invalid YouTube URL",
          description: "Please enter a valid YouTube URL",
          variant: "destructive",
        });
      }
    }
  };

  const addTable = () => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }
  };

  const deleteTable = () => {
    if (editor) {
      editor.chain().focus().deleteTable().run();
    }
  };

  const addColumn = () => {
    if (editor) {
      editor.chain().focus().addColumnAfter().run();
    }
  };

  const addRow = () => {
    if (editor) {
      editor.chain().focus().addRowAfter().run();
    }
  };

  if (!editor) {
    return null;
  }

  const colorOptions = [
    '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
    '#ff0000', '#ff8800', '#ffff00', '#88ff00', '#00ff00', '#00ff88',
    '#00ffff', '#0088ff', '#0000ff', '#8800ff', '#ff00ff', '#ff0088'
  ];

  const highlightOptions = [
    '#ffff00', '#00ff00', '#ff8800', '#ff0000', '#0088ff', '#8800ff',
    '#ffcccc', '#ccffcc', '#ccccff', '#ffffcc', '#ffccff', '#ccffff'
  ];

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background shadow-sm">
      {/* Main Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/30">
        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0"
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Headings */}
        <Button
          variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className="h-8 w-8 p-0"
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className="h-8 w-8 p-0"
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className="h-8 w-8 p-0"
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Text Formatting */}
        <Button
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="h-8 w-8 p-0"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="h-8 w-8 p-0"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('underline') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className="h-8 w-8 p-0"
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('strike') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className="h-8 w-8 p-0"
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('code') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className="h-8 w-8 p-0"
          title="Inline Code"
        >
          <Code className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists */}
        <Button
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="h-8 w-8 p-0"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="h-8 w-8 p-0"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment */}
        <Button
          variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className="h-8 w-8 p-0"
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className="h-8 w-8 p-0"
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className="h-8 w-8 p-0"
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className="h-8 w-8 p-0"
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Quote & Code Block */}
        <Button
          variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className="h-8 w-8 p-0"
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className="h-8 w-8 p-0"
          title="Code Block"
        >
          <FileText className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Colors & Highlighting */}
        <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Text Color"
            >
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="grid grid-cols-6 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => setColor(color)}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={highlightColorOpen} onOpenChange={setHighlightColorOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={editor.isActive('highlight') ? 'default' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              title="Highlight"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="grid grid-cols-6 gap-2">
              {highlightOptions.map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => setHighlight(color)}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Media */}
        <Button
          variant="ghost"
          size="sm"
          onClick={addImage}
          disabled={uploading}
          className="h-8 w-8 p-0"
          title="Insert Image"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <Popover open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={editor.isActive('link') ? 'default' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              title="Insert Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Link URL</label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addLink();
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={addLink} size="sm" className="flex-1">
                  Add Link
                </Button>
                {editor.isActive('link') && (
                  <Button onClick={removeLink} size="sm" variant="destructive">
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="sm"
          onClick={addVideo}
          className="h-8 w-8 p-0"
          title="Insert YouTube Video"
        >
          <Video className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={addTable}
          className="h-8 w-8 p-0"
          title="Insert Table"
        >
          <TableIcon className="h-4 w-4" />
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Table Toolbar (only shown when in a table) */}
      {editor.isActive('table') && (
        <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={addColumn}
            className="text-xs"
            title="Add Column"
          >
            Add Column
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={addRow}
            className="text-xs"
            title="Add Row"
          >
            Add Row
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={deleteTable}
            className="text-xs text-destructive"
            title="Delete Table"
          >
            Delete Table
          </Button>
        </div>
      )}

      {/* Editor Content */}
      <div className="min-h-[400px] max-h-[800px] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {uploading && (
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            Uploading image...
          </div>
        </div>
      )}
    </div>
  );
};