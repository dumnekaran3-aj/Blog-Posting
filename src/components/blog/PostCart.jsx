import { Link } from "react-router-dom";
import { Heart, MessageCircle, Eye, Share2, PlayCircle, Headphones } from "lucide-react";

const categoryStyles = {
  Marketing: "bg-secondary/10 text-secondary",
  Design: "bg-accent/10 text-accent",
  Tech: "bg-primary/10 text-primary",
  default: "bg-textMuted/10 text-textMuted",
};

// mediaType: "image" | "video" | "audio" | "text"
export default function PostCard({ post }) {
  const {
    slug,
    title,
    thumbnail,
    category,
    author,
    createdAt,
    likesCount,
    commentsCount,
    viewsCount,
    mediaType,
  } = post;

  const badgeClass = categoryStyles[category] || categoryStyles.default;

  return (
    <div className="bg-white border border-borderClr rounded-xl overflow-hidden hover:border-primary/40 transition-colors">
      <Link to={`/blog/${slug}`}>
        <div className="relative bg-slate-300 h-36">
          {thumbnail && (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover"
            />
          )}
          {mediaType === "video" && (
            <PlayCircle
              className="absolute inset-0 m-auto text-white drop-shadow"
              size={30}
            />
          )}
          {mediaType === "audio" && (
            <Headphones
              className="absolute inset-0 m-auto text-white drop-shadow"
              size={26}
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

        <p className="text-xs text-textMuted mb-2">
          By {author?.name || "Unknown"} &middot;{" "}
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