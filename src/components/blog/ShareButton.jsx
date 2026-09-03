import { useState } from "react";
import { Share2 } from "lucide-react";
import ShareMenu from "./ShareMenu";

export default function ShareButton({ url, title, size = "sm" }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const iconSize = size === "lg" ? 18 : 13;
  const textSize = size === "lg" ? "text-sm" : "text-[11px]";

  return (
    <>
      <button
        onClick={() => setMenuOpen(true)}
        className={`flex items-center gap-1 ${textSize} text-primary hover:text-primary/80 transition-colors`}
        aria-label="Share post"
      >
        <Share2 size={iconSize} />
        {size === "lg" && <span>Share</span>}
      </button>

      {menuOpen && (
        <ShareMenu url={url} title={title} onClose={() => setMenuOpen(false)} />
      )}
    </>
  );
}