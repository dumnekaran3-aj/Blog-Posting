import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import MediaUploader from "../components/editor/MediaUploader";
import AdminRichEditor from "../components/editor/AdminRichEditor";
import { categories } from "../constants/categories";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const SUPPORT_EMAIL = "support@varitywire.com";

// Normal ('user' role) accounts get exactly one free post — moderators/
// analysts/admins are unrestricted. Backend enforces this for real
// (Post.controller.js createPost); this pre-check just avoids making
// someone fill out the whole form before finding out they can't publish.
// Beyond the free post, more posts only happen through the admin panel now
// (an admin creating/crediting a post to that user via postAuthor) — that's
// why this prompt points to support instead of any kind of "upgrade" flow.
function FreeLimitPrompt() {
  return (
    <div className="flex-1 max-w-md mx-auto w-full px-6 py-20 text-center">
      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
        <Lock size={20} />
      </div>
      <h1 className="text-lg font-medium text-textDark mb-2">You've used your free post</h1>
      <p className="text-sm text-textMuted mb-6">
        Every account gets one free post on VarityWire. To publish more, please get in touch with
        our support team and we'll help you out.
      </p>
      <div className="bg-white border border-borderClr rounded-xl p-5 text-left flex flex-col gap-1 mb-6">
        <p className="text-xs text-textMuted">Contact</p>
        <p className="text-sm font-medium text-textDark">VarityWire Support Team</p>
        <p className="text-xs text-textMuted">varitywire.com</p>
      </div>
      <a
        href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Request to publish more posts")}`}
        className="inline-flex items-center gap-2 bg-primary text-white text-sm px-5 py-2.5 rounded-md hover:bg-primary/90"
      >
        <Mail size={15} /> Email {SUPPORT_EMAIL}
      </a>
    </div>
  );
}

const mediaTypes = ["text", "image", "video", "audio"];

// Matches the server-side limit exactly (models/Post.model.js maxlength) —
// 20,000 chars ≈ 3,000–4,000 words. This now measures the actual HTML
// markup length (post-sanitization on the server), same as the admin
// panel's editor, since both write through the same rich-text editor.
const MAX_CONTENT_LENGTH = 20000;

export default function CreatePost() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    title: "",
    content: "",
    mediaType: "text",
    mediaUrl: "",
    category: categories[0].value,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    // Moderators/analysts/admins are never limited — only plain 'user' accounts
    if (user?.role !== "user") {
      setCheckingLimit(false);
      return;
    }

    const checkEligibility = async () => {
      try {
        const { data } = await api.get("/posts/mine");
        setLimitReached((data.posts || []).length >= 1);
      } catch (err) {
        // If this check itself fails, fall through to the form — the
        // backend still enforces the real limit on submit either way
      } finally {
        setCheckingLimit(false);
      }
    };
    checkEligibility();
  }, [user?.role]);

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
      setError(
        `Content is too long — ${form.content.length.toLocaleString()} / ${MAX_CONTENT_LENGTH.toLocaleString()} characters. Please shorten it before publishing.`
      );
      return;
    }
    if (form.mediaType !== "text" && !form.mediaUrl) {
      setError(`Please upload a ${form.mediaType} file, or switch media type to Text.`);
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post("/posts", { ...form, contentFormat: "html", status });
      navigate(`/blog/${data.post.slug}`);
    } catch (err) {
      if (err.response?.data?.code === "FREE_LIMIT_REACHED") {
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

  if (checkingLimit) {
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

  if (limitReached) {
    return (
      <div className="min-h-screen flex flex-col bg-bgLight">
        <Navbar />
        <FreeLimitPrompt />
        <Footer />
      </div>
    );
  }

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