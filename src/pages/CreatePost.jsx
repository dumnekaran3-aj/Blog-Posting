import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import MediaUploader from "../components/editor/MediaUploader";
import { categories } from "../constants/categories";
import api from "../services/api";

const mediaTypes = ["text", "image", "video", "audio"];

export default function CreatePost() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    content: "",
    mediaType: "text",
    mediaUrl: "",
    category: categories[0].value,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleMediaTypeChange = (type) => {
    // media type badalte hi purani uploaded file clear kar do — mismatch avoid karne ke liye
    setForm({ ...form, mediaType: type, mediaUrl: "" });
  };

  const handleSubmit = async (status) => {
    setError("");

    if (!form.title.trim() || !form.content.trim()) {
      setError("Title and content are required.");
      return;
    }
    if (form.mediaType !== "text" && !form.mediaUrl) {
      setError(`Please upload a ${form.mediaType} file, or switch media type to Text.`);
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post("/posts", { ...form, status });
      navigate(`/blog/${data.post.slug}`);
    } catch (err) {
      setError(err.response?.data?.msg || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bgLight">
      <Navbar />

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <h1 className="text-xl font-medium text-textDark mb-6">Create a new post</h1>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-textMuted mb-1 block">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Give your post a title"
              className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary bg-white"
            />
          </div>

          <div>
            <label className="text-xs text-textMuted mb-1 block">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary bg-white"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.emoji} {cat.value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-textMuted mb-1 block">Post type</label>
            <div className="flex gap-2">
              {mediaTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleMediaTypeChange(type)}
                  className={`text-xs px-3 py-1.5 rounded-md capitalize border transition-colors ${
                    form.mediaType === type
                      ? "bg-primary text-white border-primary"
                      : "text-textMuted border-borderClr hover:border-primary/40"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {form.mediaType !== "text" && (
            <MediaUploader
              mediaType={form.mediaType}
              mediaUrl={form.mediaUrl}
              onUploaded={(url) => setForm({ ...form, mediaUrl: url })}
            />
          )}

          <div>
            <label className="text-xs text-textMuted mb-1 block">Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write your post..."
              rows={10}
              className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary bg-white resize-none"
            />
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => handleSubmit("draft")}
              disabled={saving}
              className="text-sm border border-borderClr text-textDark px-4 py-2 rounded-md hover:bg-white disabled:opacity-60"
            >
              Save as draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("published")}
              disabled={saving}
              className="text-sm bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}