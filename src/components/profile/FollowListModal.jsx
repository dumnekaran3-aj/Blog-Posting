import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import api from "../../services/api";

// type: "followers" | "following"
export default function FollowListModal({ userId, type, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/users/${userId}/${type}`);
        setUsers(data.users || []);
      } catch (err) {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [userId, type]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-sm max-h-[70vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-borderClr">
          <h3 className="text-sm font-medium text-textDark capitalize">{type}</h3>
          <button onClick={onClose} aria-label="Close" className="text-textMuted hover:text-textDark">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {loading && <p className="text-xs text-textMuted p-3">Loading...</p>}

          {!loading && users.length === 0 && (
            <p className="text-xs text-textMuted p-3">
              {type === "followers" ? "No followers yet." : "Not following anyone yet."}
            </p>
          )}

          {!loading &&
            users.map((u) => (
              <Link
                key={u._id}
                to={`/profile/${u._id}`}
                onClick={onClose}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-bgLight"
              >
                {u.avatar ? (
                  <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                    {u.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-textDark truncate">{u.name}</p>
                  {u.bio && <p className="text-[11px] text-textMuted truncate">{u.bio}</p>}
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}