import {
  Heart,
  MessageCircle,
  UserPlus,
  CornerDownRight,
  Rss,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// Single source of truth for how each notification type looks/reads, shared
// by NotificationBell.jsx (dropdown) and Notifications.jsx (full page) so a
// new type only has to be added here, not in two places.
const TYPE_META = {
  follow: { Icon: UserPlus, color: "text-primary", text: "started following you" },
  like: { Icon: Heart, color: "text-accent", text: "liked your post" },
  comment: { Icon: MessageCircle, color: "text-secondary", text: "commented on your post" },
  reply: { Icon: CornerDownRight, color: "text-secondary", text: "replied to your comment" },
  new_post: { Icon: Rss, color: "text-primary", text: "published a new post" },
  post_request_approved: {
    Icon: CheckCircle2,
    color: "text-success",
    text: "approved your request for more posts",
  },
  post_request_rejected: {
    Icon: XCircle,
    color: "text-danger",
    text: "declined your request for more posts",
  },
};

const FALLBACK_META = { Icon: Rss, color: "text-primary", text: "sent you an update" };

// Turns a raw notification into everything the UI needs to draw it.
export function getNotificationView(notif) {
  const meta = TYPE_META[notif.type] || FALLBACK_META;
  const isPostRequest = notif.type === "post_request_approved" || notif.type === "post_request_rejected";

  // Post-request notifications are an admin decision, not a person's
  // action — shown as coming from the site ("VarityWire Team") rather than
  // exposing the reviewing admin's own name, and never linked to their profile.
  const senderLabel = isPostRequest ? "VarityWire Team" : notif.sender?.name || "Someone";

  let detail = notif.post?.title || "";
  if (notif.type === "post_request_approved") {
    const n = notif.postRequest?.grantedCount;
    detail = n ? `+${n} post${n === 1 ? "" : "s"} unlocked — you can publish now` : "You can publish more posts now";
  } else if (notif.type === "post_request_rejected") {
    detail = notif.postRequest?.rejectionReason ? `Reason: ${notif.postRequest.rejectionReason}` : "";
  }

  let linkTo = "/";
  if (isPostRequest) linkTo = "/create";
  else if (notif.post?.slug) linkTo = `/blog/${notif.post.slug}`;
  else if (notif.sender?.username) linkTo = `/profile/${notif.sender.username}`;

  return { Icon: meta.Icon, color: meta.color, text: meta.text, senderLabel, detail, linkTo };
}