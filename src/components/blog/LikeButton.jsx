import { useState } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function LikeButton({ postId, initialLikesCount = 0, initialLiked = false, size = "sm" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialLikesCount);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!user) {
      navigate("/login"); // login zaroori hai like karne ke liye
      return;
    }
    if (loading) return;

    // Optimistic update — turant UI badal do, agar API fail ho toh wapas revert kar denge
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);
    setLoading(true);

    try {
      const { data } = await api.post(`/posts/${postId}/like`);
      setLiked(data.liked);
      setCount(data.likesCount);
    } catch (err) {
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setLoading(false);
    }
  };

  const iconSize = size === "lg" ? 18 : 13;
  const textSize = size === "lg" ? "text-sm" : "text-[11px]";

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-1 ${textSize} transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
        liked ? "text-accent" : "text-amber-700 hover:text-accent"
      }`}
      aria-label={liked ? "Unlike post" : "Like post"}
    >
      <Heart size={iconSize} fill={liked ? "currentColor" : "none"} />
      {count}
    </button>
  );
}