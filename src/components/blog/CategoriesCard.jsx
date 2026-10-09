import { Link } from "react-router-dom";
import { categories as allCategories, categorySlug } from "../../constants/categories";
import { CATEGORY_STYLE, DEFAULT_CATEGORY_STYLE } from "../../constants/categoryIcons";

// Same "All categories" icon-chip card Home uses, as a component so the
// /blogs and /news pages can show it too.
export default function CategoriesCard() {
  return (
    <div className="shrink-0 bg-white border border-borderClr rounded-xl p-4">
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
  );
}