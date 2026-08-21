import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import PostCard from "../components/blog/PostCart";
import { categories, categorySlug } from "../constants/categories";
import api from "../services/api";

export default function CategoryPosts() {
  const { slug } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reverse-lookup: the URL only has the slug, backend filter needs the
  // exact category string (emoji-free) as originally stored on posts
  const category = categories.find((c) => categorySlug(c.value) === slug);

  useEffect(() => {
    if (!category) return;

    const fetchPosts = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/posts", { params: { category: category.value } });
        setPosts(data.posts || []);
      } catch (err) {
        // leave posts empty on failure
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [slug]);

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
      </div>

      <Footer />
    </div>
  );
}