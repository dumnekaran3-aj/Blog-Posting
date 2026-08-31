import Notification from '../models/Notification.js';
import redisClient from '../config/redis.js';

const unreadKey = (userId) => `notif:unread:${userId}`;

// Called from Follow/Like/Comment controllers whenever an action should
// notify someone. Skips self-notifications (liking your own post, etc.)
export const createNotification = async ({ recipient, sender, type, post = null, comment = null }) => {
  if (recipient.toString() === sender.toString()) return;

  try {
    await Notification.create({ recipient, sender, type, post, comment });
    // Redis holds the unread COUNT only (not the notifications themselves —
    // MongoDB stays the source of truth). This avoids a COUNT query on
    // every page load just to show a badge number.
    await redisClient.incr(unreadKey(recipient));
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

// Called by notificationWorker.js for fan-out cases (new post -> all
// followers + all users interested in that category). ek hi Notification.
// insertMany() call — 1 doc per recipient DB round-trip nahi, aur unread
// counts bhi ek hi Redis pipeline mein increment hote hain (N alag Redis
// calls nahi, batch me).
export const createBulkNotifications = async (notifications) => {
  if (!notifications.length) return;

  try {
    const docs = await Notification.insertMany(notifications, { ordered: false });

    const pipeline = redisClient.pipeline();
    docs.forEach((n) => pipeline.incr(unreadKey(n.recipient.toString())));
    await pipeline.exec();
  } catch (err) {
    console.error('Failed to create bulk notifications:', err.message);
  }
};

export const getCachedUnreadCount = async (userId) => {
  const cached = await redisClient.get(unreadKey(userId));
  if (cached !== null) return parseInt(cached, 10);

  // Cache miss (first request ever, or Redis was restarted/flushed) —
  // fall back to a real count, then warm the cache for next time
  const count = await Notification.countDocuments({ recipient: userId, read: false });
  await redisClient.set(unreadKey(userId), count);
  return count;
};

export const decrementUnreadCount = async (userId) => {
  const key = unreadKey(userId);
  const newVal = await redisClient.decr(key);
  // Guards against a negative count if the cache was stale/out of sync
  if (newVal < 0) await redisClient.set(key, 0);
};

export const resetUnreadCount = async (userId) => {
  await redisClient.set(unreadKey(userId), 0);
};