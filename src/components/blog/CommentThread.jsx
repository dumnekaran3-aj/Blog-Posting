import { useState, useEffect } from "react";
import { MessageCircle, Trash2, CornerDownRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

// One comment + its replies (recursive) + a reply form when active
function CommentItem({ comment, postId, onCommentAdded, onCommentDeleted, depth = 0 }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isOwner = user && comment.author?._id === user.id;

  const handleReply = async (e) => {
    e.preventDefault();
    if (!user) return navigate("/login");
    if (!replyText.trim()) return;

    setSubmitting(true);
    try {
      const { data } = await api.post(`/comments/${postId}`, {
        text: replyText,
        parentComment: comment._id,
      });
      onCommentAdded(data.comment, comment._id);
      setReplyText("");
      setReplying(false);
    } catch (err) {
      // silently fail for now — could add a toast later
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/comments/${comment._id}`);
      onCommentDeleted(comment._id);
    } catch (err) {
      // silently fail for now
    }
  };

  return (
    <div className={depth > 0 ? "ml-6 mt-3 border-l border-borderClr pl-3" : "mt-4"}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-textDark">{comment.author?.name || "User"}</p>
          <p className="text-xs text-textDark mt-0.5">{comment.text}</p>
        </div>
        {isOwner && (
          <button
            onClick={handleDelete}
            className="text-textMuted hover:text-danger"
            aria-label="Delete comment"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      <button
        onClick={() => setReplying(!replying)}
        className="flex items-center gap-1 text-[11px] text-secondary mt-1 hover:text-secondary/80"
      >
        <CornerDownRight size={11} /> Reply
      </button>

      {replying && (
        <form onSubmit={handleReply} className="flex gap-2 mt-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="flex-1 text-xs border border-borderClr rounded-md px-2 py-1.5 outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={submitting}
            className="text-xs bg-primary text-white px-3 rounded-md disabled:opacity-60"
          >
            Post
          </button>
        </form>
      )}

      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply._id}
          comment={reply}
          postId={postId}
          onCommentAdded={onCommentAdded}
          onCommentDeleted={onCommentDeleted}
          depth={depth + 1}
        />
      ))}
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

  // Inserts a new top-level comment, or nests a reply under its parent —
  // avoids re-fetching the whole thread after every post
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
          className="flex-1 text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={submitting}
          className="text-sm bg-primary text-white px-4 rounded-md hover:bg-primary/90 disabled:opacity-60"
        >
          Post
        </button>
      </form>

      {loading && <p className="text-xs text-textMuted">Loading comments...</p>}
      {!loading && comments.length === 0 && (
        <p className="text-xs text-textMuted">No comments yet. Be the first to comment.</p>
      )}

      {comments.map((comment) => (
        <CommentItem
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