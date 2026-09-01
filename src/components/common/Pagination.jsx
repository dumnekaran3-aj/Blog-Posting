import { ChevronLeft, ChevronRight } from "lucide-react";

// Reusable pagination control — used by any feed page (Home, CategoryPosts,
// etc.) that fetches from GET /api/posts, which already returns
// { page, totalPages, total } from the backend's ranking/feed service.
//
// Windowed page numbers: sirf current page ke aas-paas ke numbers dikhate
// hain (max 5), taaki 50 pages hone par bhi UI lambi horizontal list na bane.
export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  let end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  const pageNumbers = [];
  for (let p = start; p <= end; p++) pageNumbers.push(p);

  const goTo = (p) => {
    if (p < 1 || p > totalPages || p === page) return;
    onPageChange(p);
  };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="flex items-center justify-center w-8 h-8 rounded-md border border-borderClr text-textMuted hover:border-primary/40 hover:text-textDark disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-borderClr"
      >
        <ChevronLeft size={14} />
      </button>

      {start > 1 && (
        <>
          <button
            onClick={() => goTo(1)}
            className="w-8 h-8 rounded-md text-xs border border-borderClr text-textDark hover:border-primary/40"
          >
            1
          </button>
          {start > 2 && <span className="text-textMuted text-xs px-1">...</span>}
        </>
      )}

      {pageNumbers.map((p) => (
        <button
          key={p}
          onClick={() => goTo(p)}
          aria-current={p === page ? "page" : undefined}
          className={`w-8 h-8 rounded-md text-xs border transition-colors ${
            p === page
              ? "bg-primary text-white border-primary"
              : "border-borderClr text-textDark hover:border-primary/40"
          }`}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-textMuted text-xs px-1">...</span>}
          <button
            onClick={() => goTo(totalPages)}
            className="w-8 h-8 rounded-md text-xs border border-borderClr text-textDark hover:border-primary/40"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="flex items-center justify-center w-8 h-8 rounded-md border border-borderClr text-textMuted hover:border-primary/40 hover:text-textDark disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-borderClr"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}