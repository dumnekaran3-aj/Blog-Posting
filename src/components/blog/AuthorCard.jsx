import { useState } from "react";
import Lightbox from "../common/Lightbox";

const BIO_PREVIEW_LENGTH = 220;

export default function AuthorCard({ author, category }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!author) return null;

  const bio = author.bio || "";
  const isLong = bio.length > BIO_PREVIEW_LENGTH;
  const displayedBio = expanded || !isLong ? bio : `${bio.slice(0, BIO_PREVIEW_LENGTH).trim()}...`;

  return (
    <div className="border border-borderClr rounded-xl overflow-hidden mb-6">
      {category && (
        <div className="px-4 py-2.5 border-b border-borderClr text-sm text-textDark">
          Category: <span className="font-medium">{category}</span>
        </div>
      )}

      <div className="px-4 pt-3">
        <span className="inline-block text-xs font-medium bg-primaryDark text-white px-3 py-1.5 rounded-md">
          About Author
        </span>
      </div>

      <div className="p-4 flex gap-4 items-start">
        <button
          type="button"
          onClick={() => author.photo && setLightboxOpen(true)}
          aria-label={`View ${author.name}'s photo`}
          className="shrink-0"
        >
          {author.photo ? (
            <img
              src={author.photo}
              alt={author.name}
              className="w-16 h-16 rounded-full object-cover border border-borderClr"
            />
          ) : (
            <span className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-medium">
              {author.name?.charAt(0).toUpperCase() || "A"}
            </span>
          )}
        </button>

        <div className="min-w-0">
          <p className="font-semibold text-primary italic">{author.name}</p>
          {bio && (
            <p className="text-sm text-textDark italic mt-1">
              {displayedBio}
              {isLong && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="text-primary not-italic font-medium ml-1 hover:underline"
                >
                  {expanded ? "View less" : "View more"}
                </button>
              )}
            </p>
          )}
        </div>
      </div>

      {lightboxOpen && (
        <Lightbox src={author.photo} alt={author.name} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
}