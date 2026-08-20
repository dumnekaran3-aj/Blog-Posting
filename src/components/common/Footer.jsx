import { Link } from "react-router-dom";

const legalLinks = [
  { label: "About Us", to: "/about" },
  { label: "Editorial Policy", to: "/editorial-policy" },
  { label: "Write for Us", to: "/write-for-us" },
  { label: "Corrections", to: "/corrections-policy" },
  { label: "Disclaimer", to: "/disclaimer" },
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Terms of Service", to: "/terms-of-service" },
  { label: "Contact Us", to: "/contact" },
];

export default function Footer() {
  return (
    <footer className="bg-primaryDark mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div>
            <p className="text-white text-sm font-medium">VarityWire</p>
            <p className="text-white/60 text-xs">Discover. Explore. Understand.</p>
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

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 pt-4 border-t border-white/10">
          {legalLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-white/60 text-[11px] hover:text-white/90"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}