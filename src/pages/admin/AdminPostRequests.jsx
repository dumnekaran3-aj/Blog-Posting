import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import adminApi from "../../services/adminApi";

const TABS = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

// Preset grant amounts — the "dono options" decision: fast preset buttons
// for the common cases, plus a free-number "Custom" input for anything else.
const PRESET_COUNTS = [1, 3, 5, 10];

export default function AdminPostRequests() {
  const [status, setStatus] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customCounts, setCustomCounts] = useState({}); // { [requestId]: string }
  const [actingId, setActingId] = useState(null); // request currently being approved/rejected — disables its buttons

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get("/admin/post-requests", { params: { status } });
      setRequests(data.requests);
    } catch (err) {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleApprove = async (id, grantedCount) => {
    if (!Number.isInteger(grantedCount) || grantedCount < 1) return;
    setActingId(id);
    try {
      await adminApi.patch(`/admin/post-requests/${id}/approve`, { grantedCount });
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      alert(err.response?.data?.msg || "Could not approve this request.");
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Reason for rejecting this request (shown to the user):");
    if (reason === null) return; // cancelled
    if (!reason.trim()) {
      alert("A reason is required.");
      return;
    }
    setActingId(id);
    try {
      await adminApi.patch(`/admin/post-requests/${id}/reject`, { reason: reason.trim() });
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      alert(err.response?.data?.msg || "Could not reject this request.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-medium text-textDark mb-1">Post requests</h1>
      <p className="text-xs text-textMuted mb-5">Users asking to publish more posts beyond their current limit</p>

      <div className="flex gap-1 mb-4 bg-white border border-borderClr rounded-lg p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatus(tab.id)}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              status === tab.id ? "bg-primary text-white" : "text-textMuted hover:text-textDark"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-borderClr rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-bgLight text-textMuted">
            <tr>
              <th className="text-left px-4 py-2 font-medium">User</th>
              <th className="text-left px-4 py-2 font-medium">Message</th>
              <th className="text-left px-4 py-2 font-medium">Usage</th>
              <th className="text-left px-4 py-2 font-medium">Requested</th>
              {status === "pending" && <th className="text-right px-4 py-2 font-medium">Actions</th>}
              {status !== "pending" && <th className="text-left px-4 py-2 font-medium">Outcome</th>}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-textMuted">Loading...</td></tr>
            )}
            {!loading && requests.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-textMuted">No {status} requests.</td></tr>
            )}
            {!loading &&
              requests.map((r) => (
                <tr key={r._id} className="border-t border-borderClr align-top">
                  <td className="px-4 py-2.5">
                    <p className="text-textDark font-medium">{r.user?.name || "Deleted user"}</p>
                    <p className="text-textMuted">{r.user?.email}</p>
                  </td>
                  <td className="px-4 py-2.5 text-textMuted max-w-xs">{r.message}</td>
                  <td className="px-4 py-2.5 text-textMuted whitespace-nowrap">
                    {r.currentPostCount}/{r.user?.postLimit ?? "?"} used
                  </td>
                  <td className="px-4 py-2.5 text-textMuted whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>

                  {status === "pending" && (
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex flex-wrap justify-end gap-1">
                          {PRESET_COUNTS.map((n) => (
                            <button
                              key={n}
                              disabled={actingId === r._id}
                              onClick={() => handleApprove(r._id, n)}
                              className="inline-flex items-center gap-1 text-success border border-success/30 rounded px-2 py-1 hover:bg-success/10 disabled:opacity-50"
                            >
                              <Check size={12} /> +{n}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            min={1}
                            max={50}
                            placeholder="Custom"
                            value={customCounts[r._id] || ""}
                            onChange={(e) => setCustomCounts((prev) => ({ ...prev, [r._id]: e.target.value }))}
                            className="w-16 border border-borderClr rounded px-2 py-1 text-xs outline-none focus:border-primary"
                          />
                          <button
                            disabled={actingId === r._id || !customCounts[r._id]}
                            onClick={() => handleApprove(r._id, parseInt(customCounts[r._id], 10))}
                            className="text-success border border-success/30 rounded px-2 py-1 hover:bg-success/10 disabled:opacity-50"
                          >
                            Grant
                          </button>
                          <button
                            disabled={actingId === r._id}
                            onClick={() => handleReject(r._id)}
                            className="inline-flex items-center gap-1 text-danger border border-danger/30 rounded px-2 py-1 hover:bg-danger/10 disabled:opacity-50"
                          >
                            <X size={12} /> Reject
                          </button>
                        </div>
                      </div>
                    </td>
                  )}

                  {status !== "pending" && (
                    <td className="px-4 py-2.5 text-textMuted">
                      {r.status === "approved" ? (
                        <span className="text-success">+{r.grantedCount} granted</span>
                      ) : (
                        <span className="text-danger">{r.rejectionReason}</span>
                      )}
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