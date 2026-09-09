import linkify from "./linkify";
import { COLOR_HEX_SET } from "./textFormatting";
import PostChart from "../components/blog/PostChart";

// ---- inline formatting (bold/italic/underline/strike/color + links) ----
// Same logic as before, just pulled out into its own function so both
// paragraph blocks AND table cells can use it.
const FORMAT_PATTERN = /(\{c:#[0-9A-Fa-f]{6}\}[^{]+\{\/c\}|\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|\*[^*\n]+\*)/g;
const COLOR_TOKEN = /^\{c:(#[0-9A-Fa-f]{6})\}([\s\S]+)\{\/c\}$/;

function renderInline(text, keyPrefix = "") {
  if (!text) return text;
  const parts = text.split(FORMAT_PATTERN);
  let i = 0;

  return parts.map((part) => {
    if (!part) return null;
    const key = `${keyPrefix}-${i++}`;

    if (part.startsWith("{c:")) {
      const m = part.match(COLOR_TOKEN);
      if (m) {
        const hex = m[1].toUpperCase();
        const inner = m[2];
        if (COLOR_HEX_SET.has(hex)) {
          return (
            <span key={key} style={{ color: hex }}>
              {linkify(inner)}
            </span>
          );
        }
        return <span key={key}>{linkify(inner)}</span>;
      }
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{linkify(part.slice(2, -2))}</strong>;
    }
    if (part.startsWith("__") && part.endsWith("__")) {
      return <u key={key}>{linkify(part.slice(2, -2))}</u>;
    }
    if (part.startsWith("~~") && part.endsWith("~~")) {
      return <s key={key}>{linkify(part.slice(2, -2))}</s>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={key}>{linkify(part.slice(1, -1))}</em>;
    }
    return <span key={key}>{linkify(part)}</span>;
  });
}

// ---- block-level parsing (paragraphs / tables / charts) ----

// Header row: "| a | b | c |" (outer pipes optional)
const TABLE_ROW = /^\s*\|?(.+)\|?\s*$/;
// Separator row: "|---|:--:|--:|" — dashes with optional colons for
// alignment. We don't implement per-column alignment (kept simple), this
// is just used to CONFIRM the previous line was a real table header.
const TABLE_SEPARATOR = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function splitTableRow(line) {
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
  return trimmed.split("|").map((cell) => cell.trim());
}

function renderTable(lines, key) {
  const header = splitTableRow(lines[0]);
  const bodyRows = lines.slice(2).map(splitTableRow);

  return (
    <div key={key} className="my-3 overflow-x-auto">
      <table className="min-w-full text-sm border border-borderClr rounded-md overflow-hidden">
        <thead className="bg-bgLight">
          <tr>
            {header.map((cell, i) => (
              <th key={i} className="border border-borderClr px-3 py-2 text-left font-medium text-textDark">
                {renderInline(cell, `th-${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} className="border border-borderClr px-3 py-2 text-textDark">
                  {renderInline(cell, `td-${r}-${c}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderChart(fenceLines, key) {
  // fenceLines[0] is the opening fence, e.g. "```chart:bar"
  const typeMatch = fenceLines[0].match(/^```chart:(bar|line|pie)\s*$/);
  const type = typeMatch ? typeMatch[1] : "bar";

  const dataLines = fenceLines.slice(1, -1); // drop opening + closing ```
  const rows = dataLines
    .map((line) => {
      const idx = line.lastIndexOf(",");
      if (idx === -1) return null;
      return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
    })
    .filter(Boolean);

  return <PostChart key={key} type={type} rows={rows} />;
}

export default function renderPostContent(text) {
  if (!text) return text;

  const lines = text.split("\n");
  const blocks = [];
  let buffer = [];
  let key = 0;

  const flushBuffer = () => {
    if (buffer.length === 0) return;
    blocks.push(
      <div key={key++} className="whitespace-pre-wrap">
        {renderInline(buffer.join("\n"), `p-${key}`)}
      </div>
    );
    buffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Chart fence block
    if (/^```chart:(bar|line|pie)\s*$/.test(line.trim())) {
      const fenceLines = [line];
      let j = i + 1;
      while (j < lines.length && lines[j].trim() !== "```") {
        fenceLines.push(lines[j]);
        j++;
      }
      fenceLines.push("```");
      flushBuffer();
      blocks.push(renderChart(fenceLines, key++));
      i = j; // skip past the closing fence
      continue;
    }

    // Table block: current line looks like a row AND next line is a
    // valid separator — that combination is what confirms "this is
    // actually a table", not just a sentence with pipe characters in it.
    if (
      TABLE_ROW.test(line) &&
      line.includes("|") &&
      lines[i + 1] !== undefined &&
      TABLE_SEPARATOR.test(lines[i + 1]) &&
      lines[i + 1].includes("-")
    ) {
      const tableLines = [line, lines[i + 1]];
      let j = i + 2;
      while (j < lines.length && lines[j].includes("|") && lines[j].trim() !== "") {
        tableLines.push(lines[j]);
        j++;
      }
      flushBuffer();
      blocks.push(renderTable(tableLines, key++));
      i = j - 1;
      continue;
    }

    buffer.push(line);
  }

  flushBuffer();
  return blocks;
}

// ---- lightweight preview (for feed cards) — inline-only, safe to nest
// inside a <p>. Tables/charts get replaced with a short marker instead of
// being rendered in full (a table doesn't make sense inside a 3-line-clamp
// preview, and <table>/<div> can't legally sit inside a <p> anyway).
export function renderPostPreview(text) {
  if (!text) return text;

  const lines = text.split("\n");
  const nodes = [];
  let buffer = [];
  let key = 0;

  const flushBuffer = () => {
    if (buffer.length === 0) return;
    nodes.push(...renderInline(buffer.join("\n"), `pv-${key++}`));
    buffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^```chart:(bar|line|pie)\s*$/.test(line.trim())) {
      let j = i + 1;
      while (j < lines.length && lines[j].trim() !== "```") j++;
      flushBuffer();
      nodes.push(
        <span key={key++} className="italic text-textMuted">
          {" [Chart] "}
        </span>
      );
      i = j;
      continue;
    }

    if (
      TABLE_ROW.test(line) &&
      line.includes("|") &&
      lines[i + 1] !== undefined &&
      TABLE_SEPARATOR.test(lines[i + 1]) &&
      lines[i + 1].includes("-")
    ) {
      let j = i + 2;
      while (j < lines.length && lines[j].includes("|") && lines[j].trim() !== "") j++;
      flushBuffer();
      nodes.push(
        <span key={key++} className="italic text-textMuted">
          {" [Table] "}
        </span>
      );
      i = j - 1;
      continue;
    }

    buffer.push(line);
  }

  flushBuffer();
  return nodes;
}