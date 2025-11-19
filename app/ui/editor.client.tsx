import { useMemo, useState, useEffect } from "react";
import FileHandler from "@tiptap/extension-file-handler";
import Highlight from "@tiptap/extension-highlight";
import { renderToMarkdown } from "@tiptap/static-renderer";

import Typography from "@tiptap/extension-typography";
import { Placeholder } from "@tiptap/extensions";
import { type NostrEvent } from "nostr-tools";
import { marked } from "marked";
import {
  type Editor,
  EditorContent,
  type JSONContent,
  useEditor,
  useEditorState,
  type NodeViewRendererProps,

} from "@tiptap/react";
import { Plugin } from "@tiptap/pm/state";
import { type Level } from "@tiptap/extension-heading";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { Input } from "~/ui/input";
import Document from "@tiptap/extension-document";
import { getMarkRange, Extension } from "@tiptap/core";
import UserLink from "./nostr/user-link.client";
import { default as BaseNEvent } from "./nostr/nevent.client";
import { default as BaseNAddr } from "./nostr/naddr.client";
import { ToggleGroup, ToggleGroupItem } from "~/ui/toggle-group";
import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Bold,
  Italic,
  Underline,
  Highlighter,
  Strikethrough,
  Link as LinkIcon,
} from "lucide-react";
import EditorHeader from "./editor-header";
import { getArticleImage, getArticleTitle } from "applesauce-core/helpers";
import type {
  EventPointer,
  AddressPointer,
  ProfilePointer,
} from "nostr-tools/nip19";

import { Label } from "./label";
import { Button } from "./button";

type TextValue = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | undefined;

const isHeadingActive = (editor: Editor, level: Level) =>
  editor.isActive("heading", { level });

const CustomDocument = Document.extend({
  content: "heading block*",
});

function NProfile(props: NodeViewRendererProps) {
  const nprofile = props.node.attrs as ProfilePointer;
  return <UserLink {...nprofile} />;
}

function NEvent(props: NodeViewRendererProps) {
  const nevent = props.node.attrs as EventPointer;
  return <BaseNEvent {...nevent} />;
}

function NAddr(props: NodeViewRendererProps) {
  const naddr = props.node.attrs as AddressPointer;
  return <BaseNAddr {...naddr} />;
}

// TODO: for links
//  - avoid opening them. when clicked, instead:
//    - show a floating dialog with the link's URL and text
//    - allow the user to edit the link's URL and text
//
function useHablaEditorState(editor: Editor) {
  return useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor.isActive("bold"),
      isLink: ctx.editor.isActive("link"),
      isItalic: ctx.editor.isActive("italic"),
      isUnderline: ctx.editor.isActive("underline"),
      isStrike: ctx.editor.isActive("strike"),
      isHighlight: ctx.editor.isActive("highlight"),
      isH1Active: isHeadingActive(ctx.editor, 1),
      isH2Active: isHeadingActive(ctx.editor, 2),
      isH3Active: isHeadingActive(ctx.editor, 3),
      isH4Active: isHeadingActive(ctx.editor, 4),
      isH5Active: isHeadingActive(ctx.editor, 5),
      isH6Active: isHeadingActive(ctx.editor, 6),
    }),
    equalityFn: (prev, next) => {
      // A deep-equal function would probably be more maintainable here, but, we use a shallow one to show that it can be customized.
      if (!next) {
        return false;
      }
      return (
        prev.isBold === next.isBold &&
        prev.isItalic === next.isItalic &&
        prev.isUnderline === next.isUnderline &&
        prev.isStrike === next.isStrike &&
        prev.isHighlight === next.isHighlight &&
        prev.isH1Active === next.isH1Active &&
        prev.isH2Active === next.isH2Active &&
        prev.isH3Active === next.isH3Active &&
        prev.isH4Active === next.isH4Active &&
        prev.isH5Active === next.isH5Active &&
        prev.isH6Active === next.isH6Active &&
        prev.isLink === next.isLink
      );
    },
  });
}

