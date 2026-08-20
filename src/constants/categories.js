// Single source of truth for categories — used by Navbar dropdown, Home
// sidebar, CreatePost form, and the Categories directory page.
// Client-provided list (VarityWire). Emoji kept for display flavor in
// menus/cards; `value` is the clean string stored in the Post model.

export const categories = [
  { emoji: "📰", value: "Latest News & Updates" },
  { emoji: "🔬", value: "Research & Reports" },
  { emoji: "💼", value: "Business" },
  { emoji: "🎓", value: "Education" },
  { emoji: "🤖", value: "Technology & AI" },
  { emoji: "🌎", value: "World" },
  { emoji: "🧠", value: "Expert Opinions" },
  { emoji: "🎤", value: "Interviews" },
  { emoji: "📖", value: "Magazine Features" },
  { emoji: "✍️", value: "Guest Posts" },
  { emoji: "📊", value: "Trends & Insights" },
];

// Shown directly in the navbar — rest fold into "More" so the bar doesn't
// get cluttered as the list grows (same pattern as most news/blog sites).
export const primaryCategories = categories.slice(0, 5);
export const moreCategories = categories.slice(5);

export const categorySlug = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");