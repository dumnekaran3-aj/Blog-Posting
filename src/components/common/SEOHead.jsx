import { useEffect } from "react";

const SITE_URL = "https://varitywire.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

function setMeta(attr, key, value) {
  if (!value) return null;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  const existed = !!el;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
  return { el, existed };
}

// Sets page-specific SEO tags while mounted. Google's crawler runs JS, so
// these reach Google fine; some non-JS crawlers/link-unfurlers only read
// the static index.html and won't see this — the static defaults in
// index.html cover that baseline case, this overrides them per-page for
// anything that DOES run JS (which is most real-world traffic/tools).
//
// jsonLd (optional): a plain object — gets JSON.stringify'd into a
// <script type="application/ld+json"> tag. Use schema.org "Article" shape
// for blog posts (headline/author/datePublished/image) — this is what
// Google's AI Overviews and similar systems actually parse to understand
// page content, more reliably than plain meta tags.
export default function SEOHead({ title, description, keywords, image, url, type = "website", jsonLd }) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) document.title = title;

    const fullImage = image
      ? image.startsWith("http")
        ? image
        : `${SITE_URL}${image}`
      : DEFAULT_IMAGE;
    const fullUrl = url ? `${SITE_URL}${url}` : window.location.href;

    const tracked = [
      setMeta("name", "description", description),
      setMeta("name", "keywords", keywords),
      setMeta("property", "og:title", title),
      setMeta("property", "og:description", description),
      setMeta("property", "og:image", fullImage),
      setMeta("property", "og:url", fullUrl),
      setMeta("property", "og:type", type),
      setMeta("name", "twitter:title", title),
      setMeta("name", "twitter:description", description),
      setMeta("name", "twitter:image", fullImage),
    ].filter(Boolean);

    // Canonical link — tells Google which URL is the "real" one for this
    // content, avoids duplicate-content confusion (e.g. trailing slashes,
    // query params).
    let canonical = document.querySelector('link[rel="canonical"]');
    const canonicalExisted = !!canonical;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", fullUrl);

    let jsonLdScript = null;
    if (jsonLd) {
      jsonLdScript = document.createElement("script");
      jsonLdScript.type = "application/ld+json";
      jsonLdScript.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(jsonLdScript);
    }

    return () => {
      document.title = prevTitle;
      // Only remove tags THIS component created (not ones that already
      // existed in index.html as static defaults) — leaves the static
      // baseline intact for whatever page mounts next, before its own
      // SEOHead (if any) sets its own values.
      tracked.forEach(({ el, existed }) => {
        if (!existed) el.remove();
      });
      if (!canonicalExisted) canonical.remove();
      if (jsonLdScript) jsonLdScript.remove();
    };
  }, [title, description, keywords, image, url, type, jsonLd]);

  return null;
}