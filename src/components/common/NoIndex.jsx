import { useEffect } from "react";

// Drops <meta name="robots" content="noindex, nofollow"> into <head> for as
// long as this is mounted, then removes it on unmount. Unlike a robots.txt
// Disallow rule, this never lists the admin path in any publicly-readable
// file — Google (and anyone else) only ever sees this tag if they already
// have the URL and actually request the page.
export default function NoIndex() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);

    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  return null;
}