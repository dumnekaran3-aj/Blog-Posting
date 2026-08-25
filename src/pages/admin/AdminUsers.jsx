import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext";
import adminApi from "../../services/adminApi";

const statusStyles = {
  active: "bg-success/10 text-success",
  suspended: "bg-accent/10 text-accent",
  banned: "bg-danger/10 text-danger",
};

export default function AdminUsers() {
  const { admin } = useAdminAuth();
  const canAct = admin?.role === "admin"; // moderator can view only

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get("/admin/users", { params: { search } });
      setUsers(data.users);
    } catch (err) {
      // leave list empty on failure
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const handleStatusChange = async (id, status) => {
    try {
      await adminApi.patch(`/admin/users/${id}/status`, { status });
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, status } : u)));
    } catch (err) {
      // could add a toast here later
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Permanently delete "${name}"'s account?`)) return;
    try {
      await adminApi.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      // could add a toast here later
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-medium text-textDark mb-1">Users</h1>
      <p className="text-xs text-textMuted mb-5">
        {canAct ? "Manage site user accounts" : "View-only — only a Super Admin can suspend, ban, or delete users"}
      </p>

      <div className="bg-white border border-borderClr rounded-xl px-3 py-2 flex items-center gap-2 mb-4 max-w-xs">
        <Search size={14} className="text-textMuted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email"
          className="text-xs outline-none w-full"
        />
      </div>

      <div className="bg-white border border-borderClr rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-bgLight text-textMuted">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Email</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium">Joined</th>
              {canAct && <th className="text-right px-4 py-2 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-textMuted">Loading...</td></tr>
            )}
            {!loading && users.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-textMuted">No users found.</td></tr>
            )}
            {!loading &&
              users.map((u) => (
                <tr key={u._id} className="border-t border-borderClr">
                  <td className="px-4 py-2.5 text-textDark">{u.name}</td>
                  <td className="px-4 py-2.5 text-textMuted">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded ${statusStyles[u.status]}`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-textMuted">
                    {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  {canAct && (
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-1.5">
                        {u.status !== "active" && (
                          <button onClick={() => handleStatusChange(u._id, "active")} className="text-success hover:underline">
                            Activate
                          </button>
                        )}
                        {u.status !== "suspended" && (
                          <button onClick={() => handleStatusChange(u._id, "suspended")} className="text-accent hover:underline">
                            Suspend
                          </button>
                        )}
                        {u.status !== "banned" && (
                          <button onClick={() => handleStatusChange(u._id, "banned")} className="text-danger hover:underline">
                            Ban
                          </button>
                        )}
                        <button onClick={() => handleDelete(u._id, u.name)} className="text-textMuted hover:text-danger">
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}