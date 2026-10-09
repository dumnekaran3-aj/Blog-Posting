import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import PostCard from "../components/blog/PostCart";
import PageHero from "../components/common/PageHero";
import TrendingShowcase from "../components/blog/TrendingShowcase";
import Pagination from "../components/common/Pagination";
import { useAuth } from "../context/AuthContext";
import { categories as allCategories, categorySlug } from "../constants/categories";
import { CATEGORY_STYLE, DEFAULT_CATEGORY_STYLE } from "../constants/categoryIcons";
import api from "../services/api";
import { postPath } from "../utils/postUrl";

export default function Home() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  // Navbar search button lands here with ?search=<query> — pick that up as
  // the initial value so results show immediately instead of an empty box.
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [suggestedPosts, setSuggestedPosts] = useState([]);
  // Only true when suggestedPosts is actually personalized (matched to the
  // user's interests) — drives whether the sidebar section reads "Suggested
  // for you" or falls back to "Trending now".
  const [isPersonalized, setIsPersonalized] = useState(false);

  // Debounce — waits 400ms after the user stops typing before updating `search`.
  // Avoids firing an API call on every single keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Keep the URL in sync with the active search — makes the search
  // shareable/bookmarkable and is what lets the navbar search button
  // (which navigates to /?search=...) hand off into this page correctly.
  useEffect(() => {
    setSearchParams(search ? { search } : {}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Search changing resets to page 1 — warna user kisi search ke baad bhi
  // purane page number pe atka reh sakta hai jahan naye results hi na ho
  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const params = { page };
        if (search) params.search = search;

        const { data } = await api.get("/posts", { params });
        setPosts(data.posts || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error("Failed to load posts:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [search, page]);

  // Sidebar "Suggested for you" — personalized to the user's interests
  // (Settings/Dashboard mein set kiye hue) when they have any set.
  // Otherwise (guest, or a user with no interests picked yet) falls back
  // to a general trending list, so this section is never just empty —
  // that empty space was exactly what made the page feel sparse.
  useEffect(() => {
    const interests = user?.interests || [];

    const fetchTrending = async () => {
      try {
        const { data } = await api.get("/posts", { params: { limit: 6 } });
        setSuggestedPosts(data.posts || []);
        setIsPersonalized(false);
      } catch (err) {
        setSuggestedPosts([]);
      }
    };

    if (interests.length === 0) {
      fetchTrending();
      return;
    }

    const fetchSuggestions = async () => {
      try {
        // Har interest se thode-thode posts le lete hain (max 3 categories
        // taaki zyada parallel calls na ho), fir merge+dedupe karke top 6
        // dikha dete hain — isse variety milti hai sirf ek category tak
        // simit rehne ke bajaye
        const requests = interests
          .slice(0, 3)
          .map((cat) => api.get("/posts", { params: { category: cat, limit: 3 } }));
        const responses = await Promise.all(requests);

        const seen = new Set();
        const merged = [];
        responses.forEach((res) => {
          (res.data.posts || []).forEach((p) => {
            if (!seen.has(p._id)) {
              seen.add(p._id);
              merged.push(p);
            }
          });
        });

        if (merged.length === 0) {
          // Interests set, but nothing matched them right now — trending
          // fallback rather than an empty section
          await fetchTrending();
          return;
        }
        setSuggestedPosts(merged.slice(0, 6));
        setIsPersonalized(true);
      } catch (err) {
        setSuggestedPosts([]);
      }
    };
    fetchSuggestions();
  }, [user?.id]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-bgLight">
      <Navbar />

      <PageHero
        badge="Discover · Explore · Understand"
        title="Ideas worth sharing"
        description="Fresh posts from writers across marketing, tech, and design"
        search={{ value: searchInput, onChange: setSearchInput, placeholder: "Search posts by topic, author, or keyword..." }}
      />

      <section className="max-w-7xl mx-auto w-full px-6 pt-8 pb-10 grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 items-start">
        {/* Post feed — single column, full width. Ek post ke niche doosri
            post aati hai (pehle 2-column grid tha, ab har post apni poori
            available width leti hai — jo pehle 2 posts milke leti thi) */}
        <div>
          <div className="flex flex-col gap-6">
            {loading && (
              <p className="text-sm text-textMuted">Loading posts...</p>
            )}

            {!loading && posts.length === 0 && (
              <p className="text-sm text-textMuted">
                {search
                  ? "No posts match your search."
                  : "No posts yet. Be the first to publish one."}
              </p>
            )}

            {!loading &&
              posts.map((post) => <PostCard key={post._id} post={post} />)}
          </div>

          {!loading && posts.length > 0 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
          )}
        </div>

        {/* Sidebar — sticky + scrolls independently of the post feed on
            desktop (`items-start` on the grid above stops it stretching to
            match the feed's height, `md:sticky` pins it under the navbar,
            and its own max-height + overflow-y-auto means if its content
            ever runs taller than the viewport, THAT scrolls on its own
            rather than growing the page). Plain stacked block on mobile —
            sticky doesn't make sense once the sidebar is below the feed
            instead of beside it. */}
        <aside className="flex flex-col gap-4 md:sticky md:top-20 md:max-h-[calc(100vh-6rem)] md:overflow-y-auto md:pb-2">
          {/* Auto-swiping media carousel + auto-scrolling suggestions list.
              Personalized to the user's interests when they have any,
              otherwise trending (same data the old grid used). */}
          {suggestedPosts.length > 0 && (
            <TrendingShowcase
              posts={suggestedPosts}
              title={isPersonalized ? "Suggested for you" : "Trending now"}
              personalized={isPersonalized}
            />
          )}

          {/* All categories — poore list ka apna page hai (/category/:slug);
              har category ka apna icon chip + tint hai taaki card ek flat
              text list na lage, balki ek curated directory jaisa lage */}
          <div className="bg-white border border-borderClr rounded-xl p-4 shrink-0">
            <p className="text-sm font-medium text-textDark mb-1">All categories</p>
            <p className="text-[11px] text-textMuted mb-3">Browse posts by topic</p>
            <div className="flex flex-col">
              {allCategories.map((cat) => {
                const { icon: Icon, tint } = CATEGORY_STYLE[cat.value] || DEFAULT_CATEGORY_STYLE;
                return (
                  <Link
                    key={cat.value}
                    to={`/category/${categorySlug(cat.value)}`}
                    className="group flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-bgLight transition-colors"
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tint}`}>
                      <Icon size={15} strokeWidth={2} />
                    </span>
                    <span className="text-[13px] text-slate-700 font-medium group-hover:text-primary transition-colors">
                      {cat.value}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

        </aside>
      </section>

      <Footer />
    </div>
  );
}