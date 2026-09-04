import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Heart, MessageCircle, UserPlus, CornerDownRight, Rss, X } from "lucide-react";
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
  const { socket, unreadCount, setUnreadCount } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  // Naya follow/comment/reply/new-post aaye to dropdown khula ho tab list
  // mein bhi prepend kar do (badge/count AuthContext khud handle karta hai)
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif) => {
      setNotifications((prev) => {
        // Dropdown pehle kabhi khula na ho to list khali hi hai — usmein
        // kuch prepend karne ki zaroorat nahi.
        if (prev.length === 0) return prev;
        return [notif, ...prev];
      });
    };

    socket.on("notification:new", handleNewNotification);
    return () => socket.off("notification:new", handleNewNotification);
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
        <div
          className="fixed inset-0 bg-black/40 z-[100] flex items-end sm:items-start sm:justify-end sm:bg-transparent sm:inset-auto"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Notifications"
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-lg sm:border sm:border-borderClr shadow-lg w-full sm:w-80 sm:absolute sm:top-12 sm:right-6 max-h-[75vh] sm:max-h-96 overflow-y-auto pb-[env(safe-area-inset-bottom)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-borderClr sticky top-0 bg-white">
              <p className="text-xs font-medium text-textDark">Notifications</p>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-[11px] text-primary hover:underline">
                    Mark all as read
                  </button>
                )}
                {/* Close button — on mobile there's no obvious "click outside" target
                    once the sheet covers most of the screen, so give an explicit way out */}
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close notifications"
                  className="sm:hidden text-textMuted hover:text-textDark"
                >
                  <X size={16} />
                </button>
              </div>
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

            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-[11px] text-primary hover:underline px-4 py-2.5 border-t border-borderClr"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}