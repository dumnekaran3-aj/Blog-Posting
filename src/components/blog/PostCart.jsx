import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Eye, PlayCircle, Headphones } from "lucide-react";
import LikeButton from "./LikeButton";
import ShareButton from "./ShareButton";
import Lightbox from "../common/Lightbox";
import linkify from "../../utils/linkify";

const categoryStyles = {
  default: "bg-textMuted/10 text-textMuted",
};

// Preview text is clamped to 3 lines visually (CSS line-clamp), but whether
// the "Show more" button even appears depends on raw length — short posts
// that happen to wrap to 3 short lines shouldn't get a pointless toggle.
const PREVIEW_CHAR_THRESHOLD = 220;

// mediaType: "image" | "video" | "audio" | "text"
export default function PostCard({ post }) {
  const {
    _id,
    slug,
    title,
    content,
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

  const [expanded, setExpanded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const badgeClass = categoryStyles[category] || categoryStyles.default;

  const isImage = mediaType === "image" && !!mediaUrl;
  const isVideo = mediaType === "video" && !!mediaUrl;
  const isAudio = mediaType === "audio" && !!mediaUrl;

  const trimmedContent = (content || "").trim();
  const isLong = trimmedContent.length > PREVIEW_CHAR_THRESHOLD;

  return (
    <div>
      {/* ---- Author row — OUTSIDE the card, above it ---- */}
      <div className="flex items-center gap-2 mb-1.5 px-0.5">
        <Link to={`/profile/${author?._id || author?.id}`} className="shrink-0">
          {author?.avatar ? (
            <img src={author.avatar} alt={author.name} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
              {author?.name?.charAt(0).toUpperCase() || "U"}
            </span>
          )}
        </Link>
        <p className="text-xs">
          <Link
            to={`/profile/${author?._id || author?.id}`}
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

      {/* ---- The card itself ---- */}
      <div className="bg-white border border-borderClr rounded-xl overflow-hidden hover:border-primary/40 transition-colors">
        <div className="flex justify-end px-3 pt-3">
          <span className={`text-[10px] px-2 py-0.5 rounded shrink-0 ${badgeClass}`}>
            {category || "General"}
          </span>
        </div>

        {/* ---- Title — bold, larger, clickable → opens the full post ----
              min-h ensures the title's own space never visually collapses/
              gets lost against whatever comes right after it (media, or the
              action row on text-only posts). ---- */}
        <Link to={`/blog/${slug}`}>
          <h3 className="text-lg font-bold text-textDark px-3 pt-1 pb-2 leading-snug line-clamp-2 min-h-[3.25rem] hover:text-primary">
            {title}
          </h3>
        </Link>

        {/* ---- Media — interacts with itself (zoom / play), does NOT navigate away.
              Only the title/text takes you to the full post. ---- */}
        {isImage && (
          <>
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="block w-full relative h-56 overflow-hidden"
              aria-label="View full image"
            >
              <img src={mediaUrl} alt={title} className="w-full h-full object-cover" />
            </button>
            {lightboxOpen && (
              <Lightbox src={mediaUrl} alt={title} onClose={() => setLightboxOpen(false)} />
            )}
          </>
        )}

        {isVideo && (
          <div className="relative h-56 overflow-hidden bg-black">
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
          <div className="px-3 pt-2 pb-1">
            <div className="rounded-lg bg-gradient-to-br from-secondary/10 via-primary/5 to-accent/10 p-3 flex items-center gap-3">
              <span className="bg-white rounded-full p-2 shrink-0">
                <Headphones size={18} className="text-secondary" />
              </span>
              <audio src={mediaUrl} controls className="w-full h-9" />
            </div>
          </div>
        )}

        {/* ---- Action row — right below media ---- */}
        <div className="flex items-center gap-3 px-3 py-2.5 mt-1 border-t border-b border-borderClr">
          <LikeButton postId={_id} initialLikesCount={likesCount} initialLiked={isLiked} size="sm" />
          <Link
            to={`/blog/${slug}#comments`}
            className="flex items-center gap-1 text-[11px] text-secondary hover:text-secondary/80"
            aria-label="View comments"
          >
            <MessageCircle size={13} /> {commentsCount ?? 0}
          </Link>
          <span className="flex items-center gap-1 text-[11px] text-textMuted">
            <Eye size={13} /> {viewsCount ?? 0}
          </span>
          <div className="ml-auto">
            <ShareButton url={`/blog/${slug}`} title={title} />
          </div>
        </div>

        {/* ---- Text preview — bold, clamped, with Show more/less toggle,
              URLs inside auto-linked ---- */}
        {trimmedContent && (
          <div className="px-3 py-2.5">
            <p
              className={`text-sm font-bold text-textDark whitespace-pre-line ${
                expanded ? "" : "line-clamp-3"
              }`}
            >
              {linkify(trimmedContent)}
            </p>
            {isLong && (
              <button
                onClick={() => setExpanded((v) => !v)}
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