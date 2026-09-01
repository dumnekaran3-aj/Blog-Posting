import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Heart, Pencil, Trash2, FileText, Settings as SettingsIcon } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import Lightbox from "../components/common/Lightbox";
import FollowListModal from "../components/profile/FollowListModal";
import AvatarUpload from "../components/profile/AvatarUpload";
import { categories } from "../constants/categories";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const MAX_INTERESTS = 4;

export default function Dashboard() {
  const { user, updateProfile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [followModalType, setFollowModalType] = useState(null); // "followers" | "following" | null
  const [selectedInterests, setSelectedInterests] = useState(user?.interests || []);
  const [savingInterests, setSavingInterests] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/posts/mine");
      setPosts(data.posts || []);
    } catch (err) {
      // leave posts empty on failure
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    setSelectedInterests(user?.interests || []);
  }, [user]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/posts/${id}`);
      setPosts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      // could add a toast here later
    }
  };

  const handleAvatarUploaded = async (url) => {
    try {
      await updateProfile({ avatar: url });
    } catch (err) {
      // could add a toast here later
    }
  };

  const toggleInterest = (value) => {
    setSelectedInterests((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value);
      if (prev.length >= MAX_INTERESTS) return prev; // silently ignore past the cap
      return [...prev, value];
    });
  };

  const handleSaveInterests = async () => {
    setSavingInterests(true);
    try {
      await updateProfile({ interests: selectedInterests });
    } catch (err) {
      // could add a toast here later
    } finally {
      setSavingInterests(false);
    }
  };

  const interestsChanged =
    JSON.stringify([...selectedInterests].sort()) !== JSON.stringify([...(user?.interests || [])].sort());

  const stats = {
    total: posts.length,
    published: posts.filter((p) => p.status === "published").length,
    drafts: posts.filter((p) => p.status === "draft").length,
    totalViews: posts.reduce((sum, p) => sum + (p.viewsCount || 0), 0),
    totalLikes: posts.reduce((sum, p) => sum + (p.likesCount || 0), 0),
  };

  return (
    <div className="min-h-screen flex flex-col bg-bgLight">
      <Navbar />

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {/* Profile header */}
        <div className="bg-white border border-borderClr rounded-xl p-5 mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <AvatarUpload
              avatarUrl={user?.avatar}
              name={user?.name}
              size={56}
              onUploaded={handleAvatarUploaded}
              onClickImage={() => user?.avatar && setLightboxOpen(true)}
            />
            <div>
              <p className="text-base font-medium text-textDark">{user?.name}</p>
              <p className="text-xs text-textMuted">{user?.email}</p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-lg font-medium text-textDark">{stats.total}</p>
              <p className="text-[11px] text-textMuted">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-textDark">{stats.totalViews}</p>
              <p className="text-[11px] text-textMuted">Views</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-textDark">{stats.totalLikes}</p>
              <p className="text-[11px] text-textMuted">Likes</p>
            </div>
            <button onClick={() => setFollowModalType("followers")} className="text-center">
              <p className="text-lg font-medium text-textDark">{user?.followersCount ?? 0}</p>
              <p className="text-[11px] text-primary hover:underline">Followers</p>
            </button>
            <button onClick={() => setFollowModalType("following")} className="text-center">
              <p className="text-lg font-medium text-textDark">{user?.followingCount ?? 0}</p>
              <p className="text-[11px] text-primary hover:underline">Following</p>
            </button>
          </div>

          <Link
            to="/settings"
            className="flex items-center gap-1.5 text-xs border border-borderClr rounded-md px-3 py-1.5 text-textDark hover:border-primary/40 shrink-0"
          >
            <SettingsIcon size={13} /> Settings
          </Link>
        </div>

        {/* Interests */}
        <div className="bg-white border border-borderClr rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-medium text-textDark">Your interests</h2>
            <span className="text-[11px] text-textMuted">
              {selectedInterests.length}/{MAX_INTERESTS} selected
            </span>
          </div>
          <p className="text-xs text-textMuted mb-3">
            Pick up to {MAX_INTERESTS} categories you care about most.
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map((cat) => {
              const active = selectedInterests.includes(cat.value);
              const disabled = !active && selectedInterests.length >= MAX_INTERESTS;
              return (
                <button
                  key={cat.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleInterest(cat.value)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
                    active
                      ? "bg-primary text-white border-primary"
                      : disabled
                      ? "text-textMuted/50 border-borderClr cursor-not-allowed"
                      : "text-textDark border-borderClr hover:border-primary/40"
                  }`}
                >
                  <span>{cat.emoji}</span> {cat.value}
                </button>
              );
            })}
          </div>

          {interestsChanged && (
            <button
              onClick={handleSaveInterests}
              disabled={savingInterests}
              className="text-xs bg-primary text-white px-4 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-60"
            >
              {savingInterests ? "Saving..." : "Save interests"}
            </button>
          )}
        </div>

        {/* My Posts */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-textDark">
            My posts ({stats.published} published, {stats.drafts} drafts)
          </h2>
          <Link
            to="/create"
            className="text-xs bg-primary text-white px-3 py-1.5 rounded-md hover:bg-primary/90"
          >
            + New post
          </Link>
        </div>

        {loading && <p className="text-sm text-textMuted">Loading your posts...</p>}

        {!loading && posts.length === 0 && (
          <div className="bg-white border border-borderClr rounded-xl p-10 text-center">
            <FileText size={28} className="text-textMuted mx-auto mb-2" />
            <p className="text-sm text-textMuted mb-3">You haven't written anything yet.</p>
            <Link to="/create" className="text-sm text-primary">
              Write your first post
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {posts.map((post) => (
            <div
              key={post._id}
              className="bg-white border border-borderClr rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded ${
                      post.status === "published"
                        ? "bg-success/10 text-success"
                        : "bg-slate-200 text-textMuted"
                    }`}
                  >
                    {post.status === "published" ? "Published" : "Draft"}
                  </span>
                  <span className="text-[11px] text-textMuted">{post.category}</span>
                </div>
                <p className="text-sm font-medium text-textDark truncate">{post.title}</p>
                <div className="flex items-center gap-3 text-[11px] text-textMuted mt-1">
                  <span className="flex items-center gap-1">
                    <Eye size={11} /> {post.viewsCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart size={11} /> {post.likesCount || 0}
                  </span>
                  <span>
                    {new Date(post.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/edit/${post._id}`}
                  className="text-textMuted hover:text-primary p-1.5"
                  aria-label="Edit post"
                >
                  <Pencil size={15} />
                </Link>
                <button
                  onClick={() => handleDelete(post._id, post.title)}
                  className="text-textMuted hover:text-danger p-1.5"
                  aria-label="Delete post"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {lightboxOpen && (
        <Lightbox src={user?.avatar} alt={user?.name} onClose={() => setLightboxOpen(false)} />
      )}

      {followModalType && (
        <FollowListModal
          userId={user?.id}
          type={followModalType}
          onClose={() => setFollowModalType(null)}
        />
      )}

      <Footer />
    </div>
  );
}