import { useState, useRef, useEffect } from "react";
import { Bold, Italic, Underline, Strikethrough, Palette } from "lucide-react";
import { applyInlineFormat, applyColorFormat, COLOR_PRESETS } from "../../utils/textFormatting";

// textareaRef: ref to the <textarea> DOM node
// content / onChange: the form's content state + setter
export default function FormatToolbar({ textareaRef, content, onChange }) {
  const [colorOpen, setColorOpen] = useState(false);
  const colorPopoverRef = useRef(null);

  useEffect(() => {
    if (!colorOpen) return;
    const handleClickOutside = (e) => {
      if (colorPopoverRef.current && !colorPopoverRef.current.contains(e.target)) {
        setColorOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [colorOpen]);

  // Applies `updater` (one of applyInlineFormat/applyColorFormat, pre-bound
  // to its extra args) using the textarea's live selection, updates the
  // form state, then restores focus + selection so the user can keep typing
  // right where they left off instead of losing their place in the box.
  const runFormat = (updater) => {
    const el = textareaRef.current;
    if (!el) return;

    const { text, selectionStart, selectionEnd } = updater(
      content,
      el.selectionStart,
      el.selectionEnd
    );

    onChange(text);

    // The textarea's value hasn't re-rendered yet on this tick — wait a
    // frame before restoring selection, otherwise setSelectionRange runs
    // against the OLD value and the cursor lands in the wrong place.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const buttons = [
    { icon: Bold, label: "Bold", format: "bold", className: "font-bold" },
    { icon: Italic, label: "Italic", format: "italic", className: "italic" },
    { icon: Underline, label: "Underline", format: "underline", className: "underline" },
    { icon: Strikethrough, label: "Strikethrough", format: "strike", className: "line-through" },
  ];

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {buttons.map(({ icon: Icon, label, format }) => (
        <button
          key={format}
          type="button"
          title={label}
          onClick={() => runFormat((text, s, e) => applyInlineFormat(text, s, e, format))}
          className="p-1.5 rounded-md border border-borderClr text-textMuted hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Icon size={14} />
        </button>
      ))}

      <div className="relative" ref={colorPopoverRef}>
        <button
          type="button"
          title="Text color"
          onClick={() => setColorOpen((v) => !v)}
          className="p-1.5 rounded-md border border-borderClr text-textMuted hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Palette size={14} />
        </button>

        {colorOpen && (
          <div className="absolute z-10 top-full mt-1 left-0 bg-white border border-borderClr rounded-md p-2 flex gap-1.5 shadow-md">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c.hex}
                type="button"
                title={c.name}
                onClick={() => {
                  runFormat((text, s, e) => applyColorFormat(text, s, e, c.hex));
                  setColorOpen(false);
                }}
                className="w-6 h-6 rounded-full border border-borderClr hover:scale-110 transition-transform"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}