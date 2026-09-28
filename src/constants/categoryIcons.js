import {
  Newspaper,
  Microscope,
  Briefcase,
  GraduationCap,
  Bot,
  Globe2,
  Brain,
  Mic,
  BookOpen,
  PenLine,
  BarChart3,
  Tag,
} from "lucide-react";

// One classic icon + one accent tint per category — keyed by the exact
// value string (constants/categories.js), not by array position, so this
// stays correct even if that list gets reordered later. Shared by Home.jsx
// and CategoryPosts.jsx so the same category always looks the same
// everywhere on the site, not just on one page.
export const CATEGORY_STYLE = {
  "Latest News & Updates": { icon: Newspaper, tint: "bg-sky-50 text-sky-600" },
  "Research & Reports": { icon: Microscope, tint: "bg-violet-50 text-violet-600" },
  "Business": { icon: Briefcase, tint: "bg-amber-50 text-amber-600" },
  "Education": { icon: GraduationCap, tint: "bg-emerald-50 text-emerald-600" },
  "Technology & AI": { icon: Bot, tint: "bg-indigo-50 text-indigo-600" },
  "World": { icon: Globe2, tint: "bg-cyan-50 text-cyan-600" },
  "Expert Opinions": { icon: Brain, tint: "bg-rose-50 text-rose-600" },
  "Interviews": { icon: Mic, tint: "bg-orange-50 text-orange-600" },
  "Magazine Features": { icon: BookOpen, tint: "bg-teal-50 text-teal-600" },
  "Guest Posts": { icon: PenLine, tint: "bg-fuchsia-50 text-fuchsia-600" },
  "Trends & Insights": { icon: BarChart3, tint: "bg-blue-50 text-blue-600" },
};

// Fallback for any category added later that isn't in the map above yet
export const DEFAULT_CATEGORY_STYLE = { icon: Tag, tint: "bg-slate-100 text-slate-500" };