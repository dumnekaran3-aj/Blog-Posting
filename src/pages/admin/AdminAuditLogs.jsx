import { useEffect, useState } from "react";
import adminApi from "../../services/adminApi";

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await adminApi.get("/admin/logs");
        setLogs(data.logs);
      } catch (err) {
        // leave list empty on failure
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-xl font-medium text-textDark mb-1">Audit logs</h1>
      <p className="text-xs text-textMuted mb-5">Every admin action, recorded — Super Admin only</p>

      {loading && <p className="text-sm text-textMuted">Loading...</p>}

      <div className="bg-white border border-borderClr rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-bgLight text-textMuted">
            <tr>
              <th className="text-left px-4 py-2 font-medium">When</th>
              <th className="text-left px-4 py-2 font-medium">Actor</th>
              <th className="text-left px-4 py-2 font-medium">Action</th>
              <th className="text-left px-4 py-2 font-medium">Details</th>
              <th className="text-left px-4 py-2 font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {!loading && logs.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-textMuted">No actions logged yet.</td></tr>
            )}
            {!loading &&
              logs.map((log) => (
                <tr key={log._id} className="border-t border-borderClr">
                  <td className="px-4 py-2.5 text-textMuted whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-textDark">
                    {log.actor?.name} <span className="text-textMuted">({log.actor?.role})</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">{log.action}</span>
                  </td>
                  <td className="px-4 py-2.5 text-textMuted max-w-xs truncate">{log.details}</td>
                  <td className="px-4 py-2.5 text-textMuted">{log.ip}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}