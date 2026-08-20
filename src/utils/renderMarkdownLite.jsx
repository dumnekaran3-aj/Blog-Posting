// A tiny, purpose-built parser — NOT a full markdown spec implementation.
// Handles just what our legal page content actually uses: ## / ### headings,
// bold with **, italic-only lines wrapped in *…*, and "* " bullet lists.
// Safe to use here because the content is fixed, client-provided text —
// not user input — so there's no injection risk in keeping this simple.

const renderInline = (text) => {
  // Bold segments (**text**) become <strong>, rest stays plain text
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

export default function renderMarkdownLite(raw) {
  const lines = raw.split("\n");
  const blocks = [];
  let listBuffer = [];

  const flushList = () => {
    if (listBuffer.length) {
      blocks.push({ type: "list", items: [...listBuffer] });
      listBuffer = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }
    if (trimmed.startsWith("### ")) {
      flushList();
      blocks.push({ type: "h3", text: trimmed.slice(4) });
      return;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      blocks.push({ type: "h2", text: trimmed.slice(3) });
      return;
    }
    if (trimmed.startsWith("# ")) {
      flushList();
      blocks.push({ type: "h1", text: trimmed.slice(2) });
      return;
    }
    if (trimmed.startsWith("* ")) {
      listBuffer.push(trimmed.slice(2));
      return;
    }
    // A line that is ONLY italic (e.g. "*Last updated: ...*")
    if (/^\*[^*]+\*$/.test(trimmed)) {
      flushList();
      blocks.push({ type: "italic", text: trimmed.slice(1, -1) });
      return;
    }
    flushList();
    blocks.push({ type: "p", text: trimmed });
  });
  flushList();

  return blocks.map((block, i) => {
    switch (block.type) {
      case "h1":
        return (
          <h1 key={i} className="text-xl font-medium text-textDark mt-6 mb-2">
            {renderInline(block.text)}
          </h1>
        );
      case "h2":
        return (
          <h2 key={i} className="text-lg font-medium text-textDark mt-6 mb-2">
            {renderInline(block.text)}
          </h2>
        );
      case "h3":
        return (
          <h3 key={i} className="text-sm font-medium text-textDark mt-4 mb-1">
            {renderInline(block.text)}
          </h3>
        );
      case "list":
        return (
          <ul key={i} className="list-disc pl-5 text-sm text-textDark space-y-1 mb-3">
            {block.items.map((item, j) => (
              <li key={j}>{renderInline(item)}</li>
            ))}
          </ul>
        );
      case "italic":
        return (
          <p key={i} className="text-xs text-textMuted italic mb-3">
            {renderInline(block.text)}
          </p>
        );
      default:
        return (
          <p key={i} className="text-sm text-textDark leading-relaxed mb-3">
            {renderInline(block.text)}
          </p>
        );
    }
  });
}