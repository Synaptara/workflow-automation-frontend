import { createContext, useContext, useEffect, useState } from "react";
import {
  useEditor,
  EditorContent,
  ReactNodeViewRenderer,
  NodeViewWrapper,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Node, mergeAttributes } from "@tiptap/core";
import { getIntegrationIcon, appName } from "../flow/appIcon";
import { humanizeVariable } from "../flow/nodes";

// Context so pills inside TipTap know the trigger app icon, upstream nodes, and step numbers
export const RichInputMetaContext = createContext({
  triggerNode: null,
  upstream: [],
  stepNumbers: {},
});

function resolvePillMeta(rawKey, meta) {
  const clean = String(rawKey || "").trim();
  const [root, ...rest] = clean.split(".");
  const fieldKey = rest.join(".");

  if (root === "trigger") {
    const actionKey = meta?.triggerNode?.data?.actionKey || "webhook";
    const stepNum =
      (meta?.triggerNode && meta?.stepNumbers?.[meta.triggerNode.id]) || 1;
    const friendly = humanizeVariable(fieldKey || clean);
    return {
      actionKey,
      stepNum,
      label: friendly || "Trigger Data",
      tooltip: `${stepNum}. ${appName(actionKey)} → ${friendly} ({{${clean}}})`,
    };
  }

  const upNode = (meta?.upstream || []).find((n) => n.id === root);
  if (upNode) {
    const actionKey = upNode.data?.actionKey || "action";
    const stepNum = meta?.stepNumbers?.[upNode.id] || "";
    const friendly =
      fieldKey === "reply"
        ? "AI Response"
        : fieldKey
          ? humanizeVariable(fieldKey)
          : `${appName(actionKey)} Output`;
    return {
      actionKey,
      stepNum,
      label: friendly,
      tooltip: `${stepNum ? `${stepNum}. ` : ""}${appName(actionKey)} → ${friendly} ({{${clean}}})`,
    };
  }

  return {
    actionKey: "webhook",
    stepNum: null,
    label: humanizeVariable(clean) || clean,
    tooltip: `{{${clean}}}`,
  };
}

// 1. Visual React component for the inline Data Pill
const VariableComponent = ({ node }) => {
  const meta = useContext(RichInputMetaContext);
  const { actionKey, stepNum, label, tooltip } = resolvePillMeta(
    node.attrs.rawKey,
    meta,
  );

  return (
    <NodeViewWrapper
      as="span"
      className="inline-block align-middle mx-0.5 -translate-y-px"
    >
      <span
        title={tooltip}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-accent text-foreground border border-border shadow-sm cursor-default select-none transition-colors hover:border-foreground/40"
      >
        <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
          {getIntegrationIcon(actionKey)}
        </span>
        <span className="truncate max-w-[180px]">
          {stepNum ? `${stepNum}. ` : ""}
          {label}
        </span>
      </span>
    </NodeViewWrapper>
  );
};

// 2. TipTap Extension that manages the atomic pill node
const VariableExtension = Node.create({
  name: "variable",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      rawKey: {
        default: "",
        parseHTML: (el) =>
          el.getAttribute("rawkey") || el.getAttribute("data-rawkey") || "",
        renderHTML: (attrs) => ({ rawkey: attrs.rawKey }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-variable]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-variable": "true" }),
      HTMLAttributes.rawkey || "",
    ];
  },

  // Converts the visual pill back into {{rawKey}} when saving to the backend
  renderText({ node }) {
    return `{{${node.attrs.rawKey}}}`;
  },

  addNodeView() {
    return ReactNodeViewRenderer(VariableComponent);
  },
});

const parseRawToHTML = (val) => {
  if (!val) return "<p></p>";
  const html = String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, p1) => {
      const safeKey = p1.trim().replace(/"/g, "&quot;");
      return `<span data-variable="true" rawkey="${safeKey}"></span>`;
    });
  return `<p>${html.replace(/\n/g, "<br>")}</p>`;
};

// 3. Main Exported Component
export default function RichInput({
  value,
  onChange,
  placeholder,
  isTextArea,
}) {
  const [isFocused, setIsFocused] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bold: false,
        italic: false,
        strike: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      VariableExtension,
    ],
    content: parseRawToHTML(value),
    editorProps: {
      handleKeyDown: (view, event) => {
        if (!isTextArea && event.key === "Enter") return true;
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const newText = ed.getText({ blockSeparator: "\n" });
      onChange(newText);
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  });

  useEffect(() => {
    if (editor && value !== undefined) {
      const currentText = editor.getText({ blockSeparator: "\n" });
      if (value !== currentText) {
        editor.commands.setContent(parseRawToHTML(value));
        editor.commands.focus("end");
      }
    }
  }, [value, editor]);

  return (
    <div
      onClick={() => editor?.commands.focus()}
      className={`relative bg-background border rounded-md transition-colors w-full flex flex-col justify-center overflow-hidden cursor-text ${
        isFocused
          ? "border-foreground ring-1 ring-foreground/20"
          : "border-border hover:border-muted-foreground/50"
      } ${isTextArea ? "min-h-[96px] items-start py-2" : "min-h-[36px] items-start py-1.5"}`}
    >
      <EditorContent
        editor={editor}
        className="w-full h-full px-3 text-[13px] leading-relaxed text-foreground outline-none [&>.ProseMirror]:outline-none [&>.ProseMirror]:min-h-full [&>.ProseMirror]:break-words"
      />
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
