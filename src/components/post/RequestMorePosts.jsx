import { useEffect, useState } from "react";
import { Lock, Clock, Send, XCircle } from "lucide-react";
import api from "../../services/api";

// Replaces the old "email support" dead-end. Shown on CreatePost.jsx once
// the user has used all posts allowed by their postLimit (see
// models/User.js + Post.controller.js createPost). Checks the user's own
// latest request on mount so a pending/rejected request shows the right
// state instead of just re-showing the form every time.
export default function RequestMorePosts() {
  const [loading, setLoading] = useState(true);
  const [latest, setLatest] = useState(null); // last PostRequest, or null
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/post-requests/mine");
        setLatest(data.request);
      } catch (err) {
        // Fall back to showing the form — not fatal
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/post-requests", { message });
      setJustSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.msg || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 max-w-md mx-auto w-full px-6 py-20 text-center">
        <p className="text-sm text-textMuted">Loading...</p>
      </div>
    );
  }

  // Pending — either just submitted, or an earlier pending request still
  // waiting on review.
  if (justSubmitted || latest?.status === "pending") {
    return (
      <div className="flex-1 max-w-md mx-auto w-full px-6 py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <Clock size={20} />
        </div>
        <h1 className="text-lg font-medium text-textDark mb-2">Request sent</h1>
        <p className="text-sm text-textMuted">
          We'll notify you as soon as it's reviewed. You can publish more posts as soon as it's approved.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-md mx-auto w-full px-6 py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
        <Lock size={20} />
      </div>
      <h1 className="text-lg font-medium text-textDark mb-2">You've used all your posts</h1>
      <p className="text-sm text-textMuted mb-6">
        Tell us why you'd like to publish more, and a Super Admin will review your request.
      </p>

      {latest?.status === "rejected" && (
        <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 text-left flex gap-2 mb-5">
          <XCircle size={16} className="text-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-danger mb-0.5">Your last request was declined</p>
            <p className="text-xs text-textMuted">{latest.rejectionReason}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-left">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          maxLength={500}
          rows={4}
          placeholder="Why do you need more posts?"
          className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary resize-none"
        />
        <p className="text-[11px] text-textMuted text-right -mt-1">{message.length}/500</p>

        {error && <p className="text-xs text-danger">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !message.trim()}
          className="inline-flex items-center justify-center gap-2 bg-primary text-white text-sm px-5 py-2.5 rounded-md hover:bg-primary/90 disabled:opacity-60"
        >
          <Send size={15} /> {submitting ? "Sending..." : "Send request"}
        </button>
      </form>
    </div>
  );
}