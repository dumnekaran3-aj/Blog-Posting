import { useEffect, useRef, useState } from "react";
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
  const { user } = useAuth();
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

  // View-duration tracking — feed algorithm ke timeImpression signal ke
  // liye. 30 second post ko dekhne ke baad ek baar fire hota hai. Sirf
  // logged-in users ke liye (backend endpoint ko dedup ke liye stable user
  // id chahiye — LikeButton jaisa hi pattern). Ek hi baar fire ho, isliye
  // 'sent' ref use kiya — StrictMode dev mein effect double-run hone se bhi
  // safe rahega, aur agar user page se jaldi chala jaye (30s se pehle) to
  // timeout cleanup ho jayega, koi call nahi jayegi.
  const viewTrackedRef = useRef(false);
  useEffect(() => {
    if (!post?._id || !user || viewTrackedRef.current) return;

    const VIEW_THRESHOLD_MS = 30 * 1000;
    const timer = setTimeout(() => {
      if (viewTrackedRef.current) return;
      viewTrackedRef.current = true;
      api.post(`/posts/${post._id}/view-duration`, { duration: 30 }).catch(() => {
        // background signal hai — fail hone pe user ko kuch dikhana zaroori nahi
      });
    }, VIEW_THRESHOLD_MS);

    return () => clearTimeout(timer);
  }, [post?._id, user]);

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
                initialLiked={post.isLiked}
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