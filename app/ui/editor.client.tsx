import { useMemo, useState } from "react";
import Highlight from "@tiptap/extension-highlight";
import { renderToMarkdown } from "@tiptap/static-renderer";
import Typography from "@tiptap/extension-typography";
import { type NostrEvent } from "nostr-tools";
import { marked } from "marked";
import {
  type Editor,
  EditorContent,
  type JSONContent,
  useEditor,
  useEditorState,
  type NodeViewRendererProps,
  //type ReactNodeViewRenderer,
} from "@tiptap/react";
import { type Level } from "@tiptap/extension-heading";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { Input } from "~/ui/input";
import Document from "@tiptap/extension-document";
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
} from "lucide-react";
import EditorHeader from "./editor-header";
import { getArticleImage, getArticleTitle } from "applesauce-core/helpers";
import type {
  EventPointer,
  AddressPointer,
  ProfilePointer,
} from "nostr-tools/nip19";
import ComingSoon from "./coming-soon";

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

const MenuBar = ({ editor }: { editor: Editor }) => {
  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor.isActive("bold"),
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
        prev.isH6Active === next.isH6Active
      );
    },
  });

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

const DEFAULT_CONTENT = `
    <p>This document demonstrates the key features available in Markdown formatting.</p>
    
    <h2>Text Formatting</h2>
    <p>You can make text <strong>bold</strong>, <em>italic</em>, or <strong><em>both</em></strong>. You can also add <code>inline code</code> and <s>strikethrough</s> text.</p>
    
    <h2>Lists</h2>
    <h3>Unordered List</h3>
    <ul>
        <li>First item</li>
        <li>Second item</li>
        <li>Third item with <strong>formatting</strong></li>
    </ul>
    
    <h3>Ordered List</h3>
    <ol>
        <li>Step one</li>
        <li>Step two</li>
        <li>Step three</li>
    </ol>
    
    <h2>Links and Code</h2>
    <p>Here's a <a href="https://example.com">link to example.com</a> and some code:</p>
    
    <pre><code>function hello() {
    console.log("Hello, world!");
}</code></pre>
`;

const LOCAL_DRAFT = `draft`;

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
    } catch {}
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
  const extensions = [StarterKit, Highlight, Typography];
  const editor = useEditor({
    immediatelyRender: true,
    shouldRerenderOnTransaction: true,
    extensions,
    content,
    onUpdate: ({ editor }) => {
      if (title) {
        const json = editor.getJSON();
        saveLocalDraft({ title, json, article });
      }
    },
  });

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

    const htmlContent = await markdownToHTML(event.content);
    editor.commands.setContent(htmlContent);
  }

  return (
    <>
      <EditorHeader
        canPublish={title.trim().length > 0}
        onPublish={onPublish}
        onLoad={onLoad}
        onSaveDraft={onSaveDraft}
      />
      <ComingSoon />
      {/*
      <div className="w-full flex flex-col gap-1 p-2">
        <div className="">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Article title"
            placeholder="Your article title"
            className="
            text-5xl
        p-0
        h-14
        focus-visible:ring-[0px]
        font-sans
        rounded-sm
        border-none
        shadow-none
        focus:outline-none
        mb-2
        "
            style={{
              fontSize: "var(--text-5xl)",
              background: "transparent",
            }}
          />
        </div>
        <div className="pb-8">
          {editor ? <MenuBar editor={editor} /> : null}
          <EditorContent className="prose min-h-64" editor={editor} />
        </div>
      </div>
      */}
    </>
  );
};
