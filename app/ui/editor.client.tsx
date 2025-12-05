import { useMemo, useState, useEffect, useRef } from "react";
import FileHandler from "@tiptap/extension-file-handler";
import Highlight from "@tiptap/extension-highlight";
import { renderToMarkdown } from "@tiptap/static-renderer";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";

import Typography from "@tiptap/extension-typography";
import { Placeholder } from "@tiptap/extensions";
import { type NostrEvent, kinds } from "nostr-tools";
import { marked } from "marked";
import { useActiveAccount } from "applesauce-react/hooks";
import { useRelays, useTimeline } from "~/hooks/nostr.client";
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
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { Input } from "~/ui/input";
import Document from "@tiptap/extension-document";
import { getMarkRange, Extension } from "@tiptap/core";
import UserLink from "./nostr/user-link.client";
import { default as BaseNEvent } from "./nostr/nevent.client";
import { default as BaseNAddr } from "./nostr/naddr.client";
import EditorHeader from "./editor-header";
import EditorToolbar from "./editor-toolbar.client";
import ImageUploadDialog from "./image-upload-dialog.client";
import ImageDetailsDialog from "./image-details-dialog.client";
import LinkDialog from "./link-dialog.client";
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

async function markdownToHTML(markdown: string): Promise<string> {
  return await marked.parse(markdown);
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
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [initialImageFile, setInitialImageFile] = useState<File | null>(null);

  const [imageDetailsOpen, setImageDetailsOpen] = useState(false);
  const [selectedImageData, setSelectedImageData] = useState<{
    src: string;
    alt: string;
    pos: number;
  } | null>(null);

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkEditData, setLinkEditData] = useState<{
    href: string;
    text: string;
    from: number;
    to: number;
  } | null>(null);

  // Get user's published articles for loading
  const account = useActiveAccount();
  const pubkey = account?.pubkey;
  const relays = useRelays(pubkey || "");
  const { timeline } = useTimeline(
    pubkey ? `${pubkey}-articles` : "no-articles",
    {
      kinds: [kinds.LongFormArticle],
      authors: pubkey ? [pubkey] : [],
    },
    relays,
  );

  const extensions = [
    CustomDocument,
    StarterKit.configure({
      document: false,
      link: false, // Disable link from StarterKit so we can configure it separately
    }),
    Link.configure({
      openOnClick: false, // Prevent default link opening
    }),
    Image.configure({
      inline: false,
      allowBase64: false,
    }),
    Highlight,
    Typography,
    FileHandler.configure({
      allowedMimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
      onDrop: (currentEditor: Editor, files: File[], pos: number) => {
        files.forEach((file) => {
          if (file.type.startsWith("image/")) {
            // Open dialog with preselected image instead of direct upload
            setInitialImageFile(file);
            setImageDialogOpen(true);
          }
        });
      },
      onPaste: (currentEditor: Editor, files: File[]) => {
        files.forEach((file) => {
          if (file.type.startsWith("image/")) {
            // Open dialog with preselected image instead of direct upload
            setInitialImageFile(file);
            setImageDialogOpen(true);
          }
        });
      },
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
    editorProps: {
      handleClick: (view, pos, event) => {
        const target = event.target as HTMLElement;

        // Handle image clicks
        if (target.tagName === "IMG") {
          event.preventDefault();

          // Find the image node at the clicked position
          let imageNode: any = null;
          let imagePos = -1;

          view.state.doc.descendants((node, nodePos) => {
            if (node.type.name === "image" && node.attrs.src) {
              // Check if this position is near the click
              if (nodePos <= pos && nodePos + node.nodeSize >= pos) {
                imageNode = node;
                imagePos = nodePos;
                return false; // Stop searching
              }
            }
          });

          if (imageNode && imagePos >= 0) {
            const src = (imageNode.attrs.src as string) || "";
            const alt = (imageNode.attrs.alt as string) || "";

            console.log("[editor] Image clicked:", { src, alt, pos: imagePos });

            setSelectedImageData({
              src,
              alt,
              pos: imagePos,
            });
            setImageDetailsOpen(true);
            return true;
          }
        }

        // Handle link clicks
        if (target.tagName === "A" || target.closest("a")) {
          event.preventDefault();

          // Extract link data directly
          const $pos = view.state.doc.resolve(pos);
          const linkMark = $pos.marks().find((m) => m.type.name === "link");

          if (linkMark) {
            const range = getMarkRange($pos, view.state.schema.marks.link);
            if (range) {
              const linkText = view.state.doc.textBetween(range.from, range.to);
              console.log("LINKTEXT", { linkMark, linkText });
              const href = linkMark.attrs.href || "";
              console.log(
                "Link clicked - href:",
                href,
                "text:",
                linkText,
                "range:",
                range,
              );
              setLinkEditData({
                href,
                text: linkText,
                from: range.from,
                to: range.to,
              });
            }
          }

          setLinkDialogOpen(true);
          return true;
        }
        return false;
      },
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

    const htmlContent = await markdownToHTML(`# ${title}\n${event.content}`);
    editor.commands.setContent(htmlContent);
  }

  async function onNew() {
    if (!editor) return;

    setArticle(undefined);
    setTitle("");
    editor.commands.clearContent(true);
  }

  function handleImageClick() {
    setInitialImageFile(null); // Clear any previous file
    setImageDialogOpen(true);
  }

  function handleImageUpload(url: string) {
    if (!editor) return;

    // Insert Blossom URL directly
    editor
      .chain()
      .focus()
      .setImage({
        src: url,
        alt: "",
      })
      .run();
  }

  function handleImageAltSave(newAlt: string) {
    if (!editor || !selectedImageData) return;

    console.log("[editor] Saving alt text:", {
      newAlt,
      pos: selectedImageData.pos,
    });

    // Update the image node's alt attribute
    const node = editor.state.doc.nodeAt(selectedImageData.pos);
    console.log("[editor] Node at position:", node);

    if (node && node.type.name === "image") {
      editor
        .chain()
        .focus()
        .command(({ tr, state }) => {
          const nodeAttrs = state.doc.nodeAt(selectedImageData.pos)?.attrs;
          console.log("[editor] Current node attrs:", nodeAttrs);

          tr.setNodeMarkup(selectedImageData.pos, undefined, {
            ...nodeAttrs,
            alt: newAlt,
          });

          console.log("[editor] Alt text updated in transaction");
          return true;
        })
        .run();
    } else {
      console.error(
        "[editor] No image node found at position:",
        selectedImageData.pos,
      );
    }
  }

  function handleLinkClick() {
    setLinkEditData(null); // Clear any existing link data
    setLinkDialogOpen(true);
  }

  return (
    <>
      {editor && (
        <EditorToolbar
          editor={editor}
          onImageClick={handleImageClick}
          onLinkClick={handleLinkClick}
          onPublish={onPublish}
          onNew={onNew}
          onSaveDraft={onSaveDraft}
          onLoad={onLoad}
          timeline={timeline?.map((ev) => ({
            ...ev,
            title: getArticleTitle(ev),
          }))}
        />
      )}
      <div
        className="relative w-full flex flex-col gap-1 p-2"
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === "A" || target.closest("a")) {
            e.preventDefault();
            setLinkDialogOpen(true);
          }
        }}
      >
        <EditorContent
          className="prose min-h-64 w-xs xsm:w-sm sm:w-xl lg:w-2xl"
          editor={editor}
        />
      </div>
      <ImageUploadDialog
        open={imageDialogOpen}
        onOpenChange={(open) => {
          setImageDialogOpen(open);
          if (!open) {
            setInitialImageFile(null); // Clear initial file when dialog closes
          }
        }}
        onUpload={handleImageUpload}
        initialFile={initialImageFile}
      />
      <ImageDetailsDialog
        open={imageDetailsOpen}
        onOpenChange={(open) => {
          setImageDetailsOpen(open);
          if (!open) {
            setSelectedImageData(null); // Clear selected image when dialog closes
          }
        }}
        imageUrl={selectedImageData?.src || ""}
        imageAlt={selectedImageData?.alt || ""}
        onSave={handleImageAltSave}
      />
      <LinkDialog
        editor={editor}
        open={linkDialogOpen}
        onOpenChange={(open) => {
          setLinkDialogOpen(open);
          if (!open) {
            setLinkEditData(null); // Clear link data when dialog closes
          }
        }}
        initialHref={linkEditData?.href}
        initialText={linkEditData?.text}
        initialFrom={linkEditData?.from}
        initialTo={linkEditData?.to}
      />
    </>
  );
};
