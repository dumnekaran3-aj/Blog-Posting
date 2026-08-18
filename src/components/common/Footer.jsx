import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-primaryDark mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 px-6 py-4">
        <div>
          <p className="text-white text-sm font-medium">Blogpost</p>
          <p className="text-white/60 text-xs">
            Ideas, features, and readability, done right
          </p>
        </div>
        <div className="flex gap-5">
          <Link to="/" className="text-white text-xs hover:text-white/80">
            Home
          </Link>
          <Link to="/categories" className="text-white text-xs hover:text-white/80">
            Categories
          </Link>
          <Link to="/contact" className="text-secondary text-xs hover:text-secondary/80">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}