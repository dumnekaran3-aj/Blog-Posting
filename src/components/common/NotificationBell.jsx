import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Heart, MessageCircle, UserPlus, CornerDownRight, Rss } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

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

export default function NotificationBell() {
  const { socket } = useAuth();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  // Poll unread count every 30s — real-time push (socket, neeche) usually
  // isse pehle hi update kar deta hai, ye sirf ek safety-net fallback hai
  // (agar kabhi socket disconnect ho jaye ya event miss ho jaye)
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await api.get("/notifications/unread-count");
        setUnreadCount(data.count);
      } catch (err) {
        // fail silently — badge just won't update this cycle
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Real-time — naya follow/comment/reply/new-post turant bell mein aa jata
  // hai, 30s polling ka intezaar nahi karna padta
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif) => {
      setNotifications((prev) => {
        // Dropdown pehle kabhi khula na ho to list khali hi hai — usmein
        // kuch prepend karne ki zaroorat nahi, unread-count event se badge
        // already update ho jayega. Sirf tab prepend karo jab list load ho chuki ho.
        if (prev.length === 0) return prev;
        return [notif, ...prev];
      });
    };

    const handleUnreadCount = (count) => {
      setUnreadCount(count);
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("notification:unread-count", handleUnreadCount);

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("notification:unread-count", handleUnreadCount);
    };
  }, [socket]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = async () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && notifications.length === 0) {
      setLoading(true);
      try {
        const { data } = await api.get("/notifications");
        setNotifications(data.notifications);
      } catch (err) {
        // leave list empty on failure
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      // could add a toast here later
    }
  };

  const handleClickNotification = async (notif) => {
    if (!notif.read) {
      try {
        await api.patch(`/notifications/${notif._id}/read`);
        setNotifications((prev) => prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        // navigation still proceeds even if marking-as-read fails
      }
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={handleOpen}
        className="relative text-white/80 hover:text-white"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 bg-white border border-borderClr rounded-lg shadow-lg w-80 max-h-96 overflow-y-auto z-50">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-borderClr">
            <p className="text-xs font-medium text-textDark">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-[11px] text-primary hover:underline">
                Mark all as read
              </button>
            )}
          </div>

          {loading && <p className="text-xs text-textMuted p-4">Loading...</p>}
          {!loading && notifications.length === 0 && (
            <p className="text-xs text-textMuted p-4">No notifications yet.</p>
          )}

          {!loading &&
            notifications.map((notif) => {
              const { Icon, color } = typeIcon[notif.type] || typeIcon.like;
              const linkTo = notif.post?.slug ? `/blog/${notif.post.slug}` : `/profile/${notif.sender?._id}`;

              return (
                <Link
                  key={notif._id}
                  to={linkTo}
                  onClick={() => handleClickNotification(notif)}
                  className={`flex items-start gap-2.5 px-4 py-3 border-b border-borderClr last:border-0 hover:bg-bgLight ${
                    !notif.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className={`mt-0.5 ${color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-textDark">
                      <span className="font-medium">{notif.sender?.name || "Someone"}</span>{" "}
                      {typeText[notif.type] || "interacted with you"}
                    </p>
                    {notif.post?.title && (
                      <p className="text-[11px] text-textMuted truncate">{notif.post.title}</p>
                    )}
                    <p className="text-[10px] text-textMuted mt-0.5">
                      {new Date(notif.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />}
                </Link>
              );
            })}
        </div>
      )}
    </div>
  );
}