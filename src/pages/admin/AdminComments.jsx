import { useEffect, useState } from "react";
import adminApi from "../../services/adminApi";

export default function AdminComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get("/admin/comments");
      setComments(data.comments);
    } catch (err) {
      // leave list empty on failure
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await adminApi.delete(`/admin/comments/${id}`);
      setComments((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      // could add a toast here later
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-medium text-textDark mb-1">Comments</h1>
      <p className="text-xs text-textMuted mb-5">Moderate comments across the whole site</p>

      {loading && <p className="text-sm text-textMuted">Loading...</p>}
      {!loading && comments.length === 0 && <p className="text-sm text-textMuted">No comments yet.</p>}

      <div className="flex flex-col gap-2">
        {comments.map((c) => (
          <div key={c._id} className="bg-white border border-borderClr rounded-xl p-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-textDark">{c.text}</p>
              <p className="text-[11px] text-textMuted mt-1">
                {c.author?.name || "Unknown"} on <span className="text-primary">{c.post?.title || "deleted post"}</span> &middot;{" "}
                {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </p>
            </div>
            <button onClick={() => handleDelete(c._id)} className="text-xs text-danger hover:underline shrink-0">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}