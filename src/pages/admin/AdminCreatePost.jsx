import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MediaUploader from "../../components/editor/MediaUploader";
import { categories } from "../../constants/categories";
import { ADMIN_PATH } from "../../constants/adminPath";
import adminApi from "../../services/adminApi";

const mediaTypes = ["text", "image", "video", "audio"];

// Matches the public CreatePost + server-side limit exactly
const MAX_CONTENT_LENGTH = 20000;

export default function AdminCreatePost() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    content: "",
    textStyle: "normal",
    mediaType: "text",
    mediaUrl: "",
    thumbnail: "",
    category: categories[0].value,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleMediaTypeChange = (type) => {
    // media type badalte hi purani uploaded file clear kar do — mismatch avoid karne ke liye
    setForm({ ...form, mediaType: type, mediaUrl: "", thumbnail: "" });
  };

  const handleSubmit = async (status) => {
    setError("");

    if (!form.title.trim() || !form.content.trim()) {
      setError("Title and content are required.");
      return;
    }
    if (form.content.length > MAX_CONTENT_LENGTH) {
      setError(
        `Content is too long — ${form.content.length.toLocaleString()} / ${MAX_CONTENT_LENGTH.toLocaleString()} characters.`
      );
      return;
    }
    if (form.mediaType !== "text" && !form.mediaUrl) {
      setError(`Please upload a ${form.mediaType} file, or switch post type to Text.`);
      return;
    }

    setSaving(true);
    try {
      await adminApi.post("/admin/posts", { ...form, status });
      navigate(`/${ADMIN_PATH}/posts`);
    } catch (err) {
      setError(err.response?.data?.msg || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-medium text-textDark mb-1">Create post</h1>
      <p className="text-xs text-textMuted mb-6">
        Published as your linked author profile — visible to readers immediately if you publish.
      </p>

      <div className="bg-white border border-borderClr rounded-xl p-6 flex flex-col gap-4">
        <div>
          <label className="text-xs text-textMuted mb-1 block">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Give the post a title"
            className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-xs text-textMuted mb-1 block">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary"
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
            onThumbnailGenerated={(url) => setForm({ ...form, thumbnail: url })}
          />
        )}

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-textMuted block">Content</label>
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
            placeholder="Write the post..."
            rows={10}
            className={`w-full text-sm border rounded-md px-3 py-2 outline-none resize-none ${
              form.content.length > MAX_CONTENT_LENGTH
                ? "border-danger focus:border-danger"
                : "border-borderClr focus:border-primary"
            } ${form.textStyle === "bold" ? "font-bold" : form.textStyle === "italic" ? "italic" : ""}`}
          />

          <div className="flex items-center justify-between mt-1">
            <p
              className={`text-[11px] ${
                form.content.length > MAX_CONTENT_LENGTH ? "text-danger font-medium" : "text-textMuted"
              }`}
            >
              {form.content.length.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()} characters
            </p>
          </div>
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={() => handleSubmit("draft")}
            disabled={saving || form.content.length > MAX_CONTENT_LENGTH}
            className="text-sm border border-borderClr text-textDark px-4 py-2 rounded-md hover:bg-bgLight disabled:opacity-60"
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
  );
}