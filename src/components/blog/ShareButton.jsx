import { useState } from "react";
import { Share2, Check } from "lucide-react";

export default function ShareButton({ url, title, size = "sm" }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const fullUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;

    // Mobile pe native share sheet, desktop pe clipboard copy fallback
    if (navigator.share) {
      try {
        await navigator.share({ title, url: fullUrl });
      } catch (err) {
        // user cancelled the share sheet — not an error, ignore
      }
    } else {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const iconSize = size === "lg" ? 18 : 13;
  const textSize = size === "lg" ? "text-sm" : "text-[11px]";

  return (
    <button
      onClick={handleShare}
      className={`flex items-center gap-1 ${textSize} text-primary hover:text-primary/80 transition-colors`}
      aria-label="Share post"
    >
      {copied ? <Check size={iconSize} /> : <Share2 size={iconSize} />}
      {size === "lg" && <span>{copied ? "Link copied" : "Share"}</span>}
    </button>
  );
}