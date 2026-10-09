import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import PostCard from "../components/blog/PostCart";
import PageHero from "../components/common/PageHero";
import TrendingShowcase from "../components/blog/TrendingShowcase";
import CategoriesCard from "../components/blog/CategoriesCard";
import Pagination from "../components/common/Pagination";
import SEOHead from "../components/common/SEOHead";
import api from "../services/api";

// ResourceList
// --------------
// One component serving both /blogs and /news — the only difference is the
// postType filter sent to the API and the copy on the page, so App.jsx
// mounts it twice with a different `type` prop rather than duplicating a
// near-identical page.
export default function ResourceList({ type }) {
  const isNews = type === "news";
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Debounce typing so we don't hit the API on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Switching between /blogs and /news reuses this component, so reset to
  // page 1 — staying on page 4 of a list that may only have 2 pages would
  // show an empty screen.
  useEffect(() => {
    setPage(1);
    setSearchInput("");
    setSearch("");
  }, [type]);

  // A new search also starts again from page 1
  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const params = { postType: type, page };
        if (search) params.search = search;
        const { data } = await api.get("/posts", { params });
        setPosts(data.posts || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [type, page, search]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-bgLight">
      <SEOHead
        title={isNews ? "News | VarityWire" : "Blogs | VarityWire"}
        description={
          isNews
            ? "Latest news and updates from VarityWire."
            : "In-depth blogs, guides and expert perspectives from VarityWire."
        }
        url={isNews ? "/news" : "/blogs"}
      />
      <Navbar />

      <PageHero
        crumbs={[{ label: isNews ? "News" : "Blog" }]}
        badge={isNews ? "Latest Updates" : "Editorial & Analysis"}
        title={isNews ? "News" : "Blog"}
        description={
          isNews
            ? "Latest news and updates from across technology, business, research and the world."
            : "Long-form articles, guides and opinions from our writers and guest contributors."
        }
        search={{
          value: searchInput,
          onChange: setSearchInput,
          placeholder: `Search ${isNews ? "news" : "articles"} by topic, author, or keyword...`,
        }}
      />

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 pt-8 pb-10 grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 items-start">
        <div>
          {loading && <p className="text-sm text-textMuted">Loading...</p>}

          {!loading && posts.length === 0 && (
            <p className="text-sm text-textMuted">
              {search ? "No posts match your search." : `No ${isNews ? "news" : "blogs"} published yet.`}{" "}
              <Link to="/" className="text-primary">
                Back to home
              </Link>
            </p>
          )}

          <div className="flex flex-col gap-6">
            {!loading && posts.map((post) => <PostCard key={post._id} post={post} />)}
          </div>

          {!loading && posts.length > 0 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
          )}
        </div>

        {/* Same sidebar idea as Home: media carousel + auto-scrolling list
            (only this page's type — blogs here, news on /news), then the
            category directory. */}
        <aside className="flex flex-col gap-4 md:sticky md:top-20 md:max-h-[calc(100vh-6rem)] md:overflow-y-auto md:pb-2">
          <TrendingShowcase postType={type} title={isNews ? "Trending news" : "Trending blogs"} />
          <CategoriesCard />
        </aside>
      </div>

      <Footer />
    </div>
  );
}