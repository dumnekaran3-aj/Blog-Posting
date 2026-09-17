import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Sparkles } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import PostCard from "../components/blog/PostCart";
import Pagination from "../components/common/Pagination";
import { useAuth } from "../context/AuthContext";
import { categories as allCategories, categorySlug } from "../constants/categories";
import api from "../services/api";

const categories = ["Marketing", "Design", "Tech", "Lifestyle"];

export default function Home() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  // Navbar search button lands here with ?search=<query> — pick that up as
  // the initial value so results show immediately instead of an empty box.
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [suggestedPosts, setSuggestedPosts] = useState([]);

  // Debounce — waits 400ms after the user stops typing before updating `search`.
  // Avoids firing an API call on every single keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Keep the URL in sync with the active search — makes the search
  // shareable/bookmarkable and is what lets the navbar search button
  // (which navigates to /?search=...) hand off into this page correctly.
  useEffect(() => {
    setSearchParams(search ? { search } : {}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Filter (category/search) badalte hi page 1 pe wapas — warna user kisi
  // filter change ke baad bhi purane page number pe atka reh sakta hai jahan
  // naye filter ke hisaab se posts hi na ho
  useEffect(() => {
    setPage(1);
  }, [activeCategory, search]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const params = { page };
        if (activeCategory) params.category = activeCategory;
        if (search) params.search = search;

        const { data } = await api.get("/posts", { params });
        setPosts(data.posts || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error("Failed to load posts:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [activeCategory, search, page]);

  // "Popular categories" ke neeche jo empty space tha, wahan user ke apne
  // interests (Settings/Dashboard mein set kiye hue) ke hisaab se suggested
  // posts dikhate hain — chhoti list, direct click se seedha post khulta
  // hai, koi "Show more" nahi (bas ek quick discovery list hai).
  useEffect(() => {
    const interests = user?.interests || [];
    if (interests.length === 0) {
      setSuggestedPosts([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        // Har interest se thode-thode posts le lete hain (max 3 categories
        // taaki zyada parallel calls na ho), fir merge+dedupe karke top 5
        // dikha dete hain — isse variety milti hai sirf ek category tak
        // simit rehne ke bajaye
        const requests = interests
          .slice(0, 3)
          .map((cat) => api.get("/posts", { params: { category: cat, limit: 3 } }));
        const responses = await Promise.all(requests);

        const seen = new Set();
        const merged = [];
        responses.forEach((res) => {
          (res.data.posts || []).forEach((p) => {
            if (!seen.has(p._id)) {
              seen.add(p._id);
              merged.push(p);
            }
          });
        });

        setSuggestedPosts(merged.slice(0, 6));
      } catch (err) {
        setSuggestedPosts([]);
      }
    };
    fetchSuggestions();
  }, [user?.id]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-bgLight">
      <Navbar />

      <section className="max-w-6xl mx-auto w-full px-6 pt-8 pb-4">
        <h1 className="text-2xl font-medium text-textDark mb-1">
          Ideas worth sharing
        </h1>
        <p className="text-sm text-textMuted">
          Fresh posts from writers across marketing, tech, and design
        </p>
      </section>

      <section className="max-w-6xl mx-auto w-full px-6 pb-10 grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
        {/* Post feed — single column, full width. Ek post ke niche doosri
            post aati hai (pehle 2-column grid tha, ab har post apni poori
            available width leti hai — jo pehle 2 posts milke leti thi) */}
        <div>
          <div className="flex flex-col gap-6">
            {loading && (
              <p className="text-sm text-textMuted">Loading posts...</p>
            )}

            {!loading && posts.length === 0 && (
              <p className="text-sm text-textMuted">
                {search || activeCategory
                  ? "No posts match your search."
                  : "No posts yet. Be the first to publish one."}
              </p>
            )}

            {!loading &&
              posts.map((post) => <PostCard key={post._id} post={post} />)}
          </div>

          {!loading && posts.length > 0 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
          )}
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          <div className="bg-white border border-borderClr rounded-xl px-3 py-2 flex items-center gap-2">
            <Search size={15} className="text-textMuted" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search posts"
              className="text-xs outline-none w-full placeholder:text-slate-400"
            />
          </div>

          <div className="bg-white border border-borderClr rounded-xl p-4">
            <p className="text-sm font-medium text-textDark mb-3">
              Popular categories
            </p>
            <div className="flex flex-col gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    setActiveCategory(activeCategory === cat ? null : cat)
                  }
                  className={`text-left text-sm px-3 py-2 rounded-md transition-colors ${
                    activeCategory === cat
                      ? "bg-primary/10 text-primaryDark font-medium"
                      : "text-slate-600 hover:bg-primary/5 hover:text-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* All categories — "Popular categories" upar sirf 4 shortcuts hain
              jo feed ko inline filter karte hain; ye poori list hai jo har
              category ke apne page pe le jaati hai */}
          <div className="bg-white border border-borderClr rounded-xl p-4">
            <p className="text-sm font-medium text-textDark mb-3">All categories</p>
            <div className="flex flex-col gap-1">
              {allCategories.map((cat) => (
                <Link
                  key={cat.value}
                  to={`/category/${categorySlug(cat.value)}`}
                  className="text-sm px-3 py-2 rounded-md text-slate-600 hover:bg-primary/5 hover:text-primary transition-colors"
                >
                  {cat.value}
                </Link>
              ))}
            </div>
          </div>

          {/* Suggested posts — user ke interests ke hisaab se, direct click
              se post khulta hai, koi excerpt/"Show more" nahi (quick discovery) */}
          {suggestedPosts.length > 0 && (
            <div className="bg-white border border-borderClr rounded-xl p-4">
              <p className="flex items-center gap-1.5 text-sm font-medium text-textDark mb-4">
                <Sparkles size={15} className="text-primary" /> Suggested for you
              </p>
              <div className="flex flex-col gap-4">
                {suggestedPosts.map((post) => (
                  <Link
                    key={post._id}
                    to={`/blog/${post.slug}`}
                    className="group block rounded-lg overflow-hidden border border-transparent hover:border-borderClr transition-colors"
                  >
                    {post.thumbnail || post.mediaUrl ? (
                      <img
                        src={post.thumbnail || post.mediaUrl}
                        alt={post.title}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-32 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-2xl font-medium">
                        {post.category?.charAt(0).toUpperCase() || "P"}
                      </div>
                    )}
                    <div className="pt-2 px-0.5 pb-1">
                      <p className="text-[10px] uppercase tracking-wide text-primary font-medium mb-1">
                        {post.category}
                      </p>
                      <p className="text-sm text-textDark font-medium line-clamp-2 leading-snug group-hover:text-primary transition-colors">
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