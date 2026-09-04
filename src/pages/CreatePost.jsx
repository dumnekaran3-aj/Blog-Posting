import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import MediaUploader from "../components/editor/MediaUploader";
import { categories } from "../constants/categories";
import api from "../services/api";

const mediaTypes = ["text", "image", "video", "audio"];

// Matches the server-side limit exactly (models/Post.model.js maxlength +
// middleware/validators.js) — 20,000 chars ≈ 3,000–4,000 words, generous
// for a long post while keeping a hard ceiling so nothing near-unbounded
// ever gets typed, stored, or shipped in every feed response.
const MAX_CONTENT_LENGTH = 20000;

export default function CreatePost() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    content: "",
    textStyle: "normal",
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
    if (form.content.length > MAX_CONTENT_LENGTH) {
      setError(`Content is too long — ${form.content.length.toLocaleString()} / ${MAX_CONTENT_LENGTH.toLocaleString()} characters. Please shorten it before publishing.`);
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
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-textMuted block">Content</label>

              {/* Whole-post text style — persists with the post, applied
                  consistently on the feed card and the full post page.
                  Just 3 fixed states, not rich text, so there's no markup
                  to sanitize and no injection surface. */}
              <div className="flex gap-1">
                {[
                  { value: "normal", label: "Normal" },
                  { value: "bold", label: "Bold" },
                  { value: "italic", label: "Italic" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, textStyle: opt.value })}
                    className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
                      form.textStyle === opt.value
                        ? "bg-primary text-white border-primary"
                        : "text-textMuted border-borderClr hover:border-primary/40"
                    } ${opt.value === "bold" ? "font-bold" : opt.value === "italic" ? "italic" : ""}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write your post..."
              rows={10}
              className={`w-full text-sm border rounded-md px-3 py-2 outline-none bg-white resize-none ${
                form.content.length > MAX_CONTENT_LENGTH
                  ? "border-danger focus:border-danger"
                  : "border-borderClr focus:border-primary"
              } ${form.textStyle === "bold" ? "font-bold" : form.textStyle === "italic" ? "italic" : ""}`}
            />

            <div className="flex items-center justify-between mt-1">
              <p className={`text-[11px] ${form.content.length > MAX_CONTENT_LENGTH ? "text-danger font-medium" : "text-textMuted"}`}>
                {form.content.length.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()} characters
                {" · "}
                {form.content.split("\n").length.toLocaleString()} lines
              </p>
              {form.content.length > MAX_CONTENT_LENGTH && (
                <p className="text-[11px] text-danger font-medium">
                  {(form.content.length - MAX_CONTENT_LENGTH).toLocaleString()} over limit
                </p>
              )}
            </div>
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => handleSubmit("draft")}
              disabled={saving || form.content.length > MAX_CONTENT_LENGTH}
              className="text-sm border border-borderClr text-textDark px-4 py-2 rounded-md hover:bg-white disabled:opacity-60"
            >
              Save as draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("published")}
              disabled={saving || form.content.length > MAX_CONTENT_LENGTH}
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