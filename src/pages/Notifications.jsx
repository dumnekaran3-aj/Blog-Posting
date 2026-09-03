import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, UserPlus, CornerDownRight, Rss, Bell } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import api from "../services/api";

const typeIcon = {
  follow: { Icon: UserPlus, color: "text-primary" },
  like: { Icon: Heart, color: "text-accent" },
  comment: { Icon: MessageCircle, color: "text-secondary" },
  reply: { Icon: CornerDownRight, color: "text-secondary" },
  new_post: { Icon: Rss, color: "text-primary" },
};

const typeText = {
  follow: "started following you",
  like: "liked your post",
  comment: "commented on your post",
  reply: "replied to your comment",
  new_post: "published a new post",
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = async (pageNum) => {
    const { data } = await api.get(`/notifications?page=${pageNum}`);
    setTotalPages(data.totalPages || 1);
    return data.notifications || [];
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const notifs = await fetchPage(1);
        setNotifications(notifs);
        setPage(1);
      } catch (err) {
        // leave list empty on failure
      } finally {
        setLoading(false);
      }
    })();

    // Opening this page is a natural "I've seen my notifications" signal
    api.patch("/notifications/read-all").catch(() => {});
  }, []);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const notifs = await fetchPage(nextPage);
      setNotifications((prev) => [...prev, ...notifs]);
      setPage(nextPage);
    } catch (err) {
      // could add a toast here later
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bgLight">
      <Navbar />

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <h1 className="text-lg font-medium text-textDark mb-6">Notifications</h1>

        {loading && <p className="text-sm text-textMuted">Loading notifications...</p>}

        {!loading && notifications.length === 0 && (
          <div className="bg-white border border-borderClr rounded-xl p-10 text-center">
            <Bell size={28} className="text-textMuted mx-auto mb-2" />
            <p className="text-sm text-textMuted">No notifications yet.</p>
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <div className="bg-white border border-borderClr rounded-xl overflow-hidden">
            {notifications.map((notif) => {
              const { Icon, color } = typeIcon[notif.type] || typeIcon.like;
              const linkTo = notif.post?.slug ? `/blog/${notif.post.slug}` : `/profile/${notif.sender?._id}`;

              return (
                <Link
                  key={notif._id}
                  to={linkTo}
                  className={`flex items-start gap-3 px-4 py-3.5 border-b border-borderClr last:border-0 hover:bg-bgLight ${
                    !notif.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className={`mt-0.5 ${color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-textDark">
                      <span className="font-medium">{notif.sender?.name || "Someone"}</span>{" "}
                      {typeText[notif.type] || "interacted with you"}
                    </p>
                    {notif.post?.title && (
                      <p className="text-xs text-textMuted truncate">{notif.post.title}</p>
                    )}
                    <p className="text-[11px] text-textMuted mt-0.5">
                      {new Date(notif.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {!notif.read && <span className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />}
                </Link>
              );
            })}
          </div>
        )}

        {!loading && page < totalPages && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="mt-4 w-full text-sm text-primary border border-borderClr rounded-lg py-2.5 hover:border-primary/40 disabled:opacity-60"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        )}
      </div>

      <Footer />
    </div>
  );
}