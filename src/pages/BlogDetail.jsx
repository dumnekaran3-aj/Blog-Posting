import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Eye, Home as HomeIcon, ChevronRight } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import LikeButton from "../components/blog/LikeButton";
import ShareButton from "../components/blog/ShareButton";
import CommentThread from "../components/blog/CommentThread";
import AuthorCard from "../components/blog/AuthorCard";
import PostSidebar from "../components/blog/PostSidebar";
import Lightbox from "../components/common/Lightbox";
import { categorySlug } from "../constants/categories";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import renderPostContent from "../utils/renderPostContent";
import renderHtmlPostContent, { htmlToPreviewText } from "../utils/renderHtmlPostContent";
import SEOHead from "../components/common/SEOHead";

// Meta-description fallback when the admin hasn't set one manually — strips
// the plain-format markdown-ish tokens (bold/italic/color/table/chart)
// down to readable text. Doesn't need to be pixel-perfect, just readable.
function stripPlainTokens(text) {
  return (text || "")
    .replace(/```chart:(bar|line|pie)[\s\S]*?```/g, "")
    .replace(/\{c:#[0-9A-Fa-f]{6}\}([^{]+)\{\/c\}/g, "$1")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/__([^_\n]+)__/g, "$1")
    .replace(/~~([^~\n]+)~~/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function BlogDetail() {
  const { slug } = useParams();
  const { user, socket } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [authorLightboxOpen, setAuthorLightboxOpen] = useState(false);

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

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8">
        <div className="min-w-0">
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
            <SEOHead
              title={post.metaTitle || `${post.title} | VarityWire`}
              description={
                post.metaDescription ||
                (post.contentFormat === "html" ? htmlToPreviewText(post.content) : stripPlainTokens(post.content)).slice(0, 160)
              }
              keywords={post.metaKeywords}
              image={post.thumbnail}
              url={`/blog/${post.slug}`}
              type="article"
              jsonLd={{
                "@context": "https://schema.org",
                "@type": "Article",
                headline: post.metaTitle || post.title,
                description: post.metaDescription || undefined,
                image: post.thumbnail ? [post.thumbnail] : undefined,
                author: (post.postAuthor?.name || post.author?.name)
                  ? { "@type": "Person", name: post.postAuthor?.name || post.author?.name }
                  : undefined,
                datePublished: post.createdAt,
                dateModified: post.updatedAt || post.createdAt,
                mainEntityOfPage: `https://varitywire.com/blog/${post.slug}`,
              }}
            />

            {/* Breadcrumb — Home / Blog|News / Category / Title. Title is
                the current page so it's plain text, everything before it
                navigates. */}
            <nav className="flex items-center gap-2 text-sm text-textMuted mb-4 flex-wrap">
              <Link
                to="/"
                className="hover:text-primary transition-colors flex items-center px-1.5 py-1 rounded hover:bg-primary/5"
                aria-label="Home"
              >
                <HomeIcon size={16} />
              </Link>
              <ChevronRight size={14} className="text-textMuted/50" />
              <Link
                to={post.postType === "news" ? "/news" : "/blogs"}
                className="hover:text-primary transition-colors px-1.5 py-1 rounded hover:bg-primary/5"
              >
                {post.postType === "news" ? "News" : "Blog"}
              </Link>
              {post.category && (
                <>
                  <ChevronRight size={14} className="text-textMuted/50" />
                  <Link
                    to={`/category/${categorySlug(post.category)}`}
                    className="hover:text-primary transition-colors px-1.5 py-1 rounded hover:bg-primary/5"
                  >
                    {post.category}
                  </Link>
                </>
              )}
              <ChevronRight size={14} className="text-textMuted/50" />
              <span className="text-textDark font-medium truncate max-w-[280px]">{post.title}</span>
            </nav>

            <h1 className="text-2xl font-medium text-textDark mb-2">{post.title}</h1>

            <div className="flex items-center gap-2 text-xs text-textMuted mb-5">
              {/* Avatar click => enlarge (Lightbox), naam click => profile */}
              <button
                type="button"
                onClick={() => post.author?.avatar && setAuthorLightboxOpen(true)}
                aria-label={`View ${post.author?.name || "user"}'s profile photo`}
              >
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
              </button>
              {authorLightboxOpen && (
                <Lightbox
                  src={post.author?.avatar}
                  alt={post.author?.name}
                  onClose={() => setAuthorLightboxOpen(false)}
                />
              )}
              <Link to={`/profile/${post.author?._id || post.author?.id}`} className="hover:text-primary">
                By {post.author?.name || "Unknown"}
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

            <div
              className={`text-sm text-textDark leading-relaxed whitespace-pre-wrap mb-6 ${
                post.textStyle === "italic" ? "italic" : post.textStyle === "normal" ? "" : "font-bold"
              } [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:mt-3 [&_h1]:mb-1 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:border-collapse [&_table]:w-full [&_td]:border [&_td]:border-borderClr [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-borderClr [&_th]:px-2 [&_th]:py-1 [&_th]:bg-bgLight [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:rounded-md [&_blockquote]:border-l-2 [&_blockquote]:border-borderClr [&_blockquote]:pl-3 [&_blockquote]:italic"
              }`}
            >
              {post.contentFormat === "html" ? renderHtmlPostContent(post.content) : renderPostContent(post.content)}
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

            {post.postAuthor && <AuthorCard author={post.postAuthor} category={post.category} />}

            <CommentThread postId={post._id} />
          </>
        )}
        </div>

        {/* Right column — categories + suggestions. Only rendered once the
            post has loaded, so we can pass its category as the fallback
            suggestion source for logged-out readers. */}
        {!loading && post && (
          <PostSidebar activeCategory={post.category} excludePostId={post._id} />
        )}
      </div>

      <Footer />
    </div>
  );
}