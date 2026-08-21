import { Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { categories, categorySlug } from "../constants/categories";

export default function Categories() {
  return (
    <div className="min-h-screen flex flex-col bg-bgLight">
      <Navbar />

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <h1 className="text-2xl font-medium text-textDark mb-1">All categories</h1>
        <p className="text-sm text-textMuted mb-6">Browse posts by topic</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.value}
              to={`/category/${categorySlug(cat.value)}`}
              className="bg-white border border-borderClr rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:border-primary/40 transition-colors"
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-xs font-medium text-textDark">{cat.value}</span>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}