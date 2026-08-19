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
              <span>By {post.author?.name || "Unknown"}</span>
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
                initialLiked={user ? post.likes?.includes(user.id) : false}
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