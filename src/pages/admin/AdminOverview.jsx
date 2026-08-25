import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, FileText, Eye, Heart, MessageSquare, ShieldBan } from "lucide-react";
import adminApi from "../../services/adminApi";

const toneClasses = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent",
  danger: "bg-danger/10 text-danger",
};

const SummaryCard = ({ icon: Icon, label, value, tone = "primary" }) => (
  <div className="bg-white border border-borderClr rounded-xl p-4">
    <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-2 ${toneClasses[tone]}`}>
      <Icon size={15} />
    </div>
    <p className="text-lg font-medium text-textDark">{value}</p>
    <p className="text-[11px] text-textMuted">{label}</p>
  </div>
);

export default function AdminOverview() {
  const [summary, setSummary] = useState(null);
  const [range, setRange] = useState("day");
  const [growth, setGrowth] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [summaryRes, growthRes, activeRes, topRes] = await Promise.all([
          adminApi.get("/admin/analytics/summary"),
          adminApi.get("/admin/analytics/growth", { params: { range } }),
          adminApi.get("/admin/analytics/active-users", { params: { range } }),
          adminApi.get("/admin/analytics/top-users"),
        ]);
        setSummary(summaryRes.data);
        setGrowth(growthRes.data.data);
        setActiveUsers(activeRes.data.data);
        setTopUsers(topRes.data.users);
      } catch (err) {
        // leave defaults on failure
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [range]);

  if (loading) {
    return <div className="p-8 text-sm text-textMuted">Loading dashboard...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-medium text-textDark mb-6">Overview</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard icon={Users} label="Total users" value={summary?.totalUsers ?? 0} />
        <SummaryCard icon={FileText} label="Published posts" value={summary?.publishedPosts ?? 0} tone="secondary" />
        <SummaryCard icon={Eye} label="Total views" value={summary?.totalViews ?? 0} tone="accent" />
        <SummaryCard icon={Heart} label="Total likes" value={summary?.totalLikes ?? 0} tone="danger" />
        <SummaryCard icon={MessageSquare} label="Total comments" value={summary?.totalComments ?? 0} />
        <SummaryCard icon={FileText} label="Draft posts" value={summary?.draftPosts ?? 0} tone="secondary" />
        <SummaryCard icon={ShieldBan} label="Suspended" value={summary?.suspendedCount ?? 0} tone="accent" />
        <SummaryCard icon={ShieldBan} label="Banned" value={summary?.bannedCount ?? 0} tone="danger" />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-textDark">Login growth</h2>
        <div className="flex gap-1">
          {["day", "month", "year"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-xs px-3 py-1 rounded-md capitalize ${
                range === r ? "bg-primary text-white" : "text-textMuted border border-borderClr"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-borderClr rounded-xl p-4">
          <p className="text-xs font-medium text-textDark mb-3">Total logins</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={growth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-borderClr rounded-xl p-4">
          <p className="text-xs font-medium text-textDark mb-3">Active users (distinct logins)</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={activeUsers}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#0EA5A4" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-borderClr rounded-xl p-4">
        <p className="text-xs font-medium text-textDark mb-3">Most-viewed authors</p>
        {topUsers.length === 0 ? (
          <p className="text-xs text-textMuted">No data yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {topUsers.map((u, i) => (
              <div key={i} className="flex items-center justify-between text-xs border-b border-borderClr pb-2 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-textMuted w-4">{i + 1}.</span>
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-medium">
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-textDark">{u.name}</span>
                </div>
                <span className="text-textMuted">{u.totalViews} views &middot; {u.postCount} posts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}