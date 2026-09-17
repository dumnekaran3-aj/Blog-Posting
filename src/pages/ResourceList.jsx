import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import PostCard from "../components/blog/PostCart";
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

  // Switching between /blogs and /news reuses this component, so reset to
  // page 1 — staying on page 4 of a list that may only have 2 pages would
  // show an empty screen.
  useEffect(() => {
    setPage(1);
  }, [type]);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/posts", { params: { postType: type, page } });
        setPosts(data.posts || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [type, page]);

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

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <h1 className="text-2xl font-medium text-textDark mb-1">{isNews ? "News" : "Blogs"}</h1>
        <p className="text-sm text-textMuted mb-6">
          {isNews ? "Latest news and updates" : "Long-form articles, guides and opinions"}
        </p>

        {loading && <p className="text-sm text-textMuted">Loading...</p>}

        {!loading && posts.length === 0 && (
          <p className="text-sm text-textMuted">
            No {isNews ? "news" : "blogs"} published yet.{" "}
            <Link to="/" className="text-primary">
              Back to home
            </Link>
          </p>
        )}

        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          {!loading && posts.map((post) => <PostCard key={post._id} post={post} />)}
        </div>

        {!loading && posts.length > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        )}
      </div>

      <Footer />
    </div>
  );
}