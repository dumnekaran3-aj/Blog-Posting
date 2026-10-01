import { Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import NoIndex from "../components/common/NoIndex";

// Shown for any URL that matches no route. The app is a SPA hosted on
// Vercel, so the HTTP status is always 200 — the noindex tag is what tells
// Google this is an error page and not real content (avoids "soft 404").
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-bgLight">
      <NoIndex />
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-20 text-center">
        <p className="text-sm text-textMuted mb-2">404</p>
        <h1 className="text-2xl font-semibold mb-3">Page not found</h1>
        <p className="text-sm text-textMuted mb-6">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="text-sm text-primary">
          Back to home
        </Link>
      </div>
      <Footer />
    </div>
  );
}