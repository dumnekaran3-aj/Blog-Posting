// Vercel serverless function — serves post pages to CRAWLERS with the real
// per-post <title>/<meta>/canonical already in the HTML.
//
// WHY: the site is a client-side React app. The browser sets each post's
// title/description via SEOHead *after* JS runs, but the HTML a crawler first
// receives is the generic index.html ("VarityWire — discover, explore..."),
// and if Google's JS rendering is late or fails, that generic version is what
// gets indexed. WhatsApp / LinkedIn / Facebook previews never run JS at all.
//
// HOW: vercel.json rewrites /blog/:slug and /news/:slug to this function ONLY
// when the User-Agent looks like a crawler or link-preview bot. Normal
// visitors never touch it (zero risk to the real site). The function takes
// the normal built index.html, swaps in the post's meta tags (from the
// backend's read-only /seo/post/:slug endpoint) and returns it. The React app
// still loads and runs as usual afterwards — this only changes <head>.
//
// It also issues a real 301 when a post is requested under the wrong prefix
// (a news post at /blog/..., or the reverse).

const SITE_URL = 'https://www.varitywire.com';
const BACKEND = (process.env.BACKEND_URL || 'https://vritywire-backend.onrender.com').replace(/\/$/, '');
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
const TEMPLATE_TTL_MS = 10 * 60 * 1000;

let templateCache = { html: null, at: 0 };

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const postPath = (post) => `/${post.postType === 'news' ? 'news' : 'blog'}/${post.slug}`;

async function getTemplate(req) {
  if (templateCache.html && Date.now() - templateCache.at < TEMPLATE_TTL_MS) {
    return templateCache.html;
  }
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  // /index.html is a real static file, so it is served directly (static files
  // win over the catch-all rewrite) — no loop back into this function.
  const r = await fetch(`${proto}://${host}/index.html`, { signal: AbortSignal.timeout(6000) });
  if (!r.ok) throw new Error(`template fetch failed: ${r.status}`);
  const html = await r.text();
  templateCache = { html, at: Date.now() };
  return html;
}

// Replace a tag if the template has it, otherwise add it before </head>.
// Function replacers on purpose: post text containing "$&" or "$1" (e.g.
// "$100 million") must NOT be treated as regex replacement patterns.
function setTag(html, re, tag) {
  return re.test(html)
    ? html.replace(re, () => tag)
    : html.replace('</head>', () => `    ${tag}\n  </head>`);
}

function injectMeta(html, post) {
  const title = post.metaTitle || `${post.title} | VarityWire`;
  const description = post.description || '';
  const url = `${SITE_URL}${postPath(post)}`;
  const image = post.image
    ? post.image.startsWith('http') ? post.image : `${SITE_URL}${post.image}`
    : DEFAULT_IMAGE;

  const meta = (attr, key) => new RegExp(`<meta\\s+${attr}="${key}"[^>]*>`, 'i');
  const tag = (attr, key, value) => `<meta ${attr}="${key}" content="${esc(value)}" />`;

  let out = html;
  out = setTag(out, /<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`);
  if (description) out = setTag(out, meta('name', 'description'), tag('name', 'description', description));
  if (post.metaKeywords) out = setTag(out, meta('name', 'keywords'), tag('name', 'keywords', post.metaKeywords));
  out = setTag(out, meta('property', 'og:title'), tag('property', 'og:title', title));
  if (description) out = setTag(out, meta('property', 'og:description'), tag('property', 'og:description', description));
  out = setTag(out, meta('property', 'og:image'), tag('property', 'og:image', image));
  out = setTag(out, meta('property', 'og:url'), tag('property', 'og:url', url));
  out = setTag(out, meta('property', 'og:type'), tag('property', 'og:type', 'article'));
  out = setTag(out, meta('name', 'twitter:title'), tag('name', 'twitter:title', title));
  if (description) out = setTag(out, meta('name', 'twitter:description'), tag('name', 'twitter:description', description));
  out = setTag(out, meta('name', 'twitter:image'), tag('name', 'twitter:image', image));
  out = setTag(out, /<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${esc(url)}" />`);
  return out;
}

export default async function handler(req, res) {
  const slug = String(req.query.slug || '');
  const type = req.query.type === 'news' ? 'news' : 'blog';

  let html;
  try {
    html = await getTemplate(req);
  } catch (err) {
    console.error('[post-meta] template:', err.message);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).send('Temporarily unavailable');
  }

  let post = null;
  let notFound = false;
  try {
    const r = await fetch(`${BACKEND}/seo/post/${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(7000),
    });
    if (r.status === 404) notFound = true;
    else if (r.ok) post = await r.json();
  } catch (err) {
    // Backend asleep / slow / down: fall through and serve the plain shell.
    console.error('[post-meta] backend:', err.message);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Visible in `curl -I`: tells you whether this function ran and what it did
  // (injected | redirect | not-found | backend-unreachable).
  const mark = (v) => res.setHeader('X-Post-Meta', v);

  if (post) {
    // Wrong prefix for this post's type -> real 301 to the right URL.
    if (post.postType !== type) {
      mark('redirect');
      res.setHeader('Location', postPath(post));
      res.setHeader('Cache-Control', 'public, s-maxage=3600');
      return res.status(301).end();
    }
    mark('injected');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    return res.status(200).send(injectMeta(html, post));
  }

  if (notFound) {
    mark('not-found');
    res.setHeader('Cache-Control', 'public, s-maxage=60');
    return res.status(404).send(html); // SPA renders its own "not found" UI
  }

  // Backend unreachable: serve the generic shell, don't cache it for long.
  mark('backend-unreachable');
  res.setHeader('Cache-Control', 'public, s-maxage=30');
  return res.status(200).send(html);
}