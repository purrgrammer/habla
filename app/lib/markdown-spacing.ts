/**
 * Ensures proper spacing between block-level markdown elements.
 *
 * Many markdown parsers require blank lines between certain block elements
 * to properly separate them. Without these blank lines, content can get
 * "sucked into" the previous element (e.g., a paragraph becoming part of
 * a blockquote).
 *
 * This function post-processes markdown to add blank lines after:
 * - Blockquotes (>)
 * - Fenced code blocks (```)
 * - Lists (-, *, +, 1.)
 * - Horizontal rules (---, ***, ___)
 * - Headings (#)
 * - Images (![alt](url))
 */
export function ensureBlockSpacing(markdown: string): string {
  let result = markdown;

  // 1. Blockquotes: line starting with > followed by non-blockquote, non-blank content
  result = result.replace(/(^>.*\n)(?=(?!>|\n|$))/gm, "$1\n");

  // 2. Fenced code blocks: match entire code block (opening to closing ```) and ensure spacing after
  // This avoids adding a blank line after the opening ```
  result = result.replace(/(^```[^\n]*\n[\s\S]*?^```\n)(?!\n|$)/gm, "$1\n");

  // 3. Lists: ensure blank line after list items when followed by non-list content
  // Match a list item line (starts with -, *, +, or number.) not followed by another list item or blank line
  result = result.replace(
    /(^(?:[-*+]|\d+\.)\s+.*\n)(?=(?![-*+]|\d+\.|\s|\n|$))/gm,
    "$1\n",
  );

  // 4. Horizontal rules: ---, ***, ___ followed by content
  result = result.replace(/(^(?:---|\*\*\*|___)\n)(?!\n|$)/gm, "$1\n");

  // 5. Headings: ensure blank line after headings when followed by content
  result = result.replace(/(^#{1,6}\s+.*\n)(?!\n|$)/gm, "$1\n");

  // 6. Images: ![alt](url) followed by content that isn't a blank line
  // Alt text can contain nested brackets like [text], url can contain any char except )
  result = result.replace(
    /(^!\[(?:[^\[\]]|\[[^\]]*\])*\]\([^)]*\)\n)(?!\n|$)/gm,
    "$1\n",
  );

  return result;
}
