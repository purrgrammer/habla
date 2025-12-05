import { useMemo, useState, useEffect, useRef } from "react";
import FileHandler from "@tiptap/extension-file-handler";
import Highlight from "@tiptap/extension-highlight";
import { renderToMarkdown } from "@tiptap/static-renderer";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";

import Typography from "@tiptap/extension-typography";
import Placeholder from "@tiptap/extension-placeholder";
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
import PublishDialog from "./publish-dialog.client";
import {
  getArticleImage,
  getArticleTitle,
  getArticleSummary,
} from "applesauce-core/helpers";
import type {
  EventPointer,
  AddressPointer,
  ProfilePointer,
} from "nostr-tools/nip19";

import { Label } from "./label";
import { Button } from "./button";
import { PublishArticle, generateIdentifier } from "~/nostr/publish-article";
import { useActionHub } from "applesauce-react/hooks";
import { firstValueFrom } from "rxjs";
import { toast } from "sonner";
import { publishToRelays } from "~/services/publish-article.client";
import { useNavigate } from "react-router";
import { nip19 } from "nostr-tools";
import { useProfile } from "~/hooks/nostr.client";
import store from "~/services/data.client";
import {
  getDraft,
  saveDraft as saveDraftToStorage,
  deleteDraft,
  generateDraftId,
  hasMeaningfulContent,
  type Draft,
} from "~/services/drafts.client";

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

export default () => {
  // Initialize with a draft ID
  const [currentDraftId, setCurrentDraftId] = useState<string>(() => {
    return generateDraftId();
  });

  // Load initial draft
  const initialDraft = useMemo(() => {
    return getDraft(currentDraftId);
  }, [currentDraftId]);

  const [title, setTitle] = useState(initialDraft?.title || "");
  const [article, setArticle] = useState<NostrEvent | undefined>(
    initialDraft?.article,
  );

  const content = useMemo(() => {
    return initialDraft?.json || DEFAULT_CONTENT;
  }, [currentDraftId]);
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
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

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
  const hub = useActionHub();
  const navigate = useNavigate();
  const profile = useProfile(pubkey || "");

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
      const json = editor.getJSON();

      // Extract title from first H1 heading in document
      const firstNode = json.content?.[0];
      const draftTitle =
        firstNode?.type === "heading" && firstNode?.attrs?.level === 1
          ? firstNode.content?.[0]?.text || "Untitled"
          : "Untitled";

      const draft: Draft = {
        id: currentDraftId,
        title: draftTitle,
        json,
        article,
        createdAt: initialDraft?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      saveDraftToStorage(draft);
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

  // Track whether document has a main heading (H1) reactively
  const hasMainHeading = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) return false;
      const json = ctx.editor.getJSON();
      // Check if first content node is a heading level 1
      return (
        json.content?.[0]?.type === "heading" &&
        json.content[0]?.attrs?.level === 1
      );
    },
  });

  function onPublish() {
    const markdown = asMarkdown();
    if (!markdown) {
      toast.error("Cannot publish empty article");
      return;
    }
    if (!hasMainHeading) {
      toast.error("Article must have a main heading (H1)");
      return;
    }
    setPublishDialogOpen(true);
  }

  async function handlePublish({
    title,
    content,
    image,
    summary,
    relays,
    alt,
  }: {
    title: string;
    content: string;
    image?: string;
    summary?: string;
    relays: string[];
    alt?: string;
  }) {
    if (!pubkey) {
      toast.error("Please connect your account to publish");
      return;
    }

    const identifier = article
      ? article.tags.find((t) => t[0] === "d")?.[1]
      : generateIdentifier(title);

    if (!identifier) {
      toast.error("Failed to generate article identifier");
      return;
    }

    // Extract hashtags from content
    const hashtagMatches = content.match(/#(\w+)/g) || [];
    const hashtags = hashtagMatches.map((tag) => tag.slice(1));

    try {
      // Create and sign the event
      const signedEvent = await firstValueFrom(
        hub.exec(PublishArticle, {
          identifier,
          title,
          content,
          image,
          summary,
          hashtags,
          relays,
          existingEvent: article,
          alt,
        }),
      );

      if (!signedEvent) {
        throw new Error("Failed to sign event");
      }

      // Publish to relays with progress tracking
      const publishResult = await publishToRelays(
        signedEvent,
        relays,
        (progress) => {
          // Show error toast for each failed relay
          progress.statuses.forEach((status) => {
            if (status.status === "error" && status.message) {
              toast.error(`Failed to publish to ${status.relay}`, {
                description: status.message,
              });
            }
          });
        },
      );

      // Check if at least one relay succeeded
      if (publishResult.successCount === 0) {
        throw new Error("Failed to publish to any relay");
      }

      // Show success toast
      toast.success("Article published successfully!", {
        description: `Published to ${publishResult.successCount} of ${relays.length} relay${relays.length > 1 ? "s" : ""}`,
      });

      // Update the article state with the published event
      setArticle(signedEvent);

      // Update draft with published article reference
      const draft: Draft = {
        id: currentDraftId,
        title,
        json: editor.getJSON(),
        article: signedEvent,
        createdAt: initialDraft?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      saveDraftToStorage(draft);

      // Navigate to the published article
      // Check if user is a Habla member first
      const members = await store.getMembers();
      const member = members.find((m) => m.pubkey === pubkey);

      let articleUrl: string;
      if (member) {
        // Habla member: /:username/:identifier
        const username = member.nip05;
        articleUrl = `/${username}/${identifier}`;
      } else {
        // Non-member: /u/:nip05 or /u/:npub
        const nip05 = profile?.nip05;
        articleUrl = nip05
          ? `/u/${nip05}/${identifier}`
          : `/u/${nip19.npubEncode(pubkey!)}/${identifier}`;
      }

      navigate(articleUrl);
    } catch (error) {
      console.error("[editor] Failed to publish article:", error);
      toast.error("Failed to publish article", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
      throw error;
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

    // Generate new draft ID and switch to it
    const newDraftId = generateDraftId();
    setCurrentDraftId(newDraftId);

    // Reset editor state
    setArticle(undefined);
    setTitle("");
    editor.commands.setContent(DEFAULT_CONTENT);
  }

  function onLoadDraft(draftId: string) {
    if (!editor) return;

    const draft = getDraft(draftId);
    if (!draft) return;

    // Switch to this draft
    setCurrentDraftId(draftId);
    setTitle(draft.title);
    setArticle(draft.article);
    editor.commands.setContent(draft.json);
  }

  function onDeleteDraft(draftId: string) {
    deleteDraft(draftId);

    // If deleting current draft, create a new one
    if (draftId === currentDraftId) {
      onNew();
    }
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
          canPublish={hasMainHeading}
          onNew={onNew}
          onSaveDraft={onSaveDraft}
          onLoad={onLoad}
          onLoadDraft={onLoadDraft}
          onDeleteDraft={onDeleteDraft}
          currentDraftId={currentDraftId}
          timeline={timeline?.map((ev) => ({
            ...ev,
            title: getArticleTitle(ev),
          }))}
        />
      )}
      <div
        className="relative w-full flex flex-col items-center gap-1 p-2"
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
      <PublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        markdown={asMarkdown()}
        onPublish={handlePublish}
        existingImage={article ? getArticleImage(article) : undefined}
        existingSummary={article ? getArticleSummary(article) : undefined}
        existingIdentifier={
          article ? article.tags.find((t) => t[0] === "d")?.[1] : undefined
        }
      />
    </>
  );
};
