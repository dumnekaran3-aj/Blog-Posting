import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { categories, categorySlug } from "../../constants/categories";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

// PostSidebar
// -------------
// Fills the empty right-hand space on the post detail page with the two
// things that actually help a reader go somewhere next: the category list,
// and the same interest-based suggestions the home page shows. Suggestions
// exclude the post currently being read (`excludePostId`) — recommending
// the page you're already on is noise.
export default function PostSidebar({ activeCategory, excludePostId }) {
  const { user } = useAuth();
  const [suggestedPosts, setSuggestedPosts] = useState([]);

  useEffect(() => {
    const interests = user?.interests || [];

    const fetchSuggestions = async () => {
      try {
        // Logged-in with interests -> personalized. Otherwise fall back to
        // this post's own category, so an anonymous reader still gets
        // something relevant instead of an empty box.
        const sources = interests.length > 0 ? interests.slice(0, 3) : activeCategory ? [activeCategory] : [];
        if (sources.length === 0) {
          setSuggestedPosts([]);
          return;
        }

        const responses = await Promise.all(
          sources.map((cat) => api.get("/posts", { params: { category: cat, limit: 4 } }))
        );

        const seen = new Set();
        const merged = [];
        responses.forEach((res) => {
          (res.data.posts || []).forEach((p) => {
            if (p._id !== excludePostId && !seen.has(p._id)) {
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
  }, [user?.id, activeCategory, excludePostId]);

  return (
    <aside className="flex flex-col gap-4">
      <div className="bg-white border border-borderClr rounded-xl p-4">
        <p className="text-sm font-medium text-textDark mb-3">Categories</p>
        <div className="flex flex-col gap-1">
          {categories.map((cat) => (
            <Link
              key={cat.value}
              to={`/category/${categorySlug(cat.value)}`}
              className={`text-sm px-3 py-2 rounded-md transition-colors ${
                activeCategory === cat.value
                  ? "bg-primary/10 text-primaryDark font-medium"
                  : "text-slate-600 hover:bg-primary/5 hover:text-primary"
              }`}
            >
              {cat.value}
            </Link>
          ))}
        </div>
      </div>

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
  );
}