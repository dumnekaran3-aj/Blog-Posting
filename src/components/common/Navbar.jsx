import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, Menu, PenSquare, LogOut, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { primaryCategories, moreCategories, categorySlug } from "../../constants/categories";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="bg-primaryDark relative">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-white font-medium text-lg">VarityWire</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "text-sm text-white border-b-2 border-accent pb-0.5"
                : "text-sm text-white/80 hover:text-white transition-colors"
            }
          >
            Home
          </NavLink>

          {/* Categories dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setCatOpen(true)}
            onMouseLeave={() => setCatOpen(false)}
          >
            <button className="flex items-center gap-1 text-sm text-white/80 hover:text-white">
              Categories <ChevronDown size={13} />
            </button>
            {catOpen && (
              <div className="absolute top-full left-0 bg-white border border-borderClr rounded-lg shadow-lg py-2 w-56 z-50">
                {primaryCategories.map((cat) => (
                  <Link
                    key={cat.value}
                    to={`/category/${categorySlug(cat.value)}`}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-textDark hover:bg-bgLight"
                  >
                    <span>{cat.emoji}</span> {cat.value}
                  </Link>
                ))}
                <div className="border-t border-borderClr my-1" />
                {moreCategories.map((cat) => (
                  <Link
                    key={cat.value}
                    to={`/category/${categorySlug(cat.value)}`}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-textDark hover:bg-bgLight"
                  >
                    <span>{cat.emoji}</span> {cat.value}
                  </Link>
                ))}
                <div className="border-t border-borderClr my-1" />
                <Link
                  to="/categories"
                  className="block px-4 py-2 text-xs text-primary hover:bg-bgLight"
                >
                  View all categories
                </Link>
              </div>
            )}
          </div>

          <button aria-label="Search" className="text-white/80 hover:text-white">
            <Search size={16} />
          </button>

          {user ? (
            <>
              <Link
                to="/create"
                className="flex items-center gap-1.5 bg-primary text-white text-sm px-4 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
              >
                <PenSquare size={14} /> Write
              </Link>
              <Link to="/dashboard" className="text-white/80 text-sm hover:text-white">
                {user.name}
              </Link>
              <button
                onClick={handleLogout}
                aria-label="Sign out"
                className="text-white/80 hover:text-white"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-primary text-white text-sm px-4 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
            >
              Sign in
            </Link>
          )}
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
          <NavLink to="/" className="text-sm text-white" onClick={() => setMenuOpen(false)}>
            Home
          </NavLink>
          <Link to="/categories" className="text-sm text-white" onClick={() => setMenuOpen(false)}>
            Categories
          </Link>
          {user ? (
            <>
              <Link to="/create" className="text-sm text-white" onClick={() => setMenuOpen(false)}>
                Write
              </Link>
              <Link to="/dashboard" className="text-sm text-white" onClick={() => setMenuOpen(false)}>
                {user.name}
              </Link>
              <button onClick={handleLogout} className="text-sm text-white/80 text-left">
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-primary text-white text-sm px-4 py-1.5 rounded-md w-fit"
              onClick={() => setMenuOpen(false)}
            >
              Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}