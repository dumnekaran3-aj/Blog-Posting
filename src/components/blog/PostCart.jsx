import { Link } from "react-router-dom";
import { Heart, MessageCircle, Eye, Share2, PlayCircle, Headphones } from "lucide-react";

const categoryStyles = {
  default: "bg-textMuted/10 text-textMuted",
};

// mediaType: "image" | "video" | "audio" | "text"
export default function PostCard({ post }) {
  const {
    slug,
    title,
    thumbnail,
    mediaUrl,
    category,
    author,
    createdAt,
    likesCount,
    commentsCount,
    viewsCount,
    mediaType,
  } = post;

  const badgeClass = categoryStyles[category] || categoryStyles.default;

  // For images, the media file itself IS the preview. For video, we use the
  // auto-generated snapshot frame (thumbnail). Audio has no visual frame to
  // show, so it falls back to the icon treatment below.
  const previewImage = mediaType === "image" ? mediaUrl : thumbnail;

  return (
    <div className="bg-white border border-borderClr rounded-xl overflow-hidden hover:border-primary/40 transition-colors">
      <Link to={`/blog/${slug}`}>
        <div className="relative h-36 overflow-hidden">
          {previewImage ? (
            <img
              src={previewImage}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : mediaType === "audio" ? (
            // No real snapshot possible for audio — attractive gradient + icon instead
            <div className="w-full h-full bg-gradient-to-br from-secondary/20 via-primary/10 to-accent/20 flex items-center justify-center">
              <div className="bg-white/80 rounded-full p-3">
                <Headphones size={22} className="text-secondary" />
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-slate-300" />
          )}

          {mediaType === "video" && (
            <PlayCircle
              className="absolute inset-0 m-auto text-white drop-shadow-lg"
              size={34}
              fill="rgba(0,0,0,0.35)"
            />
          )}
        </div>
      </Link>

      <div className="p-3">
        <span className={`text-[10px] px-2 py-0.5 rounded ${badgeClass}`}>
          {category || "General"}
        </span>

        <Link to={`/blog/${slug}`}>
          <h3 className="text-sm font-medium text-textDark mt-2 mb-1 line-clamp-2 hover:text-primary">
            {title}
          </h3>
        </Link>

        <p className="text-xs text-textMuted mb-2 flex items-center gap-1.5">
          <Link
            to={`/profile/${author?._id || author?.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 hover:text-primary"
          >
            {author?.avatar ? (
              <img src={author.avatar} alt={author.name} className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-medium">
                {author?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            )}
            By {author?.name || "Unknown"}
          </Link>
          &middot;{" "}
          {new Date(createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </p>

        <div className="flex items-center gap-3 border-t border-borderClr pt-2">
          <button
            className="flex items-center gap-1 text-[11px] text-amber-700 hover:text-accent"
            aria-label="Like post"
          >
            <Heart size={13} /> {likesCount ?? 0}
          </button>
          <button
            className="flex items-center gap-1 text-[11px] text-secondary hover:text-secondary/80"
            aria-label="View comments"
          >
            <MessageCircle size={13} /> {commentsCount ?? 0}
          </button>
          <span className="flex items-center gap-1 text-[11px] text-textMuted">
            <Eye size={13} /> {viewsCount ?? 0}
          </span>
          <button
            className="flex items-center gap-1 text-[11px] text-primary ml-auto hover:text-primary/80"
            aria-label="Share post"
          >
            <Share2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}