import Link from '@tiptap/extension-link';
import { generateHTML as tiptapGenerateHtml } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';

export const tiptapExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
    blockquote: false,
    dropcursor: false,
    gapcursor: false,
    strike: false,
    horizontalRule: false,
  }),
  Link.configure({
    HTMLAttributes: {
      // Change rel to different value
      // Allow search engines to follow links(remove nofollow)
      rel: 'noopener noreferrer',
      // Remove target entirely so links open in current tab
      target: '_blank',
    },
    openOnClick: false,
  }),
];

export const generateHTML = (doc: Record<string, unknown>) => {
  return tiptapGenerateHtml(doc, tiptapExtensions);
};
