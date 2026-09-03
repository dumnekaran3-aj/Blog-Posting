import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// React Router doesn't reset scroll position on navigation by default —
// clicking a post card from partway down the home feed used to open the
// blog detail page still scrolled to that same position instead of the top.
// Mounted once near the top of the router in App.jsx.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}