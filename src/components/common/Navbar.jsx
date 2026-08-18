import { Link, NavLink } from "react-router-dom";
import { Search, Menu } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLink =
    "text-sm text-white/80 hover:text-white transition-colors";
  const activeLink =
    "text-sm text-white border-b-2 border-accent pb-0.5";

  return (
    <header className="bg-primaryDark">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-white font-medium text-lg">Blogpost</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? activeLink : navLink)}
          >
            Home
          </NavLink>
          <NavLink
            to="/categories"
            className={({ isActive }) => (isActive ? activeLink : navLink)}
          >
            Categories
          </NavLink>
          <button aria-label="Search" className="text-white/80 hover:text-white">
            <Search size={16} />
          </button>
          <Link
            to="/login"
            className="bg-primary text-white text-sm px-4 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
          >
            Sign in
          </Link>
        </div>

        <button
          className="md:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <Menu size={22} />
        </button>
      </nav>

      {menuOpen && (
        <div className="md:hidden flex flex-col gap-3 px-6 pb-4">
          <NavLink to="/" className={navLink} onClick={() => setMenuOpen(false)}>
            Home
          </NavLink>
          <NavLink
            to="/categories"
            className={navLink}
            onClick={() => setMenuOpen(false)}
          >
            Categories
          </NavLink>
          <Link
            to="/login"
            className="bg-primary text-white text-sm px-4 py-1.5 rounded-md w-fit"
            onClick={() => setMenuOpen(false)}
          >
            Sign in
          </Link>
        </div>
      )}
    </header>
  );
}