import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Headphones, Play, Sparkles, TrendingUp } from "lucide-react";
import api from "../../services/api";
import { postPath } from "../../utils/postUrl";

// TrendingShowcase
// -----------------
// Sidebar block, two cards:
//   1. an auto-swiping carousel of the posts' media (image / video / audio) —
//      slides always travel right -> left, arrows + dots + touch swipe too
//   2. a list of the same posts that slowly scrolls upwards on its own
// Both pause while the pointer is over them, and neither moves for people
// who have "reduce motion" switched on.
//
// props:
//   posts       pass your own list (Home passes its personalised suggestions);
//               leave undefined and it fetches the latest posts itself
//   postType    "blog" | "news" — only used when it fetches (so /blogs shows
//               blog posts and /news shows news posts)
//   title       heading of the scrolling list
//   personalized  switches the heading icon (sparkles vs trending)

const SLIDE_MS = 5000;
const SLIDE_MAX = 5;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// Still image for a post, if it has one (video/audio posts normally carry a
// thumbnail; an image post's own file works as the cover).
const coverOf = (post) =>
  post.thumbnail || (post.mediaType === "image" ? post.mediaUrl : "") || "";

function Cover({ post, className = "" }) {
  const cover = coverOf(post);
  if (cover) {
    return <img src={cover} alt="" draggable={false} className={`object-cover ${className}`} />;
  }
  // No poster: a video's first frame still makes a decent cover
  if (post.mediaType === "video" && post.mediaUrl) {
    return <video src={post.mediaUrl} muted playsInline preload="metadata" className={`object-cover ${className}`} />;
  }
  return (
    <div className={`bg-gradient-to-br from-[#1B0E3A] to-primary flex items-center justify-center text-white/80 ${className}`}>
      {post.mediaType === "audio" ? (
        <Headphones size={26} />
      ) : (
        <span className="text-2xl font-bold">{post.category?.charAt(0).toUpperCase() || "P"}</span>
      )}
    </div>
  );
}

function MediaBadge({ type }) {
  if (type !== "video" && type !== "audio") return null;
  const Icon = type === "video" ? Play : Headphones;
  return (
    <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-white text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm">
      <Icon size={10} /> {type}
    </span>
  );
}

