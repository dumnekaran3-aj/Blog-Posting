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

// Inserts a starter 3-column table skeleton at the cursor. Uses standard
// markdown pipe-table syntax (matches GitHub/Reddit-style editors) — the
// renderer (renderPostContent.jsx) detects a header row + a "|---|---|"
// separator row to know a table block starts. Selects the first cell's
// placeholder text afterward so the user can type straight over it.
export function insertTableBlock(text, cursorPos) {
  const needsLeadingNewline = cursorPos > 0 && text[cursorPos - 1] !== "\n";
  const skeleton =
    `${needsLeadingNewline ? "\n\n" : ""}` +
    `| Column 1 | Column 2 | Column 3 |\n` +
    `|----------|----------|----------|\n` +
    `| Row 1    | Row 1    | Row 1    |\n` +
    `| Row 2    | Row 2    | Row 2    |\n\n`;

  const newText = text.slice(0, cursorPos) + skeleton + text.slice(cursorPos);

  // Select "Column 1" in the header row so it's ready to type over
  const firstCellStart = cursorPos + skeleton.indexOf("Column 1");
  const firstCellEnd = firstCellStart + "Column 1".length;

  return { text: newText, selectionStart: firstCellStart, selectionEnd: firstCellEnd };
}

// Inserts a fenced chart data block:
//   ```chart:bar
//   Cisco,1000
//   HPE,527.9
//   ```
// `rows` is an array of { label, value } from the chart builder UI.
// CSV-ish on purpose — plain text, no HTML/JS ever enters the stored
// content, so there's nothing here that needs sanitizing on the way in.
export function insertChartBlock(text, cursorPos, chartType, rows) {
  const needsLeadingNewline = cursorPos > 0 && text[cursorPos - 1] !== "\n";
  const csvLines = rows
    .filter((r) => r.label.trim() && r.value.toString().trim() !== "")
    .map((r) => `${r.label.trim().replace(/,/g, "")},${r.value}`)
    .join("\n");

  const block =
    `${needsLeadingNewline ? "\n\n" : ""}` + "```chart:" + chartType + "\n" + csvLines + "\n```\n\n";

  const newText = text.slice(0, cursorPos) + block + text.slice(cursorPos);
  const cursor = cursorPos + block.length;
  return { text: newText, selectionStart: cursor, selectionEnd: cursor };
}