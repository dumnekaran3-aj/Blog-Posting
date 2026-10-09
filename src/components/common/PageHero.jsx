import { Link } from "react-router-dom";
import { Home as HomeIcon, Search } from "lucide-react";

// PageHero
// ----------
// Dark, centred page header (breadcrumb, badge, title, intro, optional search
// bar) shared by Home, /blogs and /news so all three read as one family and
// match the article-detail header band. Copy is passed in, so the same
// component says "Blog" on /blogs and "News" on /news.
//
// props:
//   crumbs      [{ label, to? }] shown after the home icon (last = current page)
//   badge       small pill above the title
//   title       main heading
//   description one-line intro under the title
//   search      optional { value, onChange, placeholder } — renders the search bar
export default function PageHero({ crumbs = [], badge, title, description, search }) {
  return (
    <header
      className="border-b border-white/10 text-white"
      style={{
        backgroundColor: "#1B0E3A",
        backgroundImage:
          "radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.13), transparent 60%), linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
        backgroundSize: "auto, 28px 28px, 28px 28px",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 pt-5 pb-9 md:pb-11">
        {crumbs.length > 0 && (
          <nav className="flex items-center gap-2 text-[13px] flex-wrap">
            <Link
              to="/"
              aria-label="Home"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center transition-colors"
            >
              <HomeIcon size={15} />
            </Link>
            {crumbs.map((c, i) => (
              <span key={c.label} className="flex items-center gap-2">
                <span className="text-slate-500">/</span>
                {c.to && i < crumbs.length - 1 ? (
                  <Link to={c.to} className="font-semibold text-slate-300 hover:text-white transition-colors">
                    {c.label}
                  </Link>
                ) : (
                  <span className="font-bold text-white">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        <div className="flex flex-col items-center text-center mt-3 md:mt-1">
          {badge && (
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/40 bg-accent/10 text-accent text-[11px] font-bold uppercase tracking-[0.18em]">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              {badge}
            </span>
          )}

          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">{title}</h1>
          <span className="mt-3 block h-[3px] w-12 rounded-full bg-accent" />

          {description && (
            <p className="mt-4 max-w-2xl text-sm md:text-base text-slate-300 leading-relaxed">{description}</p>
          )}

          {search && (
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-6 w-full max-w-xl flex items-center gap-2 bg-white rounded-full pl-5 pr-1.5 py-1.5 shadow-lg"
            >
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder || "Search posts"}
                aria-label="Search posts"
                className="flex-1 min-w-0 bg-transparent text-sm text-textDark outline-none placeholder:text-slate-400 py-2"
              />
              <button
                type="submit"
                className="shrink-0 inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-accent text-[#1B0E3A] text-sm font-bold hover:brightness-110 transition"
              >
                <Search size={14} /> Search
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}