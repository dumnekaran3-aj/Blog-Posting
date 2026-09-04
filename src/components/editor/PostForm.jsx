import { useState } from "react";
import MediaUploader from "./MediaUploader";
import { categories } from "../../constants/categories";

const mediaTypes = ["text", "image", "video", "audio"];

// Matches the server-side limit exactly (models/Post.model.js maxlength +
// middleware/validators.js)
const MAX_CONTENT_LENGTH = 20000;

// mode: "create" | "edit". onSubmit receives (formValues, status) and
// handles the actual API call + navigation — keeps this component focused
// purely on the form itself, reusable in both contexts.
export default function PostForm({ initialData, onSubmit, mode = "create" }) {
  const [form, setForm] = useState({
    title: initialData?.title || "",
    content: initialData?.content || "",
    // Existing posts saved before this field existed have no textStyle in
    // the DB (undefined) — BlogDetail/PostCard fall back to "bold" for
    // those so old posts don't visually change, so the edit form should
    // preselect the same thing rather than silently defaulting to "normal"
    textStyle: initialData?.textStyle || "bold",
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
    if (form.content.length > MAX_CONTENT_LENGTH) {
      setError(`Content is too long — ${form.content.length.toLocaleString()} / ${MAX_CONTENT_LENGTH.toLocaleString()} characters. Please shorten it before saving.`);
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
          {saving ? "Saving..." : mode === "edit" ? "Update & publish" : "Publish"}
        </button>
      </div>
    </div>
  );
}