import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { UserPlus, UserCheck } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import PostCard from "../components/blog/PostCart";
import FollowListModal from "../components/profile/FollowListModal";
import Lightbox from "../components/common/Lightbox";
import { useAuth } from "../context/AuthContext";
import { categories as allCategories } from "../constants/categories";
import api from "../services/api";

export default function PublicProfile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [followModalType, setFollowModalType] = useState(null);
  const [avatarLightboxOpen, setAvatarLightboxOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const [profileRes, postsRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get("/posts", { params: { author: id } }),
        ]);
        setProfile(profileRes.data.user);
        setIsFollowing(profileRes.data.isFollowing);
        setIsSelf(profileRes.data.isSelf);
        setPosts(postsRes.data.posts || []);
      } catch (err) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const handleFollowToggle = async () => {
    if (!currentUser) return; // Navbar sign-in flow handles this; button is hidden if logged out anyway
    setFollowLoading(true);

    // Optimistic update
    const prevFollowing = isFollowing;
    setIsFollowing(!isFollowing);
    setProfile((p) => ({
      ...p,
      followersCount: p.followersCount + (prevFollowing ? -1 : 1),
    }));

    try {
      const { data } = await api.post(`/users/${id}/follow`);
      setIsFollowing(data.following);
    } catch (err) {
      // revert on failure
      setIsFollowing(prevFollowing);
      setProfile((p) => ({
        ...p,
        followersCount: p.followersCount + (prevFollowing ? 1 : -1),
      }));
    } finally {
      setFollowLoading(false);
    }
  };

  const interestBadges = (profile?.interests || [])
    .map((val) => allCategories.find((c) => c.value === val))
    .filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col bg-bgLight">
      <Navbar />

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {loading && <p className="text-sm text-textMuted">Loading profile...</p>}

        {!loading && !profile && (
          <p className="text-sm text-textMuted">This user could not be found.</p>
        )}

        {!loading && profile && (
          <>
            <div className="bg-white border border-borderClr rounded-xl p-6 mb-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => profile.avatar && setAvatarLightboxOpen(true)}
                    aria-label={`View ${profile.name}'s profile photo`}
                  >
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-medium">
                        {profile.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                  </button>
                  <div>
                    <p className="text-lg font-medium text-textDark">{profile.name}</p>
                    {profile.bio && <p className="text-xs text-textMuted mt-1 max-w-sm">{profile.bio}</p>}
                  </div>
                </div>

                {!isSelf && currentUser && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`flex items-center gap-1.5 text-xs px-4 py-2 rounded-md transition-colors disabled:opacity-60 ${
                      isFollowing
                        ? "border border-borderClr text-textDark hover:bg-slate-50"
                        : "bg-primary text-white hover:bg-primary/90"
                    }`}
                  >
                    {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                )}
                {isSelf && (
                  <Link
                    to="/dashboard"
                    className="text-xs border border-borderClr text-textDark px-4 py-2 rounded-md hover:bg-slate-50"
                  >
                    Go to dashboard
                  </Link>
                )}
              </div>

              {interestBadges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {interestBadges.map((cat) => (
                    <span
                      key={cat.value}
                      className="text-[11px] bg-primary/10 text-primaryDark px-2.5 py-1 rounded-full"
                    >
                      {cat.emoji} {cat.value}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-6 mt-5 pt-4 border-t border-borderClr">
                <div className="text-center">
                  <p className="text-base font-medium text-textDark">{profile.totalPosts}</p>
                  <p className="text-[11px] text-textMuted">Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-medium text-textDark">{profile.totalViews}</p>
                  <p className="text-[11px] text-textMuted">Views</p>
                </div>
                <button onClick={() => setFollowModalType("followers")} className="text-center">
                  <p className="text-base font-medium text-textDark">{profile.followersCount}</p>
                  <p className="text-[11px] text-primary hover:underline">Followers</p>
                </button>
                <button onClick={() => setFollowModalType("following")} className="text-center">
                  <p className="text-base font-medium text-textDark">{profile.followingCount}</p>
                  <p className="text-[11px] text-primary hover:underline">Following</p>
                </button>
              </div>
            </div>

            <h2 className="text-sm font-medium text-textDark mb-3">
              Posts by {profile.name}
            </h2>
            {posts.length === 0 ? (
              <p className="text-sm text-textMuted">No published posts yet.</p>
            ) : (
              // Home page jaisa hi single-column, full-width layout — same
              // PostCard component, same stacking (2/3-column grid nahi)
              <div className="flex flex-col gap-6">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {avatarLightboxOpen && (
        <Lightbox src={profile?.avatar} alt={profile?.name} onClose={() => setAvatarLightboxOpen(false)} />
      )}

      {followModalType && (
        <FollowListModal userId={id} type={followModalType} onClose={() => setFollowModalType(null)} />
      )}

      <Footer />
    </div>
  );
}