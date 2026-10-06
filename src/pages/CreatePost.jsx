import { useEffect, useState } from "react";
import { postPath } from "../utils/postUrl";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import MediaUploader from "../components/editor/MediaUploader";
import AdminRichEditor from "../components/editor/AdminRichEditor";
import AuthorPicker from "../components/editor/AuthorPicker";
import RequestMorePosts from "../components/post/RequestMorePosts";
import { categories, postTypes } from "../constants/categories";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const mediaTypes = ["text", "image", "video", "audio"];

// Matches the Post model's content maxlength (models/Post.model.js) — same
// hard ceiling the admin panel's editor enforces.
const MAX_CONTENT_LENGTH = 20000;

const TABS = [
  { id: "basic", label: "Basic Info" },
  { id: "content", label: "Content" },
  { id: "seo", label: "SEO" },
];

const emptyForm = {
  title: "",
  content: "",
  textStyle: "normal",
  mediaType: "text",
  mediaUrl: "",
  thumbnail: "",
  category: categories[0].value,
  postType: "blog",
  postAuthor: null,
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
};

// Handles BOTH "/create" (new post) and "/edit/:id" (editing an existing
// post) — same pattern AdminCreatePost.jsx uses, isEditMode is derived
// purely from whether a route param `id` is present. This gives regular
// users the exact same create/edit facility as the admin panel (Basic
// Info / Content / SEO tabs, Type, Category, Author picker, media
// uploader, rich-text editor) while still keeping the post-limit gate and
// public Navbar/Footer chrome that only this page needs.
export default function CreatePost() {
  const navigate = useNavigate();
  const { id } = useParams(); // present only on /edit/:id
  const isEditMode = Boolean(id);
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("basic");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [notFound, setNotFound] = useState(false);

  // Only relevant in create mode — editing an already-existing post is
  // never blocked by the post limit, only creating a NEW one is.
  const [checkingLimit, setCheckingLimit] = useState(!isEditMode);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;

    const fetchPost = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/posts/id/${id}`);
        const post = data.post;
        setForm({
          title: post.title || "",
          content: post.content || "",
          textStyle: post.textStyle || "normal",
          mediaType: post.mediaType || "text",
          mediaUrl: post.mediaUrl || "",
          thumbnail: post.thumbnail || "",
          category: post.category || categories[0].value,
          postType: post.postType === "news" ? "news" : "blog",
          postAuthor: post.postAuthor?._id || post.postAuthor || null,
          metaTitle: post.metaTitle || "",
          metaDescription: post.metaDescription || "",
          metaKeywords: post.metaKeywords || "",
        });
      } catch (err) {
        setNotFound(true);
        setError(err.response?.data?.msg || "This post could not be found, or you don't have permission to edit it.");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, isEditMode]);

  useEffect(() => {
    // Moderators/analysts/admins are never limited — only plain 'user' accounts
    if (isEditMode || user?.role !== "user") {
      setCheckingLimit(false);
      return;
    }

    const checkEligibility = async () => {
      try {
        // Fresh from the server, not the cached AuthContext user — that one
        // only refreshes on page load, so it would be stale right after
        // creating a post or getting an approval. Compared using postsUsed
        // (the lifetime counter the backend actually enforces), NOT a live
        // post count, so deleting a post can't make this screen think a
        // slot has been freed up.
        const { data } = await api.get("/auth/me");
        const { postsUsed = 0, postLimit = 1 } = data.user || {};
        setLimitReached(postsUsed >= postLimit);
      } catch (err) {
        // If this check itself fails, fall through to the form — the
        // backend still enforces the real limit on submit either way
      } finally {
        setCheckingLimit(false);
      }
    };
    checkEligibility();
  }, [isEditMode, user?.role]);

  const handleMediaTypeChange = (type) => {
    // media type badalte hi purani uploaded file clear kar do — mismatch avoid karne ke liye
    setForm((prev) => ({ ...prev, mediaType: type, mediaUrl: "", thumbnail: "" }));
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
      const payload = { ...form, contentFormat: "html", status };
      const { data } = isEditMode
        ? await api.put(`/posts/${id}`, payload)
        : await api.post("/posts", payload);
      navigate(postPath(data.post));
    } catch (err) {
      if (!isEditMode && err.response?.data?.code === "FREE_LIMIT_REACHED") {
        // Backend is the real source of truth — if the frontend's own
        // pre-check somehow missed this (stale state, race condition),
        // flip to the same prompt the pre-check would have shown
        setLimitReached(true);
      } else {
        setError(err.response?.data?.msg || "Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (checkingLimit || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-bgLight">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-textMuted">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isEditMode && limitReached) {
    return (
      <div className="min-h-screen flex flex-col bg-bgLight">
        <Navbar />
        <RequestMorePosts />
        <Footer />
      </div>
    );
  }

  if (isEditMode && notFound) {
    return (
      <div className="min-h-screen flex flex-col bg-bgLight">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto w-full px-6 py-20 text-center">
          <p className="text-sm text-textMuted">{error}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bgLight">
      <Navbar />

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        <h1 className="text-xl font-medium text-textDark mb-1">{isEditMode ? "Edit post" : "Create your post"}</h1>
        <p className="text-xs text-textMuted mb-6">
          {isEditMode
            ? "Changes go live immediately if the post is already published."
            : "Visible to readers immediately if you publish."}
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
                    placeholder="Give your post a title"
                    className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs text-textMuted mb-1 block">Type</label>
                  <div className="flex gap-2">
                    {postTypes.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setForm({ ...form, postType: t.value })}
                        className={`text-xs px-4 py-1.5 rounded-md border transition-colors ${
                          form.postType === t.value
                            ? "bg-primary text-white border-primary"
                            : "text-textMuted border-borderClr hover:border-primary/40"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-textMuted mt-1">
                    Decides whether this shows under Resource Center → Blogs or → News.
                  </p>
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
                    onChange={(authorId) => setForm({ ...form, postAuthor: authorId })}
                    apiClient={api}
                    endpoint="/authors"
                  />
                  <p className="text-[11px] text-textMuted mt-1">
                    Who this post is credited to on the site — leave blank to publish under your own name.
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

                {/* Same rich-text editor the admin panel uses — bold, italic,
                    underline, headings, lists, links, tables, images, charts.
                    Saved as sanitized HTML (server strips anything outside its
                    whitelist regardless of what this editor actually produced). */}
                <AdminRichEditor content={form.content} onChange={(html) => setForm({ ...form, content: html })} />

                <div className="flex items-center justify-between mt-1">
                  <p
                    className={`text-[11px] ${
                      form.content.length > MAX_CONTENT_LENGTH ? "text-danger font-medium" : "text-textMuted"
                    }`}
                  >
                    {form.content.length.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()} characters
                  </p>
                  {form.content.length > MAX_CONTENT_LENGTH && (
                    <p className="text-[11px] text-danger font-medium">
                      {(form.content.length - MAX_CONTENT_LENGTH).toLocaleString()} over limit
                    </p>
                  )}
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
                {saving ? "Saving..." : isEditMode ? "Update & Publish" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}