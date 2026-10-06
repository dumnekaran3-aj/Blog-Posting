// Single source of truth for a post's public URL.
// News posts live under /news/<slug>, everything else under /blog/<slug>.
// Use this everywhere a post link is built (cards, sidebar, share,
// canonical/SEO, redirects) so the URL always matches the post type.
export function postPath(post) {
  const slug = post?.slug || "";
  return post?.postType === "news" ? `/news/${slug}` : `/blog/${slug}`;
}