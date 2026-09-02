import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import PostCard from "../components/blog/PostCart";
import Pagination from "../components/common/Pagination";
import api from "../services/api";

const categories = ["Marketing", "Design", "Tech", "Lifestyle"];

export default function Home() {
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
        {/* Post grid */}
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loading && (
              <p className="text-sm text-textMuted col-span-2">Loading posts...</p>
            )}

            {!loading && posts.length === 0 && (
              <p className="text-sm text-textMuted col-span-2">
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
            <p className="text-xs font-medium text-textDark mb-3">
              Popular categories
            </p>
            <div className="flex flex-col gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    setActiveCategory(activeCategory === cat ? null : cat)
                  }
                  className={`text-left text-xs px-2.5 py-1.5 rounded-md w-fit transition-colors ${
                    activeCategory === cat
                      ? "bg-primary/10 text-primaryDark"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <Footer />
    </div>
  );
}