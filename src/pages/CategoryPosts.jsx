import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Search, TrendingUp } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import PostCard from "../components/blog/PostCart";
import { postPath } from "../utils/postUrl";
import Pagination from "../components/common/Pagination";
import { categories, categorySlug } from "../constants/categories";
import { CATEGORY_STYLE, DEFAULT_CATEGORY_STYLE } from "../constants/categoryIcons";
import api from "../services/api";

export default function CategoryPosts() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [trending, setTrending] = useState([]);

  // Reverse-lookup: the URL only has the slug, backend filter needs the
  // exact category string (emoji-free) as originally stored on posts
  const category = categories.find((c) => categorySlug(c.value) === slug);

  // Category badalne pe page 1 pe wapas — purani category ke page number
  // pe atka rehna galat hoga jab naye category mein utne pages hi na ho
  useEffect(() => {
    setPage(1);
  }, [slug]);

  useEffect(() => {
    if (!category) return;

    const fetchPosts = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/posts", { params: { category: category.value, page } });
        setPosts(data.posts || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        // leave posts empty on failure
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [slug, page]);

  // Sidebar "Trending" — posts from OTHER categories, on purpose: the main
  // column already shows everything in this category, so repeating those
  // here would be redundant. This nudges readers to explore beyond it.
  useEffect(() => {
    if (!category) return;

    const fetchTrending = async () => {
      try {
        const { data } = await api.get("/posts", { params: { limit: 10 } });
        const others = (data.posts || []).filter((p) => p.category !== category.value);
        setTrending(others.slice(0, 6));
      } catch (err) {
        setTrending([]);
      }
    };
    fetchTrending();
  }, [slug]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Search lives on Home (it already handles ?search=) — this just hands
  // off to it rather than duplicating search logic on a second page.
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (q) navigate(`/?search=${encodeURIComponent(q)}`);
  };

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col bg-bgLight">
        <Navbar />
        <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-16 text-center">
          <p className="text-sm text-textMuted mb-2">This category doesn't exist.</p>
          <Link to="/categories" className="text-sm text-primary">
            Browse all categories
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { icon: HeaderIcon, tint: headerTint } = CATEGORY_STYLE[category.value] || DEFAULT_CATEGORY_STYLE;

  return (
    <div className="min-h-screen flex flex-col bg-bgLight">
      <Navbar />

      <section className="max-w-7xl mx-auto w-full px-6 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${headerTint}`}>
            <HeaderIcon size={20} strokeWidth={2} />
          </span>
          <h1 className="text-2xl font-medium text-textDark">{category.value}</h1>
        </div>
        <p className="text-sm text-textMuted">Posts in this category</p>
      </section>

      <section className="flex-1 max-w-7xl mx-auto w-full px-6 pb-10 grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 items-start">
        {/* Post feed */}
        <div>
          <div className="flex flex-col gap-6">
            {loading && <p className="text-sm text-textMuted">Loading posts...</p>}

            {!loading && posts.length === 0 && (
              <p className="text-sm text-textMuted">No posts in this category yet.</p>
            )}

            {!loading && posts.map((post) => <PostCard key={post._id} post={post} />)}
          </div>

          {!loading && posts.length > 0 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
          )}
        </div>

        {/* Sidebar — same sticky, independently-scrolling behavior as the
            Home page (desktop only; plain stacked block on mobile) */}
        <aside className="flex flex-col gap-4 md:sticky md:top-20 md:max-h-[calc(100vh-6rem)] md:overflow-y-auto md:pb-2">
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white border border-borderClr rounded-xl px-3 py-2 flex items-center gap-2"
          >
            <Search size={15} className="text-textMuted" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search posts"
              className="text-xs outline-none w-full placeholder:text-slate-400"
            />
          </form>

          {/* All categories — current one is highlighted so the reader
              always knows where they are in the list */}
          <div className="bg-white border border-borderClr rounded-xl p-4">
            <p className="text-sm font-medium text-textDark mb-1">All categories</p>
            <p className="text-[11px] text-textMuted mb-3">Browse posts by topic</p>
            <div className="flex flex-col">
              {categories.map((cat) => {
                const { icon: Icon, tint } = CATEGORY_STYLE[cat.value] || DEFAULT_CATEGORY_STYLE;
                const isActive = cat.value === category.value;
                return (
                  <Link
                    key={cat.value}
                    to={`/category/${categorySlug(cat.value)}`}
                    className={`group flex items-center gap-3 px-2 py-2 rounded-lg transition-colors ${
                      isActive ? "bg-primary/5" : "hover:bg-bgLight"
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tint}`}>
                      <Icon size={15} strokeWidth={2} />
                    </span>
                    <span
                      className={`text-[13px] font-medium transition-colors ${
                        isActive ? "text-primary" : "text-slate-700 group-hover:text-primary"
                      }`}
                    >
                      {cat.value}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {trending.length > 0 && (
            <div className="bg-white border border-borderClr rounded-xl p-4">
              <p className="flex items-center gap-1.5 text-sm font-medium text-textDark mb-4">
                <TrendingUp size={15} className="text-primary" /> Trending on VarityWire
              </p>
              <div className="grid grid-cols-2 gap-3">
                {trending.map((post) => (
                  <Link
                    key={post._id}
                    to={postPath(post)}
                    className="group block rounded-lg overflow-hidden border border-transparent hover:border-borderClr transition-colors"
                  >
                    {post.thumbnail || post.mediaUrl ? (
                      <img
                        src={post.thumbnail || post.mediaUrl}
                        alt={post.title}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-20 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-lg font-medium">
                        {post.category?.charAt(0).toUpperCase() || "P"}
                      </div>
                    )}
                    <div className="pt-2 px-0.5 pb-1">
                      <p className="text-[9px] uppercase tracking-wide text-primary font-medium mb-1">
                        {post.category}
                      </p>
                      <p className="text-xs text-textDark font-medium line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {post.title}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>

      <Footer />
    </div>
  );
}