const MenuBar = ({ editor }: { editor: Editor }) => {
  const editorState = useHablaEditorState(editor);

  const toggleHeading = (level: Level) =>
    editor.chain().focus().toggleHeading({ level }).run();

  const textValue: TextValue = (() => {
    if (editorState.isH1Active) return "h1";
    if (editorState.isH2Active) return "h2";
    if (editorState.isH3Active) return "h3";
    if (editorState.isH4Active) return "h4";
    if (editorState.isH5Active) return "h5";
    if (editorState.isH6Active) return "h6";
  })();

  return (
    <>
      {editorState && (
        <>
          <FloatingMenu className="floating-menu" editor={editor}>
            <ToggleGroup
              value={
                editorState.isH1Active
                  ? "h1"
                  : editorState.isH2Active
                    ? "h2"
                    : editorState.isH3Active
                      ? "h3"
                      : editorState.isH4Active
                        ? "h4"
                        : editorState.isH5Active
                          ? "h5"
                          : editorState.isH6Active
                            ? "h6"
                            : undefined
              }
              variant="outline"
              type="single"
            >
              <ToggleGroupItem
                value="h1"
                aria-label="Heading 1"
                onClick={() => toggleHeading(1)}
              >
                <Heading1 />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="h2"
                aria-label="Heading 2"
                onClick={() => toggleHeading(2)}
              >
                <Heading2 />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="h3"
                aria-label="Heading 3"
                onClick={() => toggleHeading(3)}
              >
                <Heading3 />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="h4"
                aria-label="Heading 4"
                onClick={() => toggleHeading(4)}
              >
                <Heading4 />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="h5"
                aria-label="Heading 5"
                onClick={() => toggleHeading(5)}
              >
                <Heading5 />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="h6"
                aria-label="Heading 6"
                onClick={() => toggleHeading(6)}
              >
                <Heading6 />
              </ToggleGroupItem>
            </ToggleGroup>
          </FloatingMenu>
          <BubbleMenu className="bg-background p-0 rounded-sm" editor={editor}>
            <ToggleGroup
              variant="outline"
              value={[
                ...(editorState.isBold ? ["bold"] : []),
                ...(editorState.isItalic ? ["italic"] : []),
                ...(editorState.isStrike ? ["strike"] : []),
                ...(editorState.isHighlight ? ["highlight"] : []),
                ...(editorState.isUnderline ? ["underline"] : []),
              ]}
              type="multiple"
            >
              <ToggleGroupItem
                value="bold"
                aria-label="Bold"
                onClick={() => editor.chain().focus().toggleBold().run()}
              >
                <Bold />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="italic"
                aria-label="Italic"
                onClick={() => editor.chain().focus().toggleItalic().run()}
              >
                <Italic />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="underline"
                aria-label="Underline"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
              >
                <Underline />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="strike"
                aria-label="Strikethrough"
                onClick={() => editor.chain().focus().toggleStrike().run()}
              >
                <Strikethrough />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="highlight"
                aria-label="Highlight"
                onClick={() => editor.chain().focus().toggleHighlight().run()}
              >
                <Highlighter />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="link"
                aria-label="Link"
                onClick={() => {
                  const previousUrl = editor.getAttributes('link').href;
                  // If already a link, this might just open the menu (which is already open if active).
                  // If not a link, create one.
                  if (editor.isActive('link')) {
                    editor.chain().focus().unsetLink().run();
                  } else {
                    editor.chain().focus().setLink({ href: '' }).run();
                  }
                }}
              >
                <LinkIcon />
              </ToggleGroupItem>
            </ToggleGroup>
          </BubbleMenu>
        </>
      )}
    </>
  );
};

async function markdownToHTML(markdown: string): Promise<string> {
  return await marked.parse(markdown);
}

