import { describe, it, expect } from "vitest";
import { ensureBlockSpacing } from "./markdown-spacing";

describe("ensureBlockSpacing", () => {
  describe("blockquotes", () => {
    it("adds blank line after blockquote followed by paragraph", () => {
      const input = `> This is a quote
This paragraph should not be sucked in`;

      const expected = `> This is a quote

This paragraph should not be sucked in`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });

    it("adds blank line after multi-line blockquote followed by paragraph", () => {
      const input = `> Line 1 of quote
> Line 2 of quote
> Line 3 of quote
This paragraph should not be sucked in`;

      const expected = `> Line 1 of quote
> Line 2 of quote
> Line 3 of quote

This paragraph should not be sucked in`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });

    it("preserves existing blank line after blockquote", () => {
      const input = `> This is a quote

This paragraph is already separated`;

      expect(ensureBlockSpacing(input)).toBe(input);
    });

    it("handles blockquote at end of document", () => {
      const input = `> This is a quote at the end`;

      expect(ensureBlockSpacing(input)).toBe(input);
    });

    it("handles nested blockquotes", () => {
      const input = `> Outer quote
> > Nested quote
Next paragraph`;

      const expected = `> Outer quote
> > Nested quote

Next paragraph`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });
  });

  describe("fenced code blocks", () => {
    it("adds blank line after code block followed by paragraph", () => {
      const input = `\`\`\`javascript
const x = 1;
\`\`\`
This paragraph should not be sucked in`;

      const expected = `\`\`\`javascript
const x = 1;
\`\`\`

This paragraph should not be sucked in`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });

    it("preserves existing blank line after code block", () => {
      const input = `\`\`\`javascript
const x = 1;
\`\`\`

This paragraph is already separated`;

      expect(ensureBlockSpacing(input)).toBe(input);
    });

    it("handles code block at end of document", () => {
      const input = `\`\`\`javascript
const x = 1;
\`\`\``;

      expect(ensureBlockSpacing(input)).toBe(input);
    });

    it("handles code block followed by heading", () => {
      const input = `\`\`\`
code
\`\`\`
## Next Section`;

      const expected = `\`\`\`
code
\`\`\`

## Next Section`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });
  });

  describe("lists", () => {
    it("adds blank line after unordered list followed by paragraph", () => {
      const input = `- Item 1
- Item 2
- Item 3
This paragraph should not be sucked in`;

      const expected = `- Item 1
- Item 2
- Item 3

This paragraph should not be sucked in`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });

    it("adds blank line after ordered list followed by paragraph", () => {
      const input = `1. First item
2. Second item
3. Third item
This paragraph should not be sucked in`;

      const expected = `1. First item
2. Second item
3. Third item

This paragraph should not be sucked in`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });

    it("handles list with asterisks", () => {
      const input = `* Item 1
* Item 2
Next paragraph`;

      const expected = `* Item 1
* Item 2

Next paragraph`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });

    it("handles list with plus signs", () => {
      const input = `+ Item 1
+ Item 2
Next paragraph`;

      const expected = `+ Item 1
+ Item 2

Next paragraph`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });

    it("preserves existing blank line after list", () => {
      const input = `- Item 1
- Item 2

This paragraph is already separated`;

      expect(ensureBlockSpacing(input)).toBe(input);
    });

    it("handles list at end of document", () => {
      const input = `- Item 1
- Item 2`;

      expect(ensureBlockSpacing(input)).toBe(input);
    });

    it("handles double-digit numbered lists", () => {
      const input = `10. Tenth item
11. Eleventh item
Next paragraph`;

      const expected = `10. Tenth item
11. Eleventh item

Next paragraph`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });
  });

  describe("horizontal rules", () => {
    it("adds blank line after --- followed by paragraph", () => {
      const input = `Some text
---
This paragraph should not be sucked in`;

      const expected = `Some text
---

This paragraph should not be sucked in`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });

    it("adds blank line after *** followed by paragraph", () => {
      const input = `Some text
***
This paragraph should not be sucked in`;

      const expected = `Some text
***

This paragraph should not be sucked in`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });

    it("adds blank line after ___ followed by paragraph", () => {
      const input = `Some text
___
This paragraph should not be sucked in`;

      const expected = `Some text
___

This paragraph should not be sucked in`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });

    it("preserves existing blank line after horizontal rule", () => {
      const input = `Some text
---

This paragraph is already separated`;

      expect(ensureBlockSpacing(input)).toBe(input);
    });

    it("handles horizontal rule at end of document", () => {
      const input = `Some text
---`;

      expect(ensureBlockSpacing(input)).toBe(input);
    });
  });

  describe("headings", () => {
    it("adds blank line after H1 followed by paragraph", () => {
      const input = `# Main Title
This paragraph should be separated`;

      const expected = `# Main Title

This paragraph should be separated`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });

    it("adds blank line after H2 followed by paragraph", () => {
      const input = `## Section Title
This paragraph should be separated`;

      const expected = `## Section Title

This paragraph should be separated`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });

    it("adds blank line after H6 followed by paragraph", () => {
      const input = `###### Small Heading
This paragraph should be separated`;

      const expected = `###### Small Heading

This paragraph should be separated`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });

    it("preserves existing blank line after heading", () => {
      const input = `# Main Title

This paragraph is already separated`;

      expect(ensureBlockSpacing(input)).toBe(input);
    });

    it("handles heading at end of document", () => {
      const input = `# Final Heading`;

      expect(ensureBlockSpacing(input)).toBe(input);
    });

    it("handles consecutive headings", () => {
      const input = `# Main Title
## Subtitle
Content here`;

      const expected = `# Main Title

## Subtitle

Content here`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });
  });

  describe("mixed content", () => {
    it("handles multiple block elements in sequence", () => {
      const input = `# Article Title
Introduction paragraph.
> A blockquote
Another paragraph.
- List item 1
- List item 2
Final paragraph.`;

      const expected = `# Article Title

Introduction paragraph.
> A blockquote

Another paragraph.
- List item 1
- List item 2

Final paragraph.`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });

    it("handles complex document with all element types", () => {
      const input = `# Main Title
Introduction.
## Code Section
\`\`\`javascript
const x = 1;
\`\`\`
Some explanation.
> Important note
Conclusion.
---
Footer text.`;

      const expected = `# Main Title

Introduction.
## Code Section

\`\`\`javascript
const x = 1;
\`\`\`

Some explanation.
> Important note

Conclusion.
---

Footer text.`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });

    it("preserves properly formatted document", () => {
      const input = `# Title

First paragraph.

> A quote

Second paragraph.

- Item 1
- Item 2

Third paragraph.`;

      expect(ensureBlockSpacing(input)).toBe(input);
    });
  });

  describe("images", () => {
    it("adds blank line after image followed by heading", () => {
      const input = `![Cover image](https://example.com/image.jpg)
## Next Section`;

      const expected = `![Cover image](https://example.com/image.jpg)

## Next Section`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });

    it("adds blank line after image followed by paragraph", () => {
      const input = `![Photo](https://example.com/photo.png)
This is the caption text.`;

      const expected = `![Photo](https://example.com/photo.png)

This is the caption text.`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });

    it("adds blank line after heading followed by image", () => {
      const input = `# Article Title
![Hero image](https://example.com/hero.jpg)
Some text after.`;

      const expected = `# Article Title

![Hero image](https://example.com/hero.jpg)

Some text after.`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });

    it("handles consecutive images", () => {
      const input = `![Image 1](https://example.com/1.jpg)
![Image 2](https://example.com/2.jpg)
![Image 3](https://example.com/3.jpg)
Caption for gallery.`;

      const expected = `![Image 1](https://example.com/1.jpg)

![Image 2](https://example.com/2.jpg)

![Image 3](https://example.com/3.jpg)

Caption for gallery.`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });

    it("preserves existing blank line after image", () => {
      const input = `![Photo](https://example.com/photo.png)

This paragraph is already separated.`;

      expect(ensureBlockSpacing(input)).toBe(input);
    });

    it("handles image at end of document", () => {
      const input = `Some text.

![Final image](https://example.com/end.jpg)`;

      expect(ensureBlockSpacing(input)).toBe(input);
    });

    it("handles image with complex alt text", () => {
      const input = `![A complex [alt] text with (parens) and special chars!](https://example.com/img.jpg)
Next paragraph.`;

      const expected = `![A complex [alt] text with (parens) and special chars!](https://example.com/img.jpg)

Next paragraph.`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });

    it("handles image in complex document", () => {
      const input = `# Article Title
![Hero](https://example.com/hero.jpg)
## Introduction
Some intro text.
![Diagram](https://example.com/diagram.png)
Explanation of diagram.`;

      const expected = `# Article Title

![Hero](https://example.com/hero.jpg)

## Introduction

Some intro text.
![Diagram](https://example.com/diagram.png)

Explanation of diagram.`;

      expect(ensureBlockSpacing(input)).toBe(expected);
    });
  });

  describe("edge cases", () => {
    it("handles empty string", () => {
      expect(ensureBlockSpacing("")).toBe("");
    });

    it("handles single paragraph", () => {
      const input = "Just a simple paragraph.";
      expect(ensureBlockSpacing(input)).toBe(input);
    });

    it("handles multiple blank lines (doesn't add extra)", () => {
      const input = `# Title


Paragraph with extra spacing.`;

      expect(ensureBlockSpacing(input)).toBe(input);
    });

    it("handles inline code (not affected)", () => {
      const input = "Use `const` for constants.";
      expect(ensureBlockSpacing(input)).toBe(input);
    });

    it("handles bold/italic text with asterisks (not treated as list)", () => {
      const input = `**Bold text** and *italic text*.
Next paragraph.`;

      expect(ensureBlockSpacing(input)).toBe(input);
    });

    it("handles horizontal rule lookalikes in text", () => {
      const input = `The score was 3---2.
Next paragraph.`;

      expect(ensureBlockSpacing(input)).toBe(input);
    });
  });
});
