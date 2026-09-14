import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MediaUploader from "../../components/editor/MediaUploader";
import AdminRichEditor from "../../components/editor/AdminRichEditor";
import AuthorPicker from "../../components/editor/AuthorPicker";
import { categories } from "../../constants/categories";
import { ADMIN_PATH } from "../../constants/adminPath";
import adminApi from "../../services/adminApi";

const mediaTypes = ["text", "image", "video", "audio"];

// Matches the Post model's content maxlength — applies to the actual saved
// string (i.e. the HTML markup, post-sanitization), not just visible text.
const MAX_CONTENT_LENGTH = 20000;

const TABS = [
  { id: "basic", label: "Basic Info" },
  { id: "content", label: "Content" },
  { id: "seo", label: "SEO" },
];

const emptyForm = {
  title: "",
  content: "",
  mediaType: "text",
  mediaUrl: "",
  thumbnail: "",
  category: categories[0].value,
  postAuthor: null,
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
};

export default function AdminCreatePost() {
  const navigate = useNavigate();
  const { id } = useParams(); // present only on /posts/:id/edit
  const isEditMode = Boolean(id);

  const [activeTab, setActiveTab] = useState("basic");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);

  useEffect(() => {
    if (!isEditMode) return;

    const fetchPost = async () => {
      setLoading(true);
      try {
        const { data } = await adminApi.get(`/admin/posts/${id}`);
        const post = data.post;
        setForm({
          title: post.title || "",
          content: post.content || "",
          mediaType: post.mediaType || "text",
          mediaUrl: post.mediaUrl || "",
          thumbnail: post.thumbnail || "",
          category: post.category || categories[0].value,
          postAuthor: post.postAuthor?._id || post.postAuthor || null,
          metaTitle: post.metaTitle || "",
          metaDescription: post.metaDescription || "",
          metaKeywords: post.metaKeywords || "",
        });
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to load this post.");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, isEditMode]);

  const handleMediaTypeChange = (type) => {
    // media type badalte hi purani uploaded file clear kar do — mismatch avoid karne ke liye
    setForm({ ...form, mediaType: type, mediaUrl: "", thumbnail: "" });
  };

  const handleSubmit = async (status) => {
    setError("");

    if (!form.title.trim()) {
      setError("Title is required.");
      setActiveTab("basic");
      return;
    }
    if (!form.content.trim()) {
      setError("Content is required.");
      setActiveTab("content");
      return;
    }
    if (form.content.length > MAX_CONTENT_LENGTH) {
      setError(
        `Content is too long — ${form.content.length.toLocaleString()} / ${MAX_CONTENT_LENGTH.toLocaleString()} characters.`
      );
      setActiveTab("content");
      return;
    }
    if (form.mediaType !== "text" && !form.mediaUrl) {
      setError(`Please upload a ${form.mediaType} file, or switch post type to Text.`);
      setActiveTab("basic");
      return;
    }

    setSaving(true);
    try {
      if (isEditMode) {
        await adminApi.patch(`/admin/posts/${id}`, { ...form, contentFormat: "html", status });
      } else {
        await adminApi.post("/admin/posts", { ...form, contentFormat: "html", status });
      }
      navigate(`/${ADMIN_PATH}/posts`);
    } catch (err) {
      setError(err.response?.data?.msg || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-sm text-textMuted">Loading post...</div>;
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-xl font-medium text-textDark mb-1">{isEditMode ? "Edit post" : "Create post"}</h1>
      <p className="text-xs text-textMuted mb-6">
        {isEditMode
          ? "Changes go live immediately if the post is already published."
          : "Published as your linked author profile — visible to readers immediately if you publish."}
      </p>

      <div className="bg-white border border-borderClr rounded-xl overflow-hidden">
        <div className="flex border-b border-borderClr">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`text-sm px-5 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-textMuted hover:text-textDark"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 flex flex-col gap-4">
          {activeTab === "basic" && (
            <>
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
                <label className="text-xs text-textMuted mb-1 block">Author</label>
                <AuthorPicker
                  value={form.postAuthor}
                  onChange={(id) => setForm({ ...form, postAuthor: id })}
                />
                <p className="text-[11px] text-textMuted mt-1">
                  Who this post is credited to on the site — not necessarily you.
                </p>
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
            </>
          )}

          {activeTab === "content" && (
            <div>
              <label className="text-xs text-textMuted mb-1 block">Content</label>
              <AdminRichEditor
                content={form.content}
                onChange={(html) => setForm({ ...form, content: html })}
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
          )}

          {activeTab === "seo" && (
            <>
              <p className="text-xs text-textMuted -mt-1">
                Optional — leave blank to fall back to the post title/content automatically.
              </p>
              <div>
                <label className="text-xs text-textMuted mb-1 block">
                  Meta Title <span className="text-textMuted/60">({form.metaTitle.length}/70)</span>
                </label>
                <input
                  type="text"
                  maxLength={70}
                  value={form.metaTitle}
                  onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                  placeholder="Shown as the clickable headline in Google search results"
                  className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs text-textMuted mb-1 block">
                  Meta Description <span className="text-textMuted/60">({form.metaDescription.length}/160)</span>
                </label>
                <textarea
                  maxLength={160}
                  rows="3"
                  value={form.metaDescription}
                  onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                  placeholder="Shown as the snippet text below the title in search results"
                  className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-textMuted mb-1 block">
                  Meta Keywords <span className="text-textMuted/60">({form.metaKeywords.length}/200)</span>
                </label>
                <input
                  type="text"
                  maxLength={200}
                  value={form.metaKeywords}
                  onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })}
                  placeholder="comma, separated, keywords"
                  className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary"
                />
                <p className="text-[11px] text-textMuted mt-1">
                  Note: Google hasn't used meta keywords for ranking since 2009 — this has no real SEO
                  effect, but some other tools/directories still read it, so it's harmless to fill in.
                </p>
              </div>
            </>
          )}

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
              {saving ? "Saving..." : isEditMode ? "Save & Publish" : "Publish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}