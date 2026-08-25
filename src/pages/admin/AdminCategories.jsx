import { useEffect, useState } from "react";
import adminApi from "../../services/adminApi";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await adminApi.get("/admin/categories");
        setCategories(data.categories);
      } catch (err) {
        // leave list empty on failure
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-xl font-medium text-textDark mb-1">Categories</h1>
      <p className="text-xs text-textMuted mb-5">Post count per category</p>

      {loading && <p className="text-sm text-textMuted">Loading...</p>}

      <div className="bg-white border border-borderClr rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-bgLight text-textMuted">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Category</th>
              <th className="text-left px-4 py-2 font-medium">Posts</th>
            </tr>
          </thead>
          <tbody>
            {!loading && categories.length === 0 && (
              <tr><td colSpan={2} className="px-4 py-6 text-center text-textMuted">No posts yet.</td></tr>
            )}
            {!loading &&
              categories.map((c) => (
                <tr key={c.category} className="border-t border-borderClr">
                  <td className="px-4 py-2.5 text-textDark">{c.category}</td>
                  <td className="px-4 py-2.5 text-textMuted">{c.count}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}