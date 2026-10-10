import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Eye, PlayCircle, Headphones } from "lucide-react";
import LikeButton from "./LikeButton";
import ShareButton from "./ShareButton";
import Lightbox from "../common/Lightbox";
import renderPostContent, { renderPostPreview } from "../../utils/renderPostContent";
import renderHtmlPostContent, { htmlToPreviewText, looksLikeHtml } from "../../utils/renderHtmlPostContent";
import { postPath } from "../../utils/postUrl";

const categoryStyles = {
  default: "bg-textMuted/10 text-textMuted",
};

// Preview text is clamped to 3 lines visually (CSS line-clamp), but whether
// the "Show more" button even appears depends on raw length — short posts
// that happen to wrap to 3 short lines shouldn't get a pointless toggle.
const PREVIEW_CHAR_THRESHOLD = 220;

// How long a press has to be held before it counts as "hold" (opens the
// image lightbox) instead of a quick tap (opens the post) — long enough
// that a normal tap never accidentally triggers it, short enough that it
// doesn't feel laggy.
const LONG_PRESS_MS = 450;

// mediaType: "image" | "video" | "audio" | "text"
export default function PostCard({ post }) {
  const {
    _id,
    title,
    content,
    contentFormat,
    textStyle,
    thumbnail,
    mediaUrl,
    category,
    author,
    createdAt,
    likesCount,
    commentsCount,
    viewsCount,
    mediaType,
    isLiked,
  } = post;

  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [authorLightboxOpen, setAuthorLightboxOpen] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  // Long-press bookkeeping for the image — a ref (not state) since it's
  // read/written inside event handlers, not rendered, and doesn't need to
  // trigger a re-render.
  const pressTimer = useRef(null);
  const wasLongPress = useRef(false);

  const badgeClass = categoryStyles[category] || categoryStyles.default;

  const isImage = mediaType === "image" && !!mediaUrl;
  const isVideo = mediaType === "video" && !!mediaUrl;
  const isAudio = mediaType === "audio" && !!mediaUrl;

  // Posts saved before textStyle existed have no value for it (undefined)
  // — fall back to "bold" for those so they keep looking exactly like they
  // did before this feature shipped. Only posts that explicitly chose
  // "normal" or "italic" in the editor render differently.
  const resolvedTextStyle = textStyle || "bold";
  const textStyleClass = resolvedTextStyle === "italic" ? "italic" : resolvedTextStyle === "normal" ? "" : "font-bold";

  // Trust contentFormat when it says "html", but don't trust it blindly
  // when it doesn't — some rows predate contentFormat being tracked
  // consistently on every write path, so a post can have real HTML in
  // `content` with a stale/missing contentFormat. Detecting an actual tag
  // is the fallback that keeps those posts from showing raw "<h2>..."
  // text in the feed (see utils/renderHtmlPostContent.jsx).
  const isHtmlContent = contentFormat === "html" || looksLikeHtml(content);

  const trimmedContent = isHtmlContent ? htmlToPreviewText(content) : (content || "").trim();
  const isLong = trimmedContent.length > PREVIEW_CHAR_THRESHOLD;

  const path = postPath(post);
  const goToPost = () => navigate(path);

  // Card-wide click: anything inside that should NOT navigate (like
  // button, comments link, share button, show more/less, video/audio
  // controls) calls e.stopPropagation() in its own handler so this never
  // fires for those. Everything else — the whitespace, the category
  // badge, the title, a plain tap on the image — opens the post.
  // Open the post in a new tab. "noopener,noreferrer" so the new tab can't
  // reach back into this one (window.opener). `path` is always built by
  // postPath() — a fixed "/blog/..." or "/news/..." prefix — so this can
  // only ever open a page of our own site.
  const openInNewTab = () => window.open(path, "_blank", "noopener,noreferrer");

  // Behave like a real link: Ctrl+click (also Ctrl + touchpad tap) or
  // Cmd+click on a Mac opens a new tab; a plain click navigates as before.
  const handleCardClick = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      openInNewTab();
      return;
    }
    goToPost();
  };

  // Middle mouse button (wheel click) -> new tab, same as a link.
  const handleCardAuxClick = (e) => {
    if (e.button === 1) {
      e.preventDefault();
      openInNewTab();
    }
  };

  const handleCardKeyDown = (e) => {
    // Ctrl/Cmd+Enter on the focused card itself (not on a button inside it)
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && e.target === e.currentTarget) {
      e.preventDefault();
      openInNewTab();
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToPost();
    }
  };

  // Ctrl/Cmd+Enter while the mouse pointer is over the card — even if the
  // card isn't focused. The listener only exists while the pointer is over
  // THIS card, and it stays out of the way when you're typing in a field.
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    if (!hovered) return undefined;
    const onKey = (e) => {
      if (e.defaultPrevented || e.key !== "Enter" || !(e.ctrlKey || e.metaKey)) return;
      const t = e.target;
      if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      window.open(path, "_blank", "noopener,noreferrer");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hovered, path]);

  // Image: tap = open the post (same as clicking anywhere else on the
  // card — no special-casing needed, just let the click bubble up).
  // Hold = zoom. The timer starts the "hold" as soon as the press begins;
  // if it fires before the finger/mouse lifts, this was a hold, not a
  // tap — the click that follows the release is what a hold-then-navigate
  // would otherwise still trigger, so that's what the click handler below
  // blocks.
  const handleImagePressStart = () => {
    wasLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      wasLongPress.current = true;
      setLightboxOpen(true);
    }, LONG_PRESS_MS);
  };
  const handleImagePressEnd = () => {
    clearTimeout(pressTimer.current);
  };
  const handleImageClick = (e) => {
    if (wasLongPress.current) {
      // This click is the tail end of a hold that already opened the
      // lightbox — swallow it so it doesn't ALSO navigate to the post.
      e.stopPropagation();
      wasLongPress.current = false;
    }
    // Otherwise: a genuine tap — let it bubble up to the card and navigate.
  };

  return (
    <div>
      {/* ---- Author row — OUTSIDE the card, above it ---- */}
      <div className="flex items-center gap-2 mb-1.5 px-0.5">
        {/* Avatar click => enlarge (Lightbox), NOT navigate — naam wala
            link neeche navigate karta hai profile pe */}
        <button
          type="button"
          onClick={() => author?.avatar && setAuthorLightboxOpen(true)}
          className="shrink-0"
          aria-label={`View ${author?.name || "user"}'s profile photo`}
        >
          {author?.avatar ? (
            <img src={author.avatar} alt={author.name} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
              {author?.name?.charAt(0).toUpperCase() || "U"}
            </span>
          )}
        </button>
        {authorLightboxOpen && (
          <Lightbox src={author?.avatar} alt={author?.name} onClose={() => setAuthorLightboxOpen(false)} />
        )}
        <p className="text-xs">
                   <Link
            to={`/profile/${author?.username}`}
            className="font-medium text-primary hover:underline"
          >
            {author?.name || "Unknown"}
          </Link>
          <span className="text-textMuted">
            {" · "}
            {new Date(createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
        </p>
      </div>

      {/* ---- The card itself — the whole thing is clickable now ----
            role="link" + tabIndex + onKeyDown make this keyboard/
            screen-reader accessible even though it's a div, not an <a> —
            an actual nested <a> isn't valid here since the card contains
            other links/buttons (like/comment/share) that need their own
            separate destinations. ---- */}
      <div
        role="link"
        tabIndex={0}
        onClick={handleCardClick}
        onAuxClick={handleCardAuxClick}
        onKeyDown={handleCardKeyDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="bg-white border border-borderClr rounded-xl overflow-hidden hover:border-primary/40 transition-colors cursor-pointer group"
      >
        <div className="flex justify-end px-3 pt-3">
          <span className={`text-[10px] px-2 py-0.5 rounded shrink-0 ${badgeClass}`}>
            {category || "General"}
          </span>
        </div>

        {/* ---- Title — no longer its own Link; the whole card handles
              navigation now, this is just styled text. ---- */}
        <h3 className="text-lg font-bold text-textDark px-3 pt-1 pb-2 leading-snug line-clamp-2 min-h-[3.25rem] group-hover:text-primary">
          {title}
        </h3>

        {/* ---- Media ----
              Image: tap opens the post (bubbles to the card), hold opens
              the lightbox (see handlers above).
              Video/audio: unchanged — interacting with them plays/opens
              controls rather than navigating, so their own onClick stops
              the click from also bubbling up to the card. ---- */}
        {isImage && (
          <>
            <div
              onClick={handleImageClick}
              onMouseDown={handleImagePressStart}
              onMouseUp={handleImagePressEnd}
              onMouseLeave={handleImagePressEnd}
              onTouchStart={handleImagePressStart}
              onTouchEnd={handleImagePressEnd}
              className="block w-full relative h-56 overflow-hidden select-none"
            >
              <img
                src={mediaUrl}
                alt={title}
                draggable={false}
                className="w-full h-full object-cover pointer-events-none"
              />
            </div>
            {lightboxOpen && (
              <Lightbox
                src={mediaUrl}
                alt={title}
                onClose={(e) => {
                  // Lightbox's own close (backdrop click / X button) is
                  // inside the card too — stop it from also triggering the
                  // card's navigate-on-click.
                  e?.stopPropagation?.();
                  setLightboxOpen(false);
                }}
              />
            )}
          </>
        )}

        {isVideo && (
          <div
            className="relative h-56 overflow-hidden bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            {videoPlaying ? (
              <video
                src={mediaUrl}
                controls
                autoPlay
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <button
                type="button"
                onClick={() => setVideoPlaying(true)}
                className="w-full h-full relative block"
                aria-label="Play video"
              >
                {thumbnail ? (
                  <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
                ) : (
                  // No generated thumbnail — the video element itself shows
                  // its first frame automatically (preload="metadata"),
                  // giving a real preview without needing a backend thumbnail.
                  <video
                    src={mediaUrl}
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover pointer-events-none"
                  />
                )}
                <PlayCircle
                  className="absolute inset-0 m-auto text-white drop-shadow-lg"
                  size={44}
                  fill="rgba(0,0,0,0.35)"
                />
              </button>
            )}
          </div>
        )}

        {isAudio && (
          <div className="px-3 pt-2 pb-1" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-lg bg-gradient-to-br from-secondary/10 via-primary/5 to-accent/10 p-3 flex items-center gap-3">
              <span className="bg-white rounded-full p-2 shrink-0">
                <Headphones size={18} className="text-secondary" />
              </span>
              <audio src={mediaUrl} controls className="w-full h-9" />
            </div>
          </div>
        )}

        {/* ---- Action row — right below media ---- */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 mt-1 border-t border-b border-borderClr"
          onClick={(e) => e.stopPropagation()}
        >
          <LikeButton postId={_id} initialLikesCount={likesCount} initialLiked={isLiked} size="sm" />
          <Link
            to={`${path}#comments`}
            className="flex items-center gap-1 text-[11px] text-secondary hover:text-secondary/80"
            aria-label="View comments"
          >
            <MessageCircle size={13} /> {commentsCount ?? 0}
          </Link>
          <span className="flex items-center gap-1 text-[11px] text-textMuted">
            <Eye size={13} /> {viewsCount ?? 0}
          </span>
          <div className="ml-auto">
            <ShareButton url={path} title={title} />
          </div>
        </div>

        {/* ---- Text preview — clamped, style per the post's saved
              textStyle choice, with Show more/less toggle, URLs
              auto-linked ---- */}
        {trimmedContent && (
          <div className="px-3 py-2.5">
            {expanded ? (
              // Expanded = the SAME rendering as the BlogDetail page
              // (headings, paragraphs, lists, tables, charts, links), not
              // the flattened preview text. Clicks inside don't bubble to
              // the card, so selecting text / opening a link doesn't also
              // navigate to the post.
              <div
                onClick={(e) => e.stopPropagation()}
                className={`text-sm text-textDark leading-relaxed whitespace-pre-wrap ${textStyleClass} [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:mt-3 [&_h1]:mb-1 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:border-collapse [&_table]:w-full [&_td]:border [&_td]:border-borderClr [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-borderClr [&_th]:px-2 [&_th]:py-1 [&_th]:bg-bgLight [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:rounded-md [&_blockquote]:border-l-2 [&_blockquote]:border-borderClr [&_blockquote]:pl-3 [&_blockquote]:italic`}
              >
                {isHtmlContent ? renderHtmlPostContent(content) : renderPostContent(content)}
              </div>
            ) : (
              <p className={`text-sm text-textDark whitespace-pre-line ${textStyleClass} line-clamp-3`}>
                {isHtmlContent ? trimmedContent : renderPostPreview(trimmedContent)}
              </p>
            )}
            {isLong && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((v) => !v);
                }}
                className="text-xs font-medium text-primary hover:text-primary/80 mt-1"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}