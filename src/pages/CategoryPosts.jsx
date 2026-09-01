import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import PostCard from "../components/blog/PostCart";
import Pagination from "../components/common/Pagination";
import { categories, categorySlug } from "../constants/categories";
import api from "../services/api";

export default function CategoryPosts() {
  const { slug } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  return (
    <div className="min-h-screen flex flex-col bg-bgLight">
      <Navbar />

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <h1 className="text-2xl font-medium text-textDark mb-1">
          {category.emoji} {category.value}
        </h1>
        <p className="text-sm text-textMuted mb-6">Posts in this category</p>

        {loading && <p className="text-sm text-textMuted">Loading posts...</p>}

        {!loading && posts.length === 0 && (
          <p className="text-sm text-textMuted">No posts in this category yet.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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