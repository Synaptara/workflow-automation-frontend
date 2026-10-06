import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Node, mergeAttributes } from '@tiptap/core';
import { useEffect, useState } from 'react';

// 1. The visual React component for the Data Pill
const VariableComponent = ({ node }) => {
  return (
    <NodeViewWrapper as="span" className="inline-block align-middle mx-[2px] translate-y-[-1px]">
      <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-mono font-bold bg-[#7c5cff]/15 text-[#7c5cff] border border-[#7c5cff]/30 shadow-sm cursor-default select-none transition-colors hover:bg-[#7c5cff]/25">
        {node.attrs.rawKey}
      </span>
    </NodeViewWrapper>
  );
};

// 2. The TipTap Extension that manages the pill logic
const VariableExtension = Node.create({
  name: 'variable',
  group: 'inline',
  inline: true,
  atom: true, // CRITICAL: Makes the pill act as a single, deletable character

  addAttributes() {
    return { rawKey: { default: '' } };
  },

  parseHTML() {
    return [{ tag: 'span[data-variable]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-variable': true }), HTMLAttributes.rawKey];
  },

  // When extracting data to save to your database, convert it BACK to {{rawKey}}
  renderText({ node }) {
    return `{{${node.attrs.rawKey}}}`;
  },

  addNodeView() {
    return ReactNodeViewRenderer(VariableComponent);
  },
});

// Helper to convert backend database strings into visual pills on load
const parseRawToHTML = (val) => {
  if (!val) return '<p></p>';
  const html = String(val)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/{{(.*?)}}/g, (match, p1) => {
      return `<span data-variable="true" rawkey="${p1}"></span>`;
    });
  return `<p>${html.replace(/\n/g, '<br>')}</p>`;
};

// 3. The Main Exported Component
export default function RichInput({ value, onChange, placeholder, isTextArea }) {
  const [isFocused, setIsFocused] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable standard rich text formatting so it behaves like a normal input
        heading: false, bold: false, italic: false, strike: false, code: false, codeBlock: false, blockquote: false, bulletList: false, orderedList: false, horizontalRule: false,
      }),
      Placeholder.configure({ placeholder, emptyEditorClass: 'is-editor-empty' }),
      VariableExtension,
    ],
    content: parseRawToHTML(value),
    editorProps: {
      handleKeyDown: (view, event) => {
        // Prevent "Enter" key on single-line inputs
        if (!isTextArea && event.key === 'Enter') return true;
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      // Export exactly what the backend needs
      const newText = editor.getText({ blockSeparator: '\n' });
      onChange(newText);
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  });

  // Sync external changes (e.g., when the user clicks the variable injection buttons)
  useEffect(() => {
    if (editor && value !== undefined) {
      const currentText = editor.getText({ blockSeparator: '\n' });
      if (value !== currentText) {
        editor.commands.setContent(parseRawToHTML(value));
        editor.commands.focus('end'); // Keep cursor at the end after inserting a pill
      }
    }
  }, [value, editor]);

  return (
    <div className={`relative bg-canvas border rounded-lg transition-colors shadow-inner w-full flex flex-col justify-center overflow-hidden
      ${isFocused ? 'border-accent' : 'border-border-default'}
      ${isTextArea ? 'min-h-[96px] items-start pt-2.5' : 'h-[42px] items-start pt-[10px]'}
    `}>
      <EditorContent
        editor={editor}
        className="w-full h-full px-3 text-sm text-text-primary outline-none [&>.ProseMirror]:outline-none [&>.ProseMirror]:min-h-full"
      />
      {/* Scope TipTap placeholder styling */}
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #71717a;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
