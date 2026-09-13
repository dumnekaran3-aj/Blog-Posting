import DOMPurify from "dompurify";
import PostChart from "../components/blog/PostChart";

// Mirrors the backend's whitelist (backend/utils/sanitizeHtml.js) — kept
// deliberately narrow. This is a SECOND check, not the only one: content
// is already sanitized server-side before it's ever saved, this just
// protects against any stored data that predates a rule change, or any
// gap the backend sanitizer missed.
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    "p", "br", "strong", "em", "u", "s", "span",
    "h1", "h2", "h3",
    "ul", "ol", "li",
    "blockquote", "a",
    "table", "thead", "tbody", "tr", "th", "td",
    "img",
    "chart-embed",
  ],
  ALLOWED_ATTR: [
    "href", "target", "rel", "src", "alt", "width", "height",
    "style", "colspan", "rowspan", "data-chart-type", "data-chart-rows",
  ],
  ALLOWED_URI_REGEXP: /^(?:https?:)?\/\//i, // blocks javascript:, data:, etc.
};

export default function renderHtmlPostContent(rawHtml) {
  if (!rawHtml) return null;

  const clean = DOMPurify.sanitize(rawHtml, PURIFY_CONFIG);

  // Walk the sanitized HTML looking for <chart-embed> elements — everything
  // between them gets flushed as one dangerouslySetInnerHTML block, each
  // chart-embed becomes a real <PostChart>.
  const doc = new DOMParser().parseFromString(clean, "text/html");
  const nodes = [];
  let buffer = "";
  let key = 0;

  const flushBuffer = () => {
    if (!buffer) return;
    nodes.push(<div key={key++} dangerouslySetInnerHTML={{ __html: buffer }} />);
    buffer = "";
  };

  doc.body.childNodes.forEach((node) => {
    if (node.nodeType === 1 && node.tagName.toLowerCase() === "chart-embed") {
      flushBuffer();
      let rows = [];
      try {
        rows = JSON.parse(node.getAttribute("data-chart-rows") || "[]");
      } catch {
        rows = [];
      }
      const chartType = node.getAttribute("data-chart-type") || "bar";
      nodes.push(<PostChart key={key++} type={chartType} rows={rows} />);
    } else {
      buffer += node.outerHTML ?? node.textContent ?? "";
    }
  });

  flushBuffer();
  return nodes;
}

// Feed-card preview for HTML-format posts — strips all markup down to
// plain text (charts/tables become a short "[Chart]"/"[Table]" marker,
// same convention as the plain-format preview in renderPostContent.jsx).
// Never dangerouslySetInnerHTML's into a <p> here — a truncated line-clamp
// preview isn't a safe place for arbitrary block-level HTML anyway.
export function htmlToPreviewText(rawHtml) {
  if (!rawHtml) return "";
  const clean = DOMPurify.sanitize(rawHtml, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return clean.replace(/\s+/g, " ").trim();
}