function LinkEditor({ editor }: { editor: Editor }) {
  const [text, setText] = useState("");
  const [href, setHref] = useState("");
  const forceHide = useMemo(() => ({ current: false }), []);

  // Sync state with editor selection
  useEffect(() => {
    if (!editor) return;

    // Only update state if the link is active to avoid re-renders on every selection change
    // which can break text selection behavior.
    if (!editor.isActive('link')) {
      forceHide.current = false; // Reset forceHide when not in a link
      return;
    }

    // If we moved to a different link or position, we might want to show it again?
    // For now, let's rely on the fact that if the user clicks somewhere else, isActive might change or not.
    // If they click the SAME link, we want to show it.
    // But if they just Saved, we want to hide it.
    // We reset forceHide in the shouldShow callback? No, that's for reading.

    // Let's reset forceHide if the selection changes significantly?
    // Or just rely on the fact that if they click again, they are likely interacting.
    // But `useEffect` runs on selection change.
    // If we just saved, we set forceHide=true.
    // Then selection might change slightly (cursor move).
    // If we reset it here, it will reopen.
    // So we need a way to distinguish "selection change due to save" vs "user moved cursor".
    // This is hard.

    // Alternative: `shouldShow` is called on every transaction.
    // We can check if the transaction was our "save" transaction?
    // But `shouldShow` doesn't give us the transaction easily.

    // Let's try this:
    // When Save is clicked, we set forceHide=true.
    // We also need to know when to UN-hide.
    // Maybe when the user clicks the link again?
    // Or when they move the cursor out and back in?
    // If they move out, `isActive` becomes false, so we reset `forceHide` (above).
    // If they stay in, it remains hidden.
    // This seems correct for "Save and Close".
    // If they want to edit again, they have to click away and click back, or maybe we add an "Edit" button?
    // But clicking away and back is natural.

    const { state } = editor;
    const { selection } = state;

    const linkMark = editor.getAttributes("link");
    const href = linkMark.href || "";

    // Avoid state updates if values haven't changed (though React does this, explicit check is safer for complex objects)
    // But here we just set strings.
    setHref(href);

    // Get the text content of the link
    const { doc, schema } = state;
    const linkType = schema.marks.link;

    // Use getMarkRange to find the full range of the link
    const $from = selection.$from;
    const range = getMarkRange($from, linkType, editor.getAttributes("link"));

    if (range) {
      const linkText = doc.textBetween(range.from, range.to);
      setText(linkText || href);
    } else {
      setText(href);
    }
  }, [editor.state.selection, editor.state.doc, editor, forceHide]);

  function onHrefChange(e: React.ChangeEvent<HTMLInputElement>) {
    setHref(e.target.value);
  }

  function onTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);
  }

  function onSave() {
    forceHide.current = true;
    if (text.trim().length === 0) {
      const linkText = text || href;
      editor.chain().extendMarkRange("link").insertContent(linkText).setLink({ href }).run();
    } else {
      editor.chain()
        .extendMarkRange("link")
        .command(({ tr, state }) => {
          const { selection } = state;
          const { from, to } = selection;
          tr.insertText(text, from, to);
          tr.addMark(from, from + text.length, state.schema.marks.link.create({ href }));
          return true;
        })
        .run();
    }
  }

  function onUnlink() {
    forceHide.current = true;
    editor.chain().unsetLink().run();
  }

  return (
    <BubbleMenu editor={editor} shouldShow={({ editor }) => {
      if (forceHide.current) return false;
      return editor.isActive('link');
    }}>
      <div className="flex flex-col gap-2 bg-background p-3 rounded-md shadow-md border border-border w-64 font-sans">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Link</Label>
          <Input className="h-8" value={href} onChange={onHrefChange} placeholder="https://..." />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Text</Label>
          <Input className="h-8" value={text} onChange={onTextChange} placeholder="Link text" />
        </div>
        <div className="flex justify-between">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:text-destructive" onClick={onUnlink}>
            Unlink
          </Button>
          <Button size="sm" className="h-7 px-2" onClick={onSave}>
            Save
          </Button>
        </div>
      </div>
    </BubbleMenu>
  );
}

const DEFAULT_CONTENT = `
<h1>An article title</h1>
`;

const LOCAL_DRAFT = `habla:draft`;

function saveLocalDraft({
  title,
  json,
  article,
}: {
  title: string;
  json: JSONContent;
  article?: NostrEvent;
}) {
  localStorage.setItem(
    LOCAL_DRAFT,
    JSON.stringify({ title, json, article }, null, 2),
  );
}

function loadLocalDraft() {
  const item = localStorage.getItem(LOCAL_DRAFT);
  if (item) {
    try {
      const json = JSON.parse(item);
      return json;
    } catch { }
  }
}

function removeLocalDraft() {
  localStorage.removeItem(LOCAL_DRAFT);
}

