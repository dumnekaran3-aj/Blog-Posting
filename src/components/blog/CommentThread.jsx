import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

// Facebook-style relative time ("2h", "3d", "5m") instead of a full date —
// keeps the comment row compact.
function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// Backend threading can nest a reply-to-a-reply arbitrarily deep — visually
// flattening every descendant into ONE list under the original top-level
// comment is what actually reads as "Facebook style" instead of a
// staircase of indentation. Replying still attaches to the exact comment
// tapped (preserved for the backend/notification `parentComment` field),
// it just never renders deeper than one level.
const flattenReplies = (replies = []) => {
  const flat = [];
  const walk = (list) => {
    list.forEach((r) => {
      flat.push(r);
      if (r.replies?.length) walk(r.replies);
    });
  };
  walk(replies);
  return flat;
};

function Avatar({ user, size = 32 }) {
  const style = { width: size, height: size };
  return user?.avatar ? (
    <img src={user.avatar} alt={user.name} style={style} className="rounded-full object-cover shrink-0" />
  ) : (
    <span
      style={style}
      className="rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-medium shrink-0"
    >
      {user?.name?.charAt(0).toUpperCase() || "U"}
    </span>
  );
}

// One comment bubble — used for both top-level comments and (flattened)
// replies. Author avatar + name are always clickable through to their
// profile page.
function CommentBubble({ comment, size = 32, onReplyClick, isOwner, onDelete }) {
  const profileTo = `/profile/${comment.author?._id || comment.author?.id}`;

  return (
    <div className="flex items-start gap-2">
      <Link to={profileTo} className="shrink-0">
        <Avatar user={comment.author} size={size} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="bg-bgLight rounded-2xl px-3 py-2 inline-block max-w-full">
          <Link to={profileTo} className="text-xs font-semibold text-primary hover:underline">
            {comment.author?.name || "User"}
          </Link>
          <p className="text-sm text-textDark break-words whitespace-pre-line">{comment.text}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 px-2">
          <span className="text-[11px] text-textMuted">{timeAgo(comment.createdAt)}</span>
          <button
            onClick={onReplyClick}
            className="text-[11px] font-medium text-textMuted hover:text-primary"
          >
            Reply
          </button>
          {isOwner && (
            <button
              onClick={onDelete}
              className="text-[11px] font-medium text-textMuted hover:text-danger flex items-center gap-0.5"
            >
              <Trash2 size={11} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReplyForm({ onSubmit, onCancel, placeholder, submitting }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2 ml-10">
      <input
        autoFocus
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="flex-1 text-xs border border-borderClr rounded-full px-3 py-1.5 outline-none focus:border-primary"
      />
      <button
        type="submit"
        disabled={submitting}
        className="text-xs bg-primary text-white px-3 rounded-full disabled:opacity-60"
      >
        Post
      </button>
      <button type="button" onClick={onCancel} className="text-xs text-textMuted px-1">
        Cancel
      </button>
    </form>
  );
}

// A top-level comment + its (flattened) replies + a reply form that can
// target either the comment itself or any one of its replies.
function TopLevelComment({ comment, postId, onCommentAdded, onCommentDeleted }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [replyTarget, setReplyTarget] = useState(null); // { id, name } | null
  const [showReplies, setShowReplies] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const flatReplies = flattenReplies(comment.replies);

  const openReply = (id) => {
    if (!user) return navigate("/login");
    setReplyTarget((prev) => (prev?.id === id ? null : { id }));
  };

  const handleReplySubmit = async (targetId, text) => {
    setSubmitting(true);
    try {
      const { data } = await api.post(`/comments/${postId}`, {
        text,
        parentComment: targetId,
      });
      onCommentAdded(data.comment, targetId);
      setReplyTarget(null);
      setShowReplies(true);
    } catch (err) {
      // silently fail for now — could add a toast later
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      onCommentDeleted(commentId);
    } catch (err) {
      // silently fail for now
    }
  };

  return (
    <div className="mt-4">
      <CommentBubble
        comment={comment}
        onReplyClick={() => openReply(comment._id)}
        isOwner={user && comment.author?._id === user.id}
        onDelete={() => handleDelete(comment._id)}
      />

      {replyTarget?.id === comment._id && (
        <ReplyForm
          submitting={submitting}
          placeholder={`Reply to ${comment.author?.name || "this comment"}...`}
          onSubmit={(text) => handleReplySubmit(comment._id, text)}
          onCancel={() => setReplyTarget(null)}
        />
      )}

      {flatReplies.length > 0 && (
        <div className="ml-10 mt-2">
          {!showReplies ? (
            <button
              onClick={() => setShowReplies(true)}
              className="text-xs font-medium text-secondary hover:underline"
            >
              View {flatReplies.length} {flatReplies.length === 1 ? "reply" : "replies"}
            </button>
          ) : (
            <>
              {flatReplies.map((reply) => (
                <div key={reply._id} className="mb-3">
                  <CommentBubble
                    comment={reply}
                    size={26}
                    onReplyClick={() => openReply(reply._id)}
                    isOwner={user && reply.author?._id === user.id}
                    onDelete={() => handleDelete(reply._id)}
                  />
                  {replyTarget?.id === reply._id && (
                    <ReplyForm
                      submitting={submitting}
                      placeholder={`Reply to ${reply.author?.name || "this comment"}...`}
                      onSubmit={(text) => handleReplySubmit(reply._id, text)}
                      onCancel={() => setReplyTarget(null)}
                    />
                  )}
                </div>
              ))}
              <button
                onClick={() => setShowReplies(false)}
                className="text-xs text-textMuted hover:underline"
              >
                Hide replies
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function CommentThread({ postId }) {
  const { user, socket } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const { data } = await api.get(`/comments/${postId}`);
        setComments(data.comments || []);
      } catch (err) {
        // leave comments empty on failure
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [postId]);

  // Existing tree mein kahin bhi ye id maujood hai kya — apne khud ke post
  // kiye comment ko socket echo se DOBARA add hone se rokne ke liye zaroori
  // hai (hum already API response se locally add kar chuke hote hain)
  const commentExistsInTree = (list, id) =>
    list.some((c) => c._id === id || commentExistsInTree(c.replies || [], id));

  // Inserts a new top-level comment, or nests a reply under its exact
  // parent (still respected in the DATA even though the UI flattens
  // display) — avoids re-fetching the whole thread after every post
  const handleCommentAdded = (comment, parentId = null) => {
    const withReplies = { ...comment, replies: [] };
    if (!parentId) {
      setComments((prev) => [...prev, withReplies]);
      return;
    }
    const insertReply = (list) =>
      list.map((c) => {
        if (c._id === parentId) {
          return { ...c, replies: [...(c.replies || []), withReplies] };
        }
        return { ...c, replies: insertReply(c.replies || []) };
      });
    setComments((prev) => insertReply(prev));
  };

  const handleCommentDeleted = (id) => {
    const removeComment = (list) =>
      list
        .filter((c) => c._id !== id)
        .map((c) => ({ ...c, replies: removeComment(c.replies || []) }));
    setComments((prev) => removeComment(prev));
  };

  // Real-time — koi doosra viewer comment/reply kare to sabko turant dikhe,
  // bina page refresh kiye
  useEffect(() => {
    if (!socket || !postId) return;

    const handleNewComment = ({ comment, parentComment }) => {
      setComments((prev) => {
        if (commentExistsInTree(prev, comment._id)) return prev; // apna khud ka comment, already added
        const withReplies = { ...comment, replies: [] };
        if (!parentComment) return [...prev, withReplies];

        const insertReply = (list) =>
          list.map((c) => {
            if (c._id === parentComment) {
              return { ...c, replies: [...(c.replies || []), withReplies] };
            }
            return { ...c, replies: insertReply(c.replies || []) };
          });
        return insertReply(prev);
      });
    };

    const handleCommentDeletedEvent = ({ commentId }) => {
      handleCommentDeleted(commentId); // idempotent — khud delete kiya ho to already hat chuka hoga
    };

    socket.on("post:newComment", handleNewComment);
    socket.on("post:commentDeleted", handleCommentDeletedEvent);

    return () => {
      socket.off("post:newComment", handleNewComment);
      socket.off("post:commentDeleted", handleCommentDeletedEvent);
    };
  }, [socket, postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return navigate("/login");
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { data } = await api.post(`/comments/${postId}`, { text: newComment });
      handleCommentAdded(data.comment);
      setNewComment("");
    } catch (err) {
      // silently fail for now
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6">
      <h3 className="flex items-center gap-2 text-sm font-medium text-textDark mb-3">
        <MessageCircle size={15} /> Comments
      </h3>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={user ? "Add a comment..." : "Sign in to comment"}
          className="flex-1 text-sm border border-borderClr rounded-full px-3 py-2 outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={submitting}
          className="text-sm bg-primary text-white px-4 rounded-full hover:bg-primary/90 disabled:opacity-60"
        >
          Post
        </button>
      </form>

      {loading && <p className="text-xs text-textMuted">Loading comments...</p>}
      {!loading && comments.length === 0 && (
        <p className="text-xs text-textMuted">No comments yet. Be the first to comment.</p>
      )}

      {comments.map((comment) => (
        <TopLevelComment
          key={comment._id}
          comment={comment}
          postId={postId}
          onCommentAdded={handleCommentAdded}
          onCommentDeleted={handleCommentDeleted}
        />
      ))}
    </div>
  );
}