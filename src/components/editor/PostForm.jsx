import { useState } from "react";
import MediaUploader from "./MediaUploader";
import { categories } from "../../constants/categories";

const mediaTypes = ["text", "image", "video", "audio"];

// mode: "create" | "edit". onSubmit receives (formValues, status) and
// handles the actual API call + navigation — keeps this component focused
// purely on the form itself, reusable in both contexts.
export default function PostForm({ initialData, onSubmit, mode = "create" }) {
  const [form, setForm] = useState({
    title: initialData?.title || "",
    content: initialData?.content || "",
    mediaType: initialData?.mediaType || "text",
    mediaUrl: initialData?.mediaUrl || "",
    thumbnail: initialData?.thumbnail || "",
    category: initialData?.category || categories[0].value,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleMediaTypeChange = (type) => {
    setForm({
      ...form,
      mediaType: type,
      mediaUrl: type === form.mediaType ? form.mediaUrl : "",
      thumbnail: type === form.mediaType ? form.thumbnail : "",
    });
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
      await onSubmit(form, status);
    } catch (err) {
      setError(err.response?.data?.msg || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
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
          onUploaded={(url) => setForm((prev) => ({ ...prev, mediaUrl: url }))}
          onThumbnailGenerated={(url) => setForm((prev) => ({ ...prev, thumbnail: url }))}
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
          {saving ? "Saving..." : mode === "edit" ? "Update & publish" : "Publish"}
        </button>
      </div>
    </div>
  );
}