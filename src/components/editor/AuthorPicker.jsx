import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import MediaUploader from "./MediaUploader";
import adminApi from "../../services/adminApi";

// apiClient/endpoint are configurable so the SAME component/UI works in
// both places that now offer this facility:
//   - admin panel (AdminCreatePost.jsx)  -> adminApi + /admin/authors (default, unchanged)
//   - regular one-free-post form (CreatePost.jsx) -> api + /authors
export default function AuthorPicker({ value, onChange, apiClient = adminApi, endpoint = "/admin/authors" }) {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newAuthor, setNewAuthor] = useState({ name: "", photo: "", bio: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadAuthors = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(endpoint);
      setAuthors(data.authors || []);
    } catch {
      setAuthors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuthors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const handleCreate = async () => {
    setError("");
    if (!newAuthor.name.trim()) {
      setError("Author name is required.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await apiClient.post(endpoint, newAuthor);
      setAuthors((prev) => [...prev, data.author].sort((a, b) => a.name.localeCompare(b.name)));
      onChange(data.author._id);
      setCreating(false);
      setNewAuthor({ name: "", photo: "", bio: "" });
    } catch (err) {
      setError(err.response?.data?.msg || "Could not create author profile.");
    } finally {
      setSaving(false);
    }
  };

  if (creating) {
    return (
      <div className="border border-borderClr rounded-md p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-textDark">New author profile</p>
          <button type="button" onClick={() => setCreating(false)} className="text-textMuted hover:text-textDark">
            <X size={14} />
          </button>
        </div>

        <input
          type="text"
          placeholder="Author name"
          value={newAuthor.name}
          onChange={(e) => setNewAuthor({ ...newAuthor, name: e.target.value })}
          className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary"
        />

        <div>
          <label className="text-xs text-textMuted mb-1 block">Photo</label>
          <MediaUploader
            mediaType="image"
            mediaUrl={newAuthor.photo}
            onUploaded={(url) => setNewAuthor({ ...newAuthor, photo: url })}
          />
        </div>

        <textarea
          placeholder="Short bio"
          rows="3"
          value={newAuthor.bio}
          onChange={(e) => setNewAuthor({ ...newAuthor, bio: e.target.value })}
          className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary resize-none"
        />

        {error && <p className="text-xs text-danger">{error}</p>}

        <button
          type="button"
          onClick={handleCreate}
          disabled={saving}
          className="text-xs bg-primary text-white px-3 py-2 rounded-md disabled:opacity-60 self-start"
        >
          {saving ? "Creating..." : "Create & use this author"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={loading}
        className="flex-1 text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary"
      >
        <option value="">No author profile (default)</option>
        {authors.map((a) => (
          <option key={a._id} value={a._id}>
            {a.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        title="Add new author profile"
        onClick={() => setCreating(true)}
        className="p-2 rounded-md border border-borderClr text-textMuted hover:border-primary/40 hover:text-primary"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}