function Carousel({ posts }) {
  const slides = posts.slice(0, SLIDE_MAX);
  const n = slides.length;
  // The track holds the slides plus a copy of the first one on the end:
  // after the last slide we slide ONE more step onto that copy (still
  // right -> left), then jump back to the real first slide without animation.
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);
  const swiped = useRef(false);

  const next = useCallback(() => setIndex((v) => Math.min(v + 1, n)), [n]);

  const prev = () => {
    if (index === 0) {
      setAnimate(false);
      setIndex(n);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setAnimate(true);
          setIndex(n - 1);
        })
      );
    } else {
      setIndex((v) => v - 1);
    }
  };

  useEffect(() => {
    if (paused || n < 2 || prefersReducedMotion()) return undefined;
    const t = setInterval(next, SLIDE_MS);
    return () => clearInterval(t);
  }, [paused, n, next]);

  const onTransitionEnd = () => {
    if (index >= n) {
      setAnimate(false);
      setIndex(0);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    }
  };

  const onPointerDown = (e) => {
    touchX.current = e.clientX;
    swiped.current = false;
  };
  const onPointerUp = (e) => {
    if (touchX.current === null) return;
    const dx = e.clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 45) {
      swiped.current = true;
      if (dx < 0) next();
      else prev();
    }
  };

  if (n === 0) return null;
  const active = index % n;
  const track = n > 1 ? [...slides, slides[0]] : slides;

  return (
    <div
      className="relative shrink-0 bg-white border border-borderClr rounded-xl overflow-hidden group"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="overflow-hidden touch-pan-y" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <div
          className="flex"
          style={{
            transform: `translateX(-${index * 100}%)`,
            transition: animate ? "transform 650ms cubic-bezier(.22,.61,.36,1)" : "none",
          }}
          onTransitionEnd={onTransitionEnd}
        >
          {track.map((post, i) => (
            <Link
              key={`${post._id}-${i}`}
              to={postPath(post)}
              aria-hidden={i === n}
              tabIndex={i === n ? -1 : 0}
              onClick={(e) => swiped.current && e.preventDefault()}
              className="relative block min-w-full aspect-[4/3] bg-slate-900"
            >
              <Cover post={post} className="absolute inset-0 w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <MediaBadge type={post.mediaType} />
              <div className="absolute inset-x-0 bottom-0 p-4 pb-9">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-accent text-[#1B0E3A] text-[10px] font-bold uppercase tracking-wide">
                  {post.category}
                </span>
                <p className="mt-2 text-white font-bold text-[15px] leading-snug line-clamp-2">{post.title}</p>
                <p className="mt-1 text-[11px] text-slate-300 line-clamp-1">
                  {fmtDate(post.createdAt)}
                  {post.author?.name ? ` · ${post.author.name}` : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {n > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={prev}
            className="absolute left-2 top-[38%] w-8 h-8 rounded-full bg-white/90 text-slate-800 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={next}
            className="absolute right-2 top-[38%] w-8 h-8 rounded-full bg-white/90 text-slate-800 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          >
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s._id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => {
                  setAnimate(true);
                  setIndex(i);
                }}
                className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-accent" : "w-1.5 bg-white/60"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ScrollingList({ posts, title, personalized }) {
  const [paused, setPaused] = useState(false);
  const moving = posts.length >= 4 && !prefersReducedMotion();
  // Two copies back to back; the animation moves up by exactly one copy's
  // height, so the loop restarts invisibly.
  const rows = moving ? [...posts, ...posts] : posts;
  const seconds = Math.max(24, posts.length * 6);
  const HeadIcon = personalized ? Sparkles : TrendingUp;

  return (
    <div className="shrink-0 bg-white border border-borderClr rounded-xl overflow-hidden">
      <style>{`@keyframes vwScrollUp{from{transform:translateY(0)}to{transform:translateY(-50%)}}`}</style>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-borderClr bg-bgLight">
        <HeadIcon size={14} className="text-accent" />
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-textDark">{title}</p>
      </div>

      <div
        className={`h-[300px] ${moving ? "overflow-hidden" : "overflow-y-auto"}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <ul
          style={
            moving
              ? { animation: `vwScrollUp ${seconds}s linear infinite`, animationPlayState: paused ? "paused" : "running" }
              : undefined
          }
        >
          {rows.map((post, i) => (
            <li key={`${post._id}-${i}`} aria-hidden={moving && i >= posts.length} className="border-b border-borderClr last:border-b-0">
              <Link
                to={postPath(post)}
                tabIndex={moving && i >= posts.length ? -1 : 0}
                className="group flex gap-3 px-4 py-3 hover:bg-bgLight transition-colors"
              >
                <span className="relative shrink-0 w-[72px] h-[54px] rounded-md overflow-hidden bg-slate-200">
                  <Cover post={post} className="w-full h-full" />
                  {(post.mediaType === "video" || post.mediaType === "audio") && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                      {post.mediaType === "video" ? <Play size={14} /> : <Headphones size={14} />}
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-textDark leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-secondary line-clamp-1">
                    {fmtDate(post.createdAt)} · {post.category}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function TrendingShowcase({ posts: given, postType, title = "Trending now", personalized = false }) {
  const [fetched, setFetched] = useState([]);

  useEffect(() => {
    if (given) return undefined;
    let alive = true;
    api
      .get("/posts", { params: { limit: 8, ...(postType ? { postType } : {}) } })
      .then(({ data }) => alive && setFetched(data.posts || []))
      .catch(() => alive && setFetched([]));
    return () => {
      alive = false;
    };
  }, [given, postType]);

  const posts = given ?? fetched;
  if (posts.length === 0) return null;

  return (
    <>
      <Carousel posts={posts} />
      <ScrollingList posts={posts} title={title} personalized={personalized} />
    </>
  );
}