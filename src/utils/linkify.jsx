// Plain post/comment text ke andar kahin bhi http(s):// ya www. se shuru
// hone wala URL mile, to usko clickable <a> tag mein badal deta hai — baaki
// text jaisa ka taisa (React text node) rehta hai.
//
// Ek fresh RegExp instance har call pe banate hain (module-level shared
// regex nahi) — global-flag wale regex ka .test()/.exec() lastIndex ko
// mutate karta hai, agar isi regex object ko baar-baar (jaise .map() ke
// andar) reuse karte to matches silently skip hone lagte (stateful bug).
const URL_PATTERN = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;

// URL ke bilkul END mein aane wala punctuation (jaise sentence khatam hone
// wala '.', ya '?)' jaisa closing bracket) zyada chance hai ki sentence ka
// hissa hai, URL ka nahi — isliye link se bahar rakhte hain
const TRAILING_PUNCT = /[.,!?;:'")\]]+$/;

export default function linkify(text) {
  if (!text) return text;

  const nodes = [];
  let lastIndex = 0;
  let match;
  const regex = new RegExp(URL_PATTERN);

  while ((match = regex.exec(text)) !== null) {
    const matchedText = match[0];
    const startIndex = match.index;

    if (startIndex > lastIndex) {
      nodes.push(text.slice(lastIndex, startIndex));
    }

    const trailingMatch = matchedText.match(TRAILING_PUNCT);
    const trailing = trailingMatch ? trailingMatch[0] : "";
    const cleanUrl = trailing ? matchedText.slice(0, -trailing.length) : matchedText;
    // "www.example.com" ko browser directly navigate nahi kar sakta bina
    // scheme ke — https:// prepend kar dete hain href ke liye (display text same rehta hai)
    const href = cleanUrl.toLowerCase().startsWith("www.") ? `https://${cleanUrl}` : cleanUrl;

    nodes.push(
      <a
        key={startIndex}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline hover:text-primary/80 break-all"
        onClick={(e) => e.stopPropagation()} // parent <Link> (agar ho) ko navigate hone se roke
      >
        {cleanUrl}
      </a>
    );
    if (trailing) nodes.push(trailing);

    lastIndex = startIndex + matchedText.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}