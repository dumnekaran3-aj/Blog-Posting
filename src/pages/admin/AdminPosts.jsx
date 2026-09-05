import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus } from "lucide-react";
import adminApi from "../../services/adminApi";
import { ADMIN_PATH } from "../../constants/adminPath";

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get("/admin/posts", { params: { search } });
      setPosts(data.posts);
    } catch (err) {
      // leave list empty on failure
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchPosts, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const handleUnpublish = async (id) => {
    try {
      await adminApi.patch(`/admin/posts/${id}/unpublish`);
      setPosts((prev) => prev.map((p) => (p._id === id ? { ...p, status: "draft" } : p)));
    } catch (err) {
      // could add a toast here later
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await adminApi.delete(`/admin/posts/${id}`);
      setPosts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      // could add a toast here later
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-medium text-textDark">Posts</h1>
        <Link
          to={`/${ADMIN_PATH}/posts/new`}
          className="flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-1.5 rounded-md hover:bg-primary/90"
        >
          <Plus size={13} /> New post
        </Link>
      </div>
      <p className="text-xs text-textMuted mb-5">Moderate any post on the site</p>

      <div className="bg-white border border-borderClr rounded-xl px-3 py-2 flex items-center gap-2 mb-4 max-w-xs">
        <Search size={14} className="text-textMuted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title"
          className="text-xs outline-none w-full"
        />
      </div>

      <div className="bg-white border border-borderClr rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-bgLight text-textMuted">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Title</th>
              <th className="text-left px-4 py-2 font-medium">Author</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium">Views</th>
              <th className="text-right px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-textMuted">Loading...</td></tr>
            )}
            {!loading && posts.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-textMuted">No posts found.</td></tr>
            )}
            {!loading &&
              posts.map((post) => (
                <tr key={post._id} className="border-t border-borderClr">
                  <td className="px-4 py-2.5 text-textDark max-w-xs truncate">{post.title}</td>
                  <td className="px-4 py-2.5 text-textMuted">{post.author?.name || "Unknown"}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded ${
                        post.status === "published" ? "bg-success/10 text-success" : "bg-slate-200 text-textMuted"
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-textMuted">{post.viewsCount}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-2">
                      {post.status === "published" && (
                        <button onClick={() => handleUnpublish(post._id)} className="text-accent hover:underline">
                          Unpublish
                        </button>
                      )}
                      <button onClick={() => handleDelete(post._id, post.title)} className="text-danger hover:underline">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}