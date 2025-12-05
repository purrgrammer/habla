#!/usr/bin/env python3
"""
Script to patch the editor.client.tsx file with new toolbar integration.
This removes old MenuBar/LinkEditor components and integrates new dialogs.
"""

import re

def patch_editor():
    with open('app/ui/editor.client.tsx', 'r') as f:
        content = f.read()

    # 1. Update imports - add Image, useRef, remove floating menus and unused components
    content = re.sub(
        r'import { useMemo, useState, useEffect } from "react";',
        'import { useMemo, useState, useEffect, useRef } from "react";',
        content
    )

    content = re.sub(
        r'import { renderToMarkdown } from "@tiptap/static-renderer";\n\n',
        'import { renderToMarkdown } from "@tiptap/static-renderer";\nimport Image from "@tiptap/extension-image";\n\n',
        content
    )

    content = re.sub(
        r'import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";',
        'import { BubbleMenu } from "@tiptap/react/menus";',
        content
    )

    # Remove unused imports
    content = re.sub(
        r'import { ToggleGroup, ToggleGroupItem } from "~/ui/toggle-group";\n',
        '',
        content
    )

    content = re.sub(
        r'import {\n  Heading1,\n  Heading2,\n  Heading3,\n  Heading4,\n  Heading5,\n  Heading6,\n  Bold,\n  Italic,\n  Underline,\n  Highlighter,\n  Strikethrough,\n  Link as LinkIcon,\n} from "lucide-react";\n',
        '',
        content
    )

    # Add new imports after EditorHeader
    content = re.sub(
        r'import EditorHeader from "./editor-header";',
        '''import EditorHeader from "./editor-header";
import EditorToolbar from "./editor-toolbar.client";
import ImageUploadDialog from "./image-upload-dialog.client";
import LinkDialog from "./link-dialog.client";''',
        content
    )

    # 2. Remove MenuBar and LinkEditor components (everything between NAddr and markdownToHTML)
    content = re.sub(
        r'(function NAddr\(props: NodeViewRendererProps\) \{[^}]+\})\n\n// TODO: for links.*?(?=\nasync function markdownToHTML)',
        r'\1\n\n',
        content,
        flags=re.DOTALL
    )

    # 3. Remove LinkEditor component (everything between markdownToHTML and DEFAULT_CONTENT)
    content = re.sub(
        r'(async function markdownToHTML.*?\})\n\nfunction LinkEditor.*?(?=\nconst DEFAULT_CONTENT)',
        r'\1\n\n',
        content,
        flags=re.DOTALL
    )

    # 4. Add dialog state after content useMemo
    content = re.sub(
        r'(const content = useMemo\(\(\) => \{\n    return draft\?\.json \|\| DEFAULT_CONTENT;\n  \}, \[article\?\.id\]\);)\n  const extensions',
        r'\1\n  const [imageDialogOpen, setImageDialogOpen] = useState(false);\n  const [linkDialogOpen, setLinkDialogOpen] = useState(false);\n  \n  const extensions',
        content
    )

    # 5. Update StarterKit config
    content = re.sub(
        r'StarterKit\.configure\(\{\n      link: \{[^}]+\},\n    \}\)',
        '''StarterKit.configure({
      document: false,
    }),
    Image.configure({
      inline: true,
      allowBase64: true,
    })''',
        content,
        flags=re.DOTALL
    )

    # 6. Fix FileHandler - uncomment and update the image upload code
    content = re.sub(
        r'FileHandler\.configure\(\{.*?(\n    \}\),)',
        '''FileHandler.configure({
      allowedMimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
      onDrop: (currentEditor: Editor, files: File[], pos: number) => {
        files.forEach((file) => {
          if (file.type.startsWith("image/")) {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = () => {
              currentEditor
                .chain()
                .insertContentAt(pos, {
                  type: "image",
                  attrs: {
                    src: fileReader.result,
                    alt: file.name,
                  },
                })
                .focus()
                .run();
            };
          }
        });
      },
      onPaste: (currentEditor: Editor, files: File[]) => {
        files.forEach((file) => {
          if (file.type.startsWith("image/")) {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = () => {
              currentEditor
                .chain()
                .setImage({
                  src: fileReader.result as string,
                  alt: file.name,
                })
                .focus()
                .run();
            };
          }
        });
      },
    })''',
        content,
        flags=re.DOTALL
    )

    # 7. Add new handlers before return statement
    content = re.sub(
        r'(async function onNew\(\) \{.*?\})\n\n  return \(',
        r'''\1

  function handleImageClick() {
    setImageDialogOpen(true);
  }

  function handleImageUpload(file: File) {
    if (!editor) return;

    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = () => {
      editor
        .chain()
        .focus()
        .setImage({
          src: fileReader.result as string,
          alt: file.name,
        })
        .run();
    };
  }

  function handleLinkClick() {
    setLinkDialogOpen(true);
  }

  return (''',
        content,
        flags=re.DOTALL
    )

    # 8. Replace the return JSX
    content = re.sub(
        r'(<EditorHeader[^/]+/>)\n      <div className="relative w-full flex flex-col gap-1 p-2">\n        \{editor \? <MenuBar editor=\{editor\} /> : null\}\n        <EditorContent className="prose min-h-64" editor=\{editor\} />\n        <LinkEditor editor=\{editor\} />\n      </div>',
        r'''\1
      {editor && (
        <EditorToolbar
          editor={editor}
          onImageClick={handleImageClick}
          onLinkClick={handleLinkClick}
        />
      )}
      <div className="relative w-full flex flex-col gap-1 p-2">
        <EditorContent className="prose min-h-64" editor={editor} />
      </div>
      <ImageUploadDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        onUpload={handleImageUpload}
      />
      <LinkDialog
        editor={editor}
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
      />''',
        content
    )

    with open('app/ui/editor.client.tsx', 'w') as f:
        f.write(content)

    print("✅ Successfully patched editor.client.tsx")

if __name__ == '__main__':
    patch_editor()
