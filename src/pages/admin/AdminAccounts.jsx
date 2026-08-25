import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import adminApi from "../../services/adminApi";

export default function AdminAccounts() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "moderator" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [revealedPassword, setRevealedPassword] = useState(null); // { email, password }

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get("/admin-auth/admins");
      setAdmins(data.admins);
    } catch (err) {
      // leave list empty on failure
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const { data } = await adminApi.post("/admin-auth/admins", form);
      setRevealedPassword({ email: data.admin.email, password: data.generatedPassword });
      setForm({ name: "", email: "", role: "moderator" });
      setShowCreate(false);
      fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.msg || "Could not create account");
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async (id, email) => {
    if (!window.confirm(`Generate a new password for ${email}? Their old password will stop working immediately.`))
      return;
    try {
      const { data } = await adminApi.post(`/admin-auth/admins/${id}/reset-password`);
      setRevealedPassword({ email, password: data.generatedPassword });
    } catch (err) {
      // could add a toast here later
    }
  };

  const handleResetTwoFactor = async (id, email) => {
    if (!window.confirm(`Reset 2FA for ${email}? They'll need to scan a new QR code on next login.`)) return;
    try {
      await adminApi.post(`/admin-auth/admins/${id}/reset-2fa`);
      fetchAdmins();
    } catch (err) {
      // could add a toast here later
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "active" ? "disabled" : "active";
    try {
      await adminApi.patch(`/admin-auth/admins/${id}/status`, { status: nextStatus });
      setAdmins((prev) => prev.map((a) => (a._id === id ? { ...a, status: nextStatus } : a)));
    } catch (err) {
      // could add a toast here later
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-medium text-textDark">Admin accounts</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-1.5 rounded-md hover:bg-primary/90"
        >
          <Plus size={13} /> New account
        </button>
      </div>
      <p className="text-xs text-textMuted mb-5">
        Create and manage moderator/analyst accounts. There is no self-signup — every account starts here.
      </p>

      {revealedPassword && (
        <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-5">
          <p className="text-xs font-medium text-textDark mb-1">
            Password for {revealedPassword.email} — copy it now, it won't be shown again
          </p>
          <div className="flex items-center gap-2">
            <code className="text-sm bg-white px-3 py-1.5 rounded border border-borderClr">
              {revealedPassword.password}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(revealedPassword.password)}
              className="text-xs text-primary"
            >
              Copy
            </button>
            <button onClick={() => setRevealedPassword(null)} className="text-xs text-textMuted ml-auto">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-textMuted">Loading...</p>}

      <div className="bg-white border border-borderClr rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-bgLight text-textMuted">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Email</th>
              <th className="text-left px-4 py-2 font-medium">Role</th>
              <th className="text-left px-4 py-2 font-medium">2FA</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-right px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && admins.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-textMuted">No admin accounts yet.</td></tr>
            )}
            {!loading &&
              admins.map((a) => (
                <tr key={a._id} className="border-t border-borderClr">
                  <td className="px-4 py-2.5 text-textDark">{a.name}</td>
                  <td className="px-4 py-2.5 text-textMuted">{a.email}</td>
                  <td className="px-4 py-2.5 capitalize">{a.role}</td>
                  <td className="px-4 py-2.5">
                    {a.twoFactorEnabled ? (
                      <span className="text-success">Set up</span>
                    ) : (
                      <span className="text-textMuted">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={a.status === "active" ? "text-success" : "text-danger"}>{a.status}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    {a.role === "admin" ? (
                      <span className="text-textMuted italic">Super Admin</span>
                    ) : (
                      <div className="flex justify-end gap-2 flex-wrap">
                        <button onClick={() => handleResetPassword(a._id, a.email)} className="text-primary hover:underline">
                          Reset password
                        </button>
                        <button onClick={() => handleResetTwoFactor(a._id, a.email)} className="text-secondary hover:underline">
                          Reset 2FA
                        </button>
                        <button onClick={() => handleToggleStatus(a._id, a.status)} className="text-accent hover:underline">
                          {a.status === "active" ? "Disable" : "Enable"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-textDark">Create admin account</h3>
              <button onClick={() => setShowCreate(false)} aria-label="Close">
                <X size={16} className="text-textMuted" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-textMuted mb-1 block">Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-textMuted mb-1 block">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-textMuted mb-1 block">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary"
                >
                  <option value="moderator">Moderator</option>
                  <option value="analyst">Analyst</option>
                </select>
              </div>

              {error && <p className="text-xs text-danger">{error}</p>}

              <button
                type="submit"
                disabled={creating}
                className="bg-primary text-white text-sm py-2 rounded-md mt-1 hover:bg-primary/90 disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create account"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}