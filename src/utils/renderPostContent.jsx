import linkify from "./linkify";
import { COLOR_HEX_SET } from "./textFormatting";

// Matches, in priority order (longer/more-specific markers first so e.g.
// "**" is never swallowed by the single "*" alternative):
//   {c:#RRGGBB}...{/c}   — color span
//   **...**              — bold
//   __...__              — underline
//   ~~...~~              — strikethrough
//   *...*                — italic
const FORMAT_PATTERN = /(\{c:#[0-9A-Fa-f]{6}\}[^{]+\{\/c\}|\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|\*[^*\n]+\*)/g;

const COLOR_TOKEN = /^\{c:(#[0-9A-Fa-f]{6})\}([\s\S]+)\{\/c\}$/;

export default function renderPostContent(text) {
  if (!text) return text;

  const parts = text.split(FORMAT_PATTERN);
  let key = 0;

  return parts.map((part) => {
    if (!part) return null;

    if (part.startsWith("{c:")) {
      const m = part.match(COLOR_TOKEN);
      if (m) {
        const hex = m[1].toUpperCase();
        const inner = m[2];
        // Re-validate against the fixed preset set — never trust that the
        // hex in stored content is one we generated ourselves (it could
        // have come straight from the API, bypassing the editor UI).
        if (COLOR_HEX_SET.has(hex)) {
          return (
            <span key={key++} style={{ color: hex }}>
              {linkify(inner)}
            </span>
          );
        }
        // Unknown/tampered color — render the inner text plainly rather
        // than the raw token, so it still reads naturally.
        return <span key={key++}>{linkify(inner)}</span>;
      }
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key++}>{linkify(part.slice(2, -2))}</strong>;
    }
    if (part.startsWith("__") && part.endsWith("__")) {
      return <u key={key++}>{linkify(part.slice(2, -2))}</u>;
    }
    if (part.startsWith("~~") && part.endsWith("~~")) {
      return <s key={key++}>{linkify(part.slice(2, -2))}</s>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={key++}>{linkify(part.slice(1, -1))}</em>;
    }

    return <span key={key++}>{linkify(part)}</span>;
  });
}