export default () => {
  const draft = useMemo(() => {
    return loadLocalDraft();
  }, []);
  const [title, setTitle] = useState(draft?.title || "");
  const [article, setArticle] = useState<NostrEvent | undefined>(
    draft?.article,
  );
  const content = useMemo(() => {
    return draft?.json || DEFAULT_CONTENT;
  }, [article?.id]);
  const extensions = [
    CustomDocument,
    StarterKit.configure({
      link: {
        openOnClick: false,
        autolink: true,
        enableClickSelection: true,
        linkOnPaste: true,
        defaultProtocol: "https",
        protocols: ["http", "https"],
      },
    }),
    // Custom extension to escape link on Space
    Extension.create({
      name: 'escapeLinkOnSpace',
      addKeyboardShortcuts() {
        return {
          'Space': () => {
            const { state } = this.editor;
            const { selection } = state;
            const { $from, empty } = selection;

            if (!empty || !this.editor.isActive('link')) {
              return false;
            }

            // Check if we are at the end of the link
            const linkMark = $from.marks().find(m => m.type.name === 'link');
            if (!linkMark) return false;

            // Check if the next character is not a link (meaning we are at the boundary)
            // Or if we are at the end of the node.
            // Actually, if we are inside a link, typing space usually extends it if inclusive is true.
            // If inclusive is false, it should escape.
            // But let's force escape.

            // If we are at the end of the link range
            const range = getMarkRange($from, state.schema.marks.link, linkMark);
            if (range && range.to === $from.pos) {
              // We are at the end.
              // Remove the link mark from the next insertion
              this.editor.chain().unsetMark('link').insertContent(' ').run();
              return true;
            }

            return false;
          }
        }
      },
      addProseMirrorPlugins() {
        return [
          new Plugin({
            appendTransaction: (transactions, oldState, newState) => {
              const { selection } = newState;
              const { $from, empty } = selection;

              if (!empty) return null;

              // Check if we just deleted content
              const isDelete = transactions.some(tr => tr.docChanged && tr.steps.some(step => step.toJSON().stepType === 'replace'));
              if (!isDelete) return null;

              // Check if we are in a link
              const linkType = newState.schema.marks.link;
              const isActive = newState.storedMarks?.some(m => m.type === linkType) || $from.marks().some(m => m.type === linkType);

              if (!isActive) return null;

              // If we are in a link, but the link text is empty (which implies we are not "in" a link node, but have stored marks)
              // OR if we just deleted the last character of a link.

              // If we deleted the last character, `isActive` might be true because of `storedMarks` or inclusive marks.
              // We want to remove it.

              // Logic: If we deleted, and we are now at a position where a link is active, 
              // but we want to stop it if we just emptied it?
              // Actually, if we just deleted, we probably want to stop the link from continuing unless we are in the middle of it.

              // If we are at the boundary of a link after deletion?
              // Or if we just deleted the whole link?

              // Let's try: if storedMarks has link, remove it.
              if (newState.storedMarks?.some(m => m.type === linkType)) {
                return newState.tr.removeStoredMark(linkType);
              }

              return null;
            }
          })
        ]
      }
    }),
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === "heading") {
          return "What’s the title?";
        }

        return "Can you add some further context?";
      },
    }),
    Highlight,
    Typography,
    FileHandler.configure({
      allowedMimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"], // todo: video
      onDrop: (currentEditor: Editor, files: File[], pos: number) => {
        files.forEach((file) => {
          console.log("DROPPED FILE", file);
          //const fileReader = new FileReader();

          //fileReader.readAsDataURL(file);
          //fileReader.onload = () => {
          //  currentEditor
          //    .chain()
          //    .insertContentAt(pos, {
          //      type: "image",
          //      attrs: {
          //        src: fileReader.result,
          //      },
          //    })
          //    .focus()
          //    .run();
          // };
        });
      },
      //onPaste: (currentEditor: Editor, files: File[], htmlContent: string) => {
      //  files.forEach((file) => {
      //    console.log("PASTED FILE", file);
      //  });
      //},
    }),

  ];
  const editor = useEditor({
    immediatelyRender: true,
    shouldRerenderOnTransaction: true,
    extensions,
    content,
    onUpdate: ({ editor }: { editor: Editor }) => {
      if (title) {
        const json = editor.getJSON();
        saveLocalDraft({ title, json, article });
      }
    },
  });
  const editorState = useHablaEditorState(editor);

  function asMarkdown(): string {
    if (!editor) return "";
    const json = editor.getJSON();
    return renderToMarkdown({ content: json, extensions }).trim();
  }

  function onPublish() {
    // todo: double \n line separator
    const markdown = asMarkdown();
    if (markdown) {
      console.log("TODO:PUBLISH", markdown, markdown === article?.content, {
        markdown,
        article: article?.content,
      });
      removeLocalDraft();
    }
  }

  function onSaveDraft() {
    console.log("DRAFT");
  }

  async function onLoad(event: NostrEvent) {
    if (!editor) return;

    setArticle(event);

    const title = getArticleTitle(event);
    if (title) {
      setTitle(title);
    }

    const htmlContent = await markdownToHTML(`# ${title}\n${event.content}`);
    editor.commands.setContent(htmlContent);
  }

  async function onNew() {
    if (!editor) return;

    setArticle(undefined);
    setTitle("");
    editor.commands.clearContent(true);
  }

  return (
    <>
      <EditorHeader
        canPublish={title.trim().length > 0}
        onPublish={onPublish}
        onLoad={onLoad}
        onNew={onNew}
        onSaveDraft={onSaveDraft}
      />
      <div className="relative w-full flex flex-col gap-1 p-2">
        {editor ? <MenuBar editor={editor} /> : null}
        <EditorContent className="prose min-h-64" editor={editor} />
        <LinkEditor editor={editor} />
      </div>
    </>
  );
};
