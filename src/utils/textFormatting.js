// Single source of truth for the 7 preset text colors — used by the
// editor's color swatches AND by the renderer's whitelist check. Colors
// are intentionally NOT freeform (no custom hex input) — this means a
// crafted API request can never smuggle arbitrary CSS into rendered posts,
// since the renderer only ever accepts a hex value that's in this exact set.
export const COLOR_PRESETS = [
  { name: "Red", hex: "#DC2626" },
  { name: "Orange", hex: "#EA580C" },
  { name: "Gold", hex: "#CA8A04" },
  { name: "Green", hex: "#16A34A" },
  { name: "Blue", hex: "#2563EB" },
  { name: "Purple", hex: "#9333EA" },
  { name: "Black", hex: "#0F172A" },
];

export const COLOR_HEX_SET = new Set(COLOR_PRESETS.map((c) => c.hex.toUpperCase()));

// Marker pairs for each format — matched 1:1 with renderPostContent.jsx's
// parser, so if you change one you MUST change the other.
const MARKERS = {
  bold: ["**", "**"],
  italic: ["*", "*"],
  underline: ["__", "__"],
  strike: ["~~", "~~"],
};

// Wraps (or unwraps, if already wrapped — toggle behavior) the selected
// substring of `text` between selectionStart/selectionEnd with the given
// format's markers. Returns the new full text plus where the selection
// should land afterward, so the caller can restore focus/selection on the
// textarea and the user can keep typing without hunting for their cursor.
export function applyInlineFormat(text, selectionStart, selectionEnd, format) {
  const [open, close] = MARKERS[format];
  const selected = text.slice(selectionStart, selectionEnd);

  if (!selected) {
    // Nothing selected — insert an empty pair and place the cursor between
    // them, e.g. clicking Bold with no selection gives "****" with the
    // cursor in the middle, ready to type.
    const inserted = open + close;
    const newText = text.slice(0, selectionStart) + inserted + text.slice(selectionStart);
    const cursor = selectionStart + open.length;
    return { text: newText, selectionStart: cursor, selectionEnd: cursor };
  }

  // Toggle off if the selection is already exactly wrapped
  const before = text.slice(selectionStart - open.length, selectionStart);
  const after = text.slice(selectionEnd, selectionEnd + close.length);
  if (before === open && after === close) {
    const newText =
      text.slice(0, selectionStart - open.length) + selected + text.slice(selectionEnd + close.length);
    return {
      text: newText,
      selectionStart: selectionStart - open.length,
      selectionEnd: selectionEnd - open.length,
    };
  }

  const newText = text.slice(0, selectionStart) + open + selected + close + text.slice(selectionEnd);
  return {
    text: newText,
    selectionStart: selectionStart + open.length,
    selectionEnd: selectionEnd + open.length + selected.length,
  };
}

// Color works the same way but the "marker" is a token that carries the
// hex value, so it can't reuse the fixed MARKERS pairs above.
export function applyColorFormat(text, selectionStart, selectionEnd, hex) {
  const selected = text.slice(selectionStart, selectionEnd);
  const open = `{c:${hex}}`;
  const close = `{/c}`;

  if (!selected) {
    const inserted = open + close;
    const newText = text.slice(0, selectionStart) + inserted + text.slice(selectionStart);
    const cursor = selectionStart + open.length;
    return { text: newText, selectionStart: cursor, selectionEnd: cursor };
  }

  const newText = text.slice(0, selectionStart) + open + selected + close + text.slice(selectionEnd);
  return {
    text: newText,
    selectionStart: selectionStart + open.length,
    selectionEnd: selectionEnd + open.length + selected.length,
  };
}