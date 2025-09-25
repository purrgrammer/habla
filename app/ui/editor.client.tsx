import { useMemo, useState } from "react";
import FileHandler from "@tiptap/extension-file-handler";
import Highlight from "@tiptap/extension-highlight";
import { renderToMarkdown } from "@tiptap/static-renderer";
import Link from "@tiptap/extension-link";
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
import Debug from "./debug";
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
  const editorState = useHablaEditorState(editor);
  const href = editor.getAttributes("link").href;
  const text = "TODO";

  function setHref(ref: string) {}

  function setText(txt: string) {}

  return (
    <div className="flex flex-col gap-4 bg-background p-2 rounded-sm shadow-sm absolute top-5 right-5">
      <Debug>
        {{
          link: editor.getAttributes("link"),
          text,
        }}
      </Debug>
      <div className="flex flex-col items-start gap-1">
        <Label>Link</Label>
        <Input value={href} onChange={(e) => setHref(e.target.value)} />
      </div>
      <div className="flex flex-col items-start gap-1">
        <Label>Text</Label>
        <Input value={text} onChange={(e) => setText(e.target.value)} />
      </div>
    </div>
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
    // Link.configure({
    //   openOnClick: false,
    //   autolink: true,
    //   enableClickSelection: true,
    //   linkOnPaste: true,
    //   defaultProtocol: "https",
    //   protocols: ["http", "https"],
    //   // isAllowedUri: (url, ctx) => {
    //   //   try {
    //   //     // construct URL
    //   //     const parsedUrl = url.includes(":")
    //   //       ? new URL(url)
    //   //       : new URL(`${ctx.defaultProtocol}://${url}`);

    //   //     // use default validation
    //   //     if (!ctx.defaultValidate(parsedUrl.href)) {
    //   //       return false;
    //   //     }

    //   //     // disallowed protocols
    //   //     const disallowedProtocols = ["ftp", "file", "mailto"];
    //   //     const protocol = parsedUrl.protocol.replace(":", "");

    //   //     if (disallowedProtocols.includes(protocol)) {
    //   //       return false;
    //   //     }

    //   //     // only allow protocols specified in ctx.protocols
    //   //     const allowedProtocols = ctx.protocols.map((p) =>
    //   //       typeof p === "string" ? p : p.scheme,
    //   //     );

    //   //     if (!allowedProtocols.includes(protocol)) {
    //   //       return false;
    //   //     }

    //   //     // disallowed domains
    //   //     const disallowedDomains = [
    //   //       "example-phishing.com",
    //   //       "malicious-site.net",
    //   //     ];
    //   //     const domain = parsedUrl.hostname;

    //   //     if (disallowedDomains.includes(domain)) {
    //   //       return false;
    //   //     }

    //   //     // all checks have passed
    //   //     return true;
    //   //   } catch {
    //   //     return false;
    //   //   }
    //   // },
    //   //shouldAutoLink: (url) => {
    //   //  try {
    //   //    // construct URL
    //   //    const parsedUrl = url.includes(":")
    //   //      ? new URL(url)
    //   //      : new URL(`https://${url}`);

    //   //    // only auto-link if the domain is not in the disallowed list
    //   //    const disallowedDomains = [
    //   //      "example-no-autolink.com",
    //   //      "another-no-autolink.com",
    //   //    ];
    //   //    const domain = parsedUrl.hostname;

    //   //    return !disallowedDomains.includes(domain);
    //   //  } catch {
    //   //    return false;
    //   //  }
    //   //},
    // }),
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
        {editorState.isLink ? <LinkEditor editor={editor} /> : null}
      </div>
    </>
  );
};
