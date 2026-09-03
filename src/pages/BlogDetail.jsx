import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Eye } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import LikeButton from "../components/blog/LikeButton";
import ShareButton from "../components/blog/ShareButton";
import CommentThread from "../components/blog/CommentThread";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function BlogDetail() {
  const { slug } = useParams();
  const { user, socket } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const { data } = await api.get(`/posts/${slug}`);
        setPost(data.post);
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  // Is post ke "room" mein join karo — LikeButton aur CommentThread dono
  // isi shared socket se 'post:likeUpdate'/'post:newComment' events sunte
  // hain, join yahan page-level pe ek hi baar hota hai
  useEffect(() => {
    if (!socket || !post?._id) return;

    socket.emit("post:join", post._id);
    return () => socket.emit("post:leave", post._id);
  }, [socket, post?._id]);

  // ---- Time-on-page tracking (feeds the "timeImpression" ranking signal) ----
  // Backend har user ke liye is post ka duration EXACTLY EK BAAR EVER count
  // karta hai (PostView unique index se permanent dedup) — isliye humein
  // baar-baar bhejne ki zaroorat nahi, bas jab user page chhode (SPA se
  // navigate kare, ya tab/window band kare) tab ek baar total active time bhej dena hai.
  useEffect(() => {
    // Route protected hai (login required) — agar user logged in nahi hai
    // to kuch track hi nahi karna
    if (!post?._id || !user?.id) return;

    const MIN_TRACKED_SECONDS = 4; // galti se click karke turant back jaana "engagement" nahi hai

    let activeStartedAt = Date.now(); // null jab tab hidden ho (paused)
    let accumulatedSeconds = 0;
    let alreadySent = false;

    const sendDuration = () => {
      if (alreadySent) return;

      const activeNow = activeStartedAt ? (Date.now() - activeStartedAt) / 1000 : 0;
      const totalSeconds = Math.round(accumulatedSeconds + activeNow);
      if (totalSeconds < MIN_TRACKED_SECONDS) return;

      alreadySent = true;

      // sendBeacon custom headers allow nahi karta, aur ye route protected
      // hai — isliye fetch + keepalive use kar rahe hain, jo tab band hote
      // waqt bhi request complete hone deta hai (regular axios/XHR us case
      // mein reliably kaam nahi karta). Auth ab httpOnly cookie se hoti hai,
      // isliye credentials:'include' zaroori hai (cookie manually attach
      // nahi kar sakte, JS use padh hi nahi sakti).
      const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      fetch(`${baseURL}/posts/${post._id}/view-duration`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest", // required by backend CSRF check
        },
        body: JSON.stringify({ duration: totalSeconds }),
        keepalive: true,
      }).catch(() => {}); // best-effort — fail ho jaye to bhi user experience pe asar nahi
    };

    // Tab background mein jaye to timer pause karo — sirf actual active
    // reading time count hona chahiye, background time nahi
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (activeStartedAt) {
          accumulatedSeconds += (Date.now() - activeStartedAt) / 1000;
          activeStartedAt = null;
        }
      } else {
        activeStartedAt = Date.now();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    // 'pagehide' beforeunload se zyada reliable hai (mobile Safari/bfcache
    // ke saath bhi kaam karta hai) — tab/window band hone pe fire hota hai
    window.addEventListener("pagehide", sendDuration);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", sendDuration);
      sendDuration(); // SPA ke andar dusre page pe navigate karne pe bhi bhej do
    };
  }, [post?._id, user?.id]);

  const renderMedia = () => {
    if (!post?.mediaUrl) return null;

    if (post.mediaType === "image") {
      return (
        <img
          src={post.mediaUrl}
          alt={post.title}
          className="w-full rounded-lg mb-5 max-h-[420px] object-cover"
        />
      );
    }
    if (post.mediaType === "video") {
      return (
        <video
          src={post.mediaUrl}
          controls
          className="w-full rounded-lg mb-5 max-h-[420px]"
        />
      );
    }
    if (post.mediaType === "audio") {
      return (
        <audio src={post.mediaUrl} controls className="w-full mb-5" />
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-bgLight">
      <Navbar />

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        {loading && <p className="text-sm text-textMuted">Loading post...</p>}

        {!loading && notFound && (
          <div className="text-center py-16">
            <p className="text-sm text-textMuted mb-2">This post could not be found.</p>
            <Link to="/" className="text-sm text-primary">
              Back to home
            </Link>
          </div>
        )}

        {!loading && post && (
          <>
            {post.category && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary">
                {post.category}
              </span>
            )}

            <h1 className="text-2xl font-medium text-textDark mt-3 mb-2">{post.title}</h1>

            <div className="flex items-center gap-2 text-xs text-textMuted mb-5">
              <Link to={`/profile/${post.author?._id || post.author?.id}`} className="flex items-center gap-2 hover:text-primary">
                {post.author?.avatar ? (
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-medium">
                    {post.author?.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                )}
                <span>By {post.author?.name || "Unknown"}</span>
              </Link>
              <span>&middot;</span>
              <span>
                {new Date(post.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            {renderMedia()}

            <div className="text-sm text-textDark leading-relaxed whitespace-pre-wrap mb-6">
              {post.content}
            </div>

            <div className="flex items-center gap-5 border-t border-b border-borderClr py-3">
              <LikeButton
                postId={post._id}
                initialLikesCount={post.likesCount}
                initialLiked={post.isLiked || false}
                size="lg"
              />
              <ShareButton url={`/blog/${post.slug}`} title={post.title} size="lg" />
              <span className="flex items-center gap-1 text-sm text-textMuted ml-auto">
                <Eye size={16} /> {post.viewsCount} views
              </span>
            </div>

            <CommentThread postId={post._id} />
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}