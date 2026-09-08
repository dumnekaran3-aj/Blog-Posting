// Plain post/comment text ke andar kahin bhi URL, email, ya bare domain
// (example.com) mile, to usko clickable <a>/mailto tag mein badal deta hai —
// baaki text jaisa ka taisa (React text node) rehta hai.
//
// Ek fresh RegExp instance har call pe banate hain (module-level shared
// regex nahi) — global-flag wale regex ka .test()/.exec() lastIndex ko
// mutate karta hai, agar isi regex object ko baar-baar (jaise .map() ke
// andar) reuse karte to matches silently skip hone lagte (stateful bug).

// Curated common TLDs — deliberately NOT "any 2+ letter word after a dot",
// because that would false-positive on things like "Node.js" or "React.js"
// in ordinary tech-blog sentences. Extend this list if a legit TLD is
// missing rather than loosening the pattern.
const TLDS = [
  "com", "net", "org", "in", "io", "co", "dev", "app", "info", "biz",
  "edu", "gov", "ai", "tech", "xyz", "me", "us", "uk", "ca", "au", "de",
  "fr", "jp", "cn", "ru", "br", "es", "it", "nl", "se", "no", "ch",
  "online", "store", "blog", "news", "live", "tv",
].join("|");

const LINK_PATTERN = new RegExp(
  `([\\w.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z]{2,}` + // email
  `|https?:\\/\\/[^\\s<]+` + // http(s):// URL
  `|www\\.[^\\s<]+` + // www. URL
  `|(?:[a-zA-Z0-9-]+\\.)+(?:${TLDS})\\b)`, // bare domain, e.g. example.com
  "gi"
);

// URL ke bilkul END mein aane wala punctuation (jaise sentence khatam hone
// wala '.', ya '?)' jaisa closing bracket) zyada chance hai ki sentence ka
// hissa hai, URL ka nahi — isliye link se bahar rakhte hain
const TRAILING_PUNCT = /[.,!?;:'")\]]+$/;

export default function linkify(text) {
  if (!text) return text;

  const nodes = [];
  let lastIndex = 0;
  let match;
  const regex = new RegExp(LINK_PATTERN);

  while ((match = regex.exec(text)) !== null) {
    const matchedText = match[0];
    const startIndex = match.index;

    if (startIndex > lastIndex) {
      nodes.push(text.slice(lastIndex, startIndex));
    }

    const trailingMatch = matchedText.match(TRAILING_PUNCT);
    const trailing = trailingMatch ? trailingMatch[0] : "";
    const cleanUrl = trailing ? matchedText.slice(0, -trailing.length) : matchedText;

    const isEmail = cleanUrl.includes("@") && !/^https?:\/\//i.test(cleanUrl);
    let href;
    if (isEmail) {
      href = `mailto:${cleanUrl}`;
    } else if (cleanUrl.toLowerCase().startsWith("www.")) {
      // "www.example.com" ko browser directly navigate nahi kar sakta bina
      // scheme ke — https:// prepend kar dete hain href ke liye
      href = `https://${cleanUrl}`;
    } else if (/^https?:\/\//i.test(cleanUrl)) {
      href = cleanUrl;
    } else {
      // bare domain match (e.g. "example.com") — no scheme in the text,
      // add one for the href only, display text stays as typed
      href = `https://${cleanUrl}`;
    }

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