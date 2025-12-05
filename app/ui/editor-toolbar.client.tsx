import type { Level } from "@tiptap/extension-heading";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading,
  List,
  ListOrdered,
  Quote,
  Code,
  Code2,
  Minus,
  Undo,
  Redo,
  Menu,
  Type,
  HardDriveUpload,
  Newspaper,
  FileText,
  Send,
  FilePlus,
  FolderOpen,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "~/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "~/ui/dropdown-menu";
import { Separator } from "~/ui/separator";
import { cn } from "~/lib/utils";

interface EditorToolbarProps {
  editor: Editor;
  onImageClick: () => void;
  onLinkClick: () => void;
  onPublish: () => void;
  onNew: () => void;
  onSaveDraft: () => void;
  onLoad: (ev: any) => void;
  timeline?: any[];
}

function useToolbarState(editor: Editor) {
  return useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor.isActive("bold"),
      isItalic: ctx.editor.isActive("italic"),
      isUnderline: ctx.editor.isActive("underline"),
      isStrike: ctx.editor.isActive("strike"),
      isHighlight: ctx.editor.isActive("highlight"),
      isLink: ctx.editor.isActive("link"),
      isCode: ctx.editor.isActive("code"),
      isBulletList: ctx.editor.isActive("bulletList"),
      isOrderedList: ctx.editor.isActive("orderedList"),
      isBlockquote: ctx.editor.isActive("blockquote"),
      isCodeBlock: ctx.editor.isActive("codeBlock"),
      isH1: ctx.editor.isActive("heading", { level: 1 }),
      isH2: ctx.editor.isActive("heading", { level: 2 }),
      isH3: ctx.editor.isActive("heading", { level: 3 }),
      canUndo: ctx.editor.can().undo(),
      canRedo: ctx.editor.can().redo(),
      currentLevel: (() => {
        for (let i = 1; i <= 6; i++) {
          if (ctx.editor.isActive("heading", { level: i })) return i;
        }
        return 0;
      })(),
    }),
  });
}

export default function EditorToolbar({
  editor,
  onImageClick,
  onLinkClick,
  onPublish,
  onNew,
  onSaveDraft,
  onLoad,
  timeline,
}: EditorToolbarProps) {
  const state = useToolbarState(editor);

  if (!state) return null;

  const setHeading = (level: Level) => {
    editor.chain().focus().toggleHeading({ level }).run();
  };

  const setParagraph = () => {
    editor.chain().focus().setParagraph().run();
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 p-2 w-xs xsm:w-sm sm:w-xl lg:w-2xl mx-auto">
      {/* Group 1: Undo/Redo */}
      <div className="flex items-center">
        <ToggleGroup
          type="multiple"
          variant="outline"
          value={[]}
          className="gap-0"
        >
          <ToggleGroupItem
            value="undo"
            aria-label="Undo"
            size="sm"
            disabled={!state.canUndo}
            onClick={() => editor.chain().focus().undo().run()}
            className={cn("rounded-r-none")}
          >
            <Undo className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="redo"
            aria-label="Redo"
            size="sm"
            disabled={!state.canRedo}
            onClick={() => editor.chain().focus().redo().run()}
            className={cn("rounded-l-none")}
          >
            <Redo className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Group 2: Style (Heading + Text Formatting) */}
      <div className="flex items-center">
        <ToggleGroup
          type="multiple"
          variant="outline"
          value={[
            ...(state.isBold ? ["bold"] : []),
            ...(state.isItalic ? ["italic"] : []),
            ...(state.isUnderline ? ["underline"] : []),
            ...(state.isCode ? ["code"] : []),
          ]}
          className="gap-0"
        >
          {/* Style Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ToggleGroupItem
                value="style"
                aria-label="Style"
                size="sm"
                className={cn("rounded-r-none")}
              >
                <Type className="h-4 w-4" />
              </ToggleGroupItem>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={setParagraph}>
                Paragraph
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHeading(1)}>
                Heading 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHeading(2)}>
                Heading 2
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHeading(3)}>
                Heading 3
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHeading(4)}>
                Heading 4
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHeading(5)}>
                Heading 5
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHeading(6)}>
                Heading 6
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ToggleGroupItem
            value="bold"
            aria-label="Bold"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn("rounded-none")}
          >
            <Bold className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="italic"
            aria-label="Italic"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn("rounded-none")}
          >
            <Italic className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="underline"
            aria-label="Underline"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn("rounded-none")}
          >
            <Underline className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="code"
            aria-label="Inline code"
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn("rounded-l-none")}
          >
            <Code className="h-4 w-4" />
          </ToggleGroupItem>

          {/* Commented out for now */}
          {/* <ToggleGroupItem
            value="strike"
            aria-label="Strikethrough"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn("rounded-none")}
          >
            <Strikethrough className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="highlight"
            aria-label="Highlight"
            size="sm"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={cn("rounded-l-none")}
          >
            <Highlighter className="h-4 w-4" />
          </ToggleGroupItem> */}
        </ToggleGroup>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Group 3: Link/Image/HR */}
      <div className="flex items-center">
        <ToggleGroup
          type="multiple"
          variant="outline"
          value={[...(state.isLink ? ["link"] : [])]}
          className="gap-0"
        >
          <ToggleGroupItem
            value="link"
            aria-label="Insert link"
            size="sm"
            onClick={onLinkClick}
            className={cn("rounded-r-none")}
          >
            <LinkIcon className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="image"
            aria-label="Insert image"
            size="sm"
            onClick={onImageClick}
            className={cn("rounded-none")}
          >
            <ImageIcon className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="hr"
            aria-label="Horizontal rule"
            size="sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className={cn("rounded-l-none")}
          >
            <Minus className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Group 4: Block Elements */}
      <div className="flex items-center">
        <ToggleGroup
          type="multiple"
          variant="outline"
          value={[
            ...(state.isBulletList ? ["bulletList"] : []),
            ...(state.isOrderedList ? ["orderedList"] : []),
            ...(state.isBlockquote ? ["blockquote"] : []),
            ...(state.isCodeBlock ? ["codeBlock"] : []),
          ]}
          className="gap-0"
        >
          <ToggleGroupItem
            value="bulletList"
            aria-label="Bullet list"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn("rounded-r-none")}
          >
            <List className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="orderedList"
            aria-label="Numbered list"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn("rounded-none")}
          >
            <ListOrdered className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="blockquote"
            aria-label="Blockquote"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn("rounded-none")}
          >
            <Quote className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="codeBlock"
            aria-label="Code block"
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn("rounded-l-none")}
          >
            <Code2 className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Group 5: Menu */}
      <div className="flex items-center">
        <ToggleGroup
          type="multiple"
          variant="outline"
          value={[]}
          className="gap-0"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ToggleGroupItem value="menu" aria-label="Menu" size="sm">
                <Menu className="h-4 w-4" />
                <span className="ml-1">Menu</span>
              </ToggleGroupItem>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onPublish}>
                <div className="flex flex-row items-center gap-2">
                  <Send className="size-4" />
                  Publish
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onNew}>
                <div className="flex flex-row items-center gap-2">
                  <FilePlus className="size-4" />
                  New Article
                </div>
              </DropdownMenuItem>
              {/* <DropdownMenuItem disabled onClick={onSaveDraft}>
                <div className="flex flex-row items-center gap-2">
                  <HardDriveUpload className="size-4 text-muted-foreground" />
                  Save Draft
                </div>
              </DropdownMenuItem> */}
              {timeline && timeline.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <div className="flex flex-row items-center gap-2">
                      <FolderOpen className="size-4" />
                      Load Article
                    </div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {timeline.map((article) => (
                      <DropdownMenuItem
                        key={article.id}
                        onClick={() => onLoad(article)}
                      >
                        {article.title || "Untitled"}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </ToggleGroup>
      </div>
    </div>
  );
}
