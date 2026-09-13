import { useState, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import Link from "@tiptap/extension-link";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Palette,
  Link as LinkIcon, Table as TableIcon, Image as ImageIcon, BarChart,
  Heading1, Heading2, List, ListOrdered, Quote,
} from "lucide-react";
import ChartNode from "./ChartNode";
import ChartBuilder from "./ChartBuilder";
import { COLOR_PRESETS } from "../../utils/textFormatting";
import uploadDirectToR2 from "../../utils/uploadDirect";

// Toolbar button — active state reflects the editor's current selection
// (e.g. Bold button lit up while the cursor sits inside bold text).
function ToolbarButton({ onClick, active, title, children, disabled }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded-md border transition-colors disabled:opacity-30 ${
        active
          ? "bg-primary text-white border-primary"
          : "border-borderClr text-textMuted hover:border-primary/40 hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

export default function AdminRichEditor({ content, onChange }) {
  const [colorOpen, setColorOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const colorPopoverRef = useRef(null);
  const chartPopoverRef = useRef(null);
  const linkPopoverRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // We render our own table/image/link setup below with tighter
        // control (whitelisted colors, forced rel on links, etc.) — this
        // just keeps StarterKit's heading/list/blockquote defaults.
        link: false,
      }),
      Underline,
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false, // don't navigate away while editing
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Image,
      Placeholder.configure({ placeholder: "Write your post..." }),
      ChartNode,
    ],
    content: content || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "min-h-[240px] px-3 py-2 outline-none text-sm text-textDark " +
          "[&_h1]:text-xl [&_h1]:font-semibold [&_h1]:mt-2 [&_h1]:mb-1 " +
          "[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-2 [&_h2]:mb-1 " +
          "[&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 " +
          "[&_table]:border-collapse [&_td]:border [&_td]:border-borderClr [&_td]:px-2 [&_td]:py-1 " +
          "[&_th]:border [&_th]:border-borderClr [&_th]:px-2 [&_th]:py-1 [&_th]:bg-bgLight " +
          "[&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:rounded-md " +
          "[&_blockquote]:border-l-2 [&_blockquote]:border-borderClr [&_blockquote]:pl-3 [&_blockquote]:italic",
      },
    },
  });

  // Close popovers on outside click
  useEffect(() => {
    const handler = (e) => {
      if (colorOpen && colorPopoverRef.current && !colorPopoverRef.current.contains(e.target)) setColorOpen(false);
      if (chartOpen && chartPopoverRef.current && !chartPopoverRef.current.contains(e.target)) setChartOpen(false);
      if (linkOpen && linkPopoverRef.current && !linkPopoverRef.current.contains(e.target)) setLinkOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [colorOpen, chartOpen, linkOpen]);

  if (!editor) return null;

  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadDirectToR2(file, file.name, file.type, "posts");
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      console.error("Image upload failed:", err.message);
    } finally {
      setUploading(false);
    }
  };

  const applyLink = () => {
    const url = linkUrl.trim();
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    setLinkUrl("");
    setLinkOpen(false);
  };

  return (
    <div className="border border-borderClr rounded-md overflow-hidden">
      <div className="flex items-center gap-1 flex-wrap p-1.5 border-b border-borderClr bg-bgLight">
        <ToolbarButton title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 size={14} />
        </ToolbarButton>
        <ToolbarButton title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={14} />
        </ToolbarButton>
        <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={14} />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={14} />
        </ToolbarButton>
        <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={14} />
        </ToolbarButton>
        <ToolbarButton title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={14} />
        </ToolbarButton>

        {/* Color */}
        <div className="relative" ref={colorPopoverRef}>
          <ToolbarButton title="Text color" onClick={() => setColorOpen((v) => !v)}>
            <Palette size={14} />
          </ToolbarButton>
          {colorOpen && (
            <div className="absolute z-10 top-full mt-1 left-0 bg-white border border-borderClr rounded-md p-2 flex gap-1.5 shadow-md">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() => {
                    editor.chain().focus().setColor(c.hex).run();
                    setColorOpen(false);
                  }}
                  className="w-6 h-6 rounded-full border border-borderClr hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Link */}
        <div className="relative" ref={linkPopoverRef}>
          <ToolbarButton title="Link" active={editor.isActive("link")} onClick={() => setLinkOpen((v) => !v)}>
            <LinkIcon size={14} />
          </ToolbarButton>
          {linkOpen && (
            <div className="absolute z-10 top-full mt-1 left-0 bg-white border border-borderClr rounded-md p-2 flex gap-1.5 shadow-md w-56">
              <input
                type="text"
                autoFocus
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyLink()}
                className="flex-1 text-xs border border-borderClr rounded px-2 py-1 outline-none focus:border-primary min-w-0"
              />
              <button type="button" onClick={applyLink} className="text-[11px] px-2 py-1 rounded-md bg-primary text-white">
                Set
              </button>
            </div>
          )}
        </div>

        <ToolbarButton
          title="Insert table"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <TableIcon size={14} />
        </ToolbarButton>

        <ToolbarButton title="Insert image" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <ImageIcon size={14} />
        </ToolbarButton>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagePick} className="hidden" />

        {/* Chart */}
        <div className="relative" ref={chartPopoverRef}>
          <ToolbarButton title="Insert chart" onClick={() => setChartOpen((v) => !v)}>
            <BarChart size={14} />
          </ToolbarButton>
          {chartOpen && (
            <div className="absolute z-10 top-full mt-1 left-0">
              <ChartBuilder
                onInsert={(type, rows) => {
                  const cleanRows = rows
                    .filter((r) => r.label.trim() && r.value.toString().trim() !== "")
                    .map((r) => ({ label: r.label.trim(), value: Number(r.value) }));
                  editor.chain().focus().insertContent({ type: "chartEmbed", attrs: { chartType: type, rows: cleanRows } }).run();
                  setChartOpen(false);
                }}
                onClose={() => setChartOpen(false)}
              />
            </div>
          )}
        </div>

        {uploading && <span className="text-[11px] text-textMuted">Uploading image...</span>}
      </div>

      <EditorContent editor={editor} className="bg-white" />
    </div>
  );
}