import { describe, it, expect, vi } from "vitest";
import { renderToMarkdownWithSpacing } from "./markdown-serializer";
import type { JSONContent } from "@tiptap/core";

describe("renderToMarkdownWithSpacing", () => {
  describe("headings", () => {
    it("renders H1 with proper spacing", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Main Title" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "Some content." }],
          },
        ],
      };

      const expected = `# Main Title

Some content.`;

      expect(renderToMarkdownWithSpacing(content)).toBe(expected);
    });

    it("renders consecutive headings with spacing", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Main Title" }],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Subtitle" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "Content here." }],
          },
        ],
      };

      const expected = `# Main Title

## Subtitle

Content here.`;

      expect(renderToMarkdownWithSpacing(content)).toBe(expected);
    });

    it("renders all heading levels", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "H1" }],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "H2" }],
          },
          {
            type: "heading",
            attrs: { level: 3 },
            content: [{ type: "text", text: "H3" }],
          },
          {
            type: "heading",
            attrs: { level: 6 },
            content: [{ type: "text", text: "H6" }],
          },
        ],
      };

      const expected = `# H1

## H2

### H3

###### H6`;

      expect(renderToMarkdownWithSpacing(content)).toBe(expected);
    });
  });

  describe("blockquotes", () => {
    it("renders blockquote with proper spacing", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "blockquote",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "This is a quote." }],
              },
            ],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "This paragraph follows." }],
          },
        ],
      };

      const expected = `> This is a quote.

This paragraph follows.`;

      expect(renderToMarkdownWithSpacing(content)).toBe(expected);
    });

    it("renders multi-paragraph blockquote", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "blockquote",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "First line." }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "Second line." }],
              },
            ],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "After quote." }],
          },
        ],
      };

      const result = renderToMarkdownWithSpacing(content);
      expect(result).toContain("> First line.");
      expect(result).toContain("> Second line.");
      expect(result).toContain("\n\nAfter quote.");
    });
  });

  describe("code blocks", () => {
    it("renders code block with proper spacing", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "codeBlock",
            attrs: { language: "javascript" },
            content: [{ type: "text", text: "const x = 1;" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "Explanation here." }],
          },
        ],
      };

      const expected = `\`\`\`javascript
const x = 1;
\`\`\`

Explanation here.`;

      expect(renderToMarkdownWithSpacing(content)).toBe(expected);
    });

    it("renders code block without language", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "codeBlock",
            content: [{ type: "text", text: "some code" }],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Next Section" }],
          },
        ],
      };

      const expected = `\`\`\`
some code
\`\`\`

## Next Section`;

      expect(renderToMarkdownWithSpacing(content)).toBe(expected);
    });
  });

  describe("lists", () => {
    it("renders bullet list with proper spacing", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Item 1" }],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Item 2" }],
                  },
                ],
              },
            ],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "After list." }],
          },
        ],
      };

      const expected = `- Item 1
- Item 2

After list.`;

      expect(renderToMarkdownWithSpacing(content)).toBe(expected);
    });

    it("renders ordered list with proper spacing", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "orderedList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "First" }],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Second" }],
                  },
                ],
              },
            ],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "After list." }],
          },
        ],
      };

      const expected = `1. First
2. Second

After list.`;

      expect(renderToMarkdownWithSpacing(content)).toBe(expected);
    });

    it("renders nested bullet lists with proper indentation", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Parent item" }],
                  },
                  {
                    type: "bulletList",
                    content: [
                      {
                        type: "listItem",
                        content: [
                          {
                            type: "paragraph",
                            content: [{ type: "text", text: "Child item 1" }],
                          },
                        ],
                      },
                      {
                        type: "listItem",
                        content: [
                          {
                            type: "paragraph",
                            content: [{ type: "text", text: "Child item 2" }],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Another parent" }],
                  },
                ],
              },
            ],
          },
        ],
      };

      const expected = `- Parent item
  - Child item 1
  - Child item 2
- Another parent`;

      expect(renderToMarkdownWithSpacing(content)).toBe(expected);
    });

    it("renders nested ordered lists with proper indentation", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "orderedList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "First parent" }],
                  },
                  {
                    type: "orderedList",
                    content: [
                      {
                        type: "listItem",
                        content: [
                          {
                            type: "paragraph",
                            content: [{ type: "text", text: "First child" }],
                          },
                        ],
                      },
                      {
                        type: "listItem",
                        content: [
                          {
                            type: "paragraph",
                            content: [{ type: "text", text: "Second child" }],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const expected = `1. First parent
  1. First child
  2. Second child`;

      expect(renderToMarkdownWithSpacing(content)).toBe(expected);
    });

    it("renders deeply nested lists", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Level 1" }],
                  },
                  {
                    type: "bulletList",
                    content: [
                      {
                        type: "listItem",
                        content: [
                          {
                            type: "paragraph",
                            content: [{ type: "text", text: "Level 2" }],
                          },
                          {
                            type: "bulletList",
                            content: [
                              {
                                type: "listItem",
                                content: [
                                  {
                                    type: "paragraph",
                                    content: [
                                      { type: "text", text: "Level 3" },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const expected = `- Level 1
  - Level 2
    - Level 3`;

      expect(renderToMarkdownWithSpacing(content)).toBe(expected);
    });

    it("renders mixed nested lists (bullet inside ordered)", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "orderedList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Ordered item" }],
                  },
                  {
                    type: "bulletList",
                    content: [
                      {
                        type: "listItem",
                        content: [
                          {
                            type: "paragraph",
                            content: [{ type: "text", text: "Bullet child" }],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const expected = `1. Ordered item
  - Bullet child`;

      expect(renderToMarkdownWithSpacing(content)).toBe(expected);
    });
  });

  describe("images", () => {
    it("renders image with proper spacing", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "image",
            attrs: {
              src: "https://example.com/image.jpg",
              alt: "Cover image",
            },
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Next Section" }],
          },
        ],
      };

      const expected = `![Cover image](https://example.com/image.jpg)

## Next Section`;

      expect(renderToMarkdownWithSpacing(content)).toBe(expected);
    });

    it("renders image followed by paragraph", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "image",
            attrs: {
              src: "https://example.com/photo.png",
              alt: "Photo",
            },
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "This is the caption text." }],
          },
        ],
      };

      const expected = `![Photo](https://example.com/photo.png)

This is the caption text.`;

      expect(renderToMarkdownWithSpacing(content)).toBe(expected);
    });

    it("renders consecutive images with spacing", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "image",
            attrs: { src: "https://example.com/1.jpg", alt: "Image 1" },
          },
          {
            type: "image",
            attrs: { src: "https://example.com/2.jpg", alt: "Image 2" },
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "Caption." }],
          },
        ],
      };

      const expected = `![Image 1](https://example.com/1.jpg)

![Image 2](https://example.com/2.jpg)

Caption.`;

      expect(renderToMarkdownWithSpacing(content)).toBe(expected);
    });

    it("renders image with empty alt text", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "image",
            attrs: { src: "https://example.com/image.png" },
          },
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Heading" }],
          },
        ],
      };

      const expected = `![](https://example.com/image.png)

# Heading`;

      expect(renderToMarkdownWithSpacing(content)).toBe(expected);
    });
  });

  describe("horizontal rules", () => {
    it("renders horizontal rule with proper spacing", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Before rule." }],
          },
          { type: "horizontalRule" },
          {
            type: "paragraph",
            content: [{ type: "text", text: "After rule." }],
          },
        ],
      };

      const expected = `Before rule.

---

After rule.`;

      expect(renderToMarkdownWithSpacing(content)).toBe(expected);
    });
  });

  describe("inline formatting", () => {
    it("renders bold text", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "This is " },
              {
                type: "text",
                text: "bold",
                marks: [{ type: "bold" }],
              },
              { type: "text", text: " text." },
            ],
          },
        ],
      };

      expect(renderToMarkdownWithSpacing(content)).toBe(
        "This is **bold** text.",
      );
    });

    it("renders italic text", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "emphasis",
                marks: [{ type: "italic" }],
              },
            ],
          },
        ],
      };

      expect(renderToMarkdownWithSpacing(content)).toBe("*emphasis*");
    });

    it("renders inline code", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Use " },
              {
                type: "text",
                text: "const",
                marks: [{ type: "code" }],
              },
              { type: "text", text: " keyword." },
            ],
          },
        ],
      };

      expect(renderToMarkdownWithSpacing(content)).toBe("Use `const` keyword.");
    });

    it("renders links", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Click here",
                marks: [
                  { type: "link", attrs: { href: "https://example.com" } },
                ],
              },
            ],
          },
        ],
      };

      expect(renderToMarkdownWithSpacing(content)).toBe(
        "[Click here](https://example.com)",
      );
    });
  });

  describe("complex documents", () => {
    it("renders article with mixed content", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Article Title" }],
          },
          {
            type: "image",
            attrs: { src: "https://example.com/hero.jpg", alt: "Hero" },
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Introduction" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "Some intro text." }],
          },
          {
            type: "blockquote",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Important note." }],
              },
            ],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "Conclusion." }],
          },
        ],
      };

      const expected = `# Article Title

![Hero](https://example.com/hero.jpg)

## Introduction

Some intro text.

> Important note.

Conclusion.`;

      expect(renderToMarkdownWithSpacing(content)).toBe(expected);
    });
  });

  describe("nostr nodes", () => {
    it("renders mention with npub", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Hello " },
              {
                type: "mention",
                attrs: {
                  pubkey:
                    "7fa56f5d6962ab1e3cd424e758c3002b8665f7b0d8dcee9fe9e288d7751ac194",
                },
              },
              { type: "text", text: "!" },
            ],
          },
        ],
      };

      const result = renderToMarkdownWithSpacing(content);
      expect(result).toContain("Hello ");
      expect(result).toContain("nostr:npub1");
      expect(result).toContain("!");
    });

    it("renders mention with nprofile when relays provided", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "mention",
                attrs: {
                  pubkey:
                    "7fa56f5d6962ab1e3cd424e758c3002b8665f7b0d8dcee9fe9e288d7751ac194",
                  relays: ["wss://relay.example.com"],
                },
              },
            ],
          },
        ],
      };

      const result = renderToMarkdownWithSpacing(content);
      expect(result).toContain("nostr:nprofile1");
    });

    it("renders nevent", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "nevent",
                attrs: {
                  id: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
                  kind: 1,
                },
              },
            ],
          },
        ],
      };

      const result = renderToMarkdownWithSpacing(content);
      expect(result).toContain("nostr:nevent1");
    });

    it("renders naddr", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "naddr",
                attrs: {
                  identifier: "my-article",
                  kind: 30023,
                  pubkey:
                    "7fa56f5d6962ab1e3cd424e758c3002b8665f7b0d8dcee9fe9e288d7751ac194",
                },
              },
            ],
          },
        ],
      };

      const result = renderToMarkdownWithSpacing(content);
      expect(result).toContain("nostr:naddr1");
    });
  });

  describe("edge cases", () => {
    it("handles empty document", () => {
      const content: JSONContent = {
        type: "doc",
        content: [],
      };

      expect(renderToMarkdownWithSpacing(content)).toBe("");
    });

    it("handles empty paragraph", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "After empty." }],
          },
        ],
      };

      const result = renderToMarkdownWithSpacing(content);
      expect(result).toContain("After empty.");
    });

    it("handles nested marks (bold + italic)", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "bold and italic",
                marks: [{ type: "bold" }, { type: "italic" }],
              },
            ],
          },
        ],
      };

      // Marks are applied in deterministic order: italic inner, bold outer
      expect(renderToMarkdownWithSpacing(content)).toBe(
        "***bold and italic***",
      );
    });

    it("handles nested marks regardless of input order (italic + bold)", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "bold and italic",
                marks: [{ type: "italic" }, { type: "bold" }],
              },
            ],
          },
        ],
      };

      // Same output regardless of mark order in input
      expect(renderToMarkdownWithSpacing(content)).toBe(
        "***bold and italic***",
      );
    });

    it("handles strikethrough", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "deleted",
                marks: [{ type: "strike" }],
              },
            ],
          },
        ],
      };

      expect(renderToMarkdownWithSpacing(content)).toBe("~~deleted~~");
    });

    it("handles underline", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "underlined",
                marks: [{ type: "underline" }],
              },
            ],
          },
        ],
      };

      expect(renderToMarkdownWithSpacing(content)).toBe("<u>underlined</u>");
    });

    it("handles highlight", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "highlighted",
                marks: [{ type: "highlight" }],
              },
            ],
          },
        ],
      };

      expect(renderToMarkdownWithSpacing(content)).toBe("==highlighted==");
    });

    it("handles hard breaks", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Line 1" },
              { type: "hardBreak" },
              { type: "text", text: "Line 2" },
            ],
          },
        ],
      };

      expect(renderToMarkdownWithSpacing(content)).toBe("Line 1\nLine 2");
    });

    it("handles image with title", () => {
      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "image",
            attrs: {
              src: "https://example.com/img.jpg",
              alt: "Alt text",
              title: "Image title",
            },
          },
        ],
      };

      expect(renderToMarkdownWithSpacing(content)).toBe(
        '![Alt text](https://example.com/img.jpg "Image title")',
      );
    });

    it("handles unknown node types gracefully with warning", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Before." }],
          },
          {
            type: "unknownBlockType",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Unknown content" }],
              },
            ],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "After." }],
          },
        ],
      };

      const result = renderToMarkdownWithSpacing(content);

      // Unknown node's content should still be rendered
      expect(result).toContain("Before.");
      expect(result).toContain("Unknown content");
      expect(result).toContain("After.");

      // Warning should be logged
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("unknownBlockType"),
      );

      warnSpy.mockRestore();
    });

    it("handles unknown node without content", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const content: JSONContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Before." }],
          },
          {
            type: "customEmptyNode",
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "After." }],
          },
        ],
      };

      const result = renderToMarkdownWithSpacing(content);

      // Should still render other content
      expect(result).toContain("Before.");
      expect(result).toContain("After.");

      // Warning should be logged
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("customEmptyNode"),
      );

      warnSpy.mockRestore();
    });
  });
});
