import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, ExternalLink, RefreshCw, HelpCircle } from "lucide-react";
import adminApi from "../../services/adminApi";

const StatRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-borderClr last:border-0">
    <span className="text-xs text-textMuted">{label}</span>
    <span className="text-sm font-medium text-textDark">{value}</span>
  </div>
);

// Small pill used for both the static meta-tag checks and the live
// Search Console result — same three visual states everywhere on this
// page: green (good), amber (needs attention), red (broken/error).
const StatusPill = ({ tone, children }) => {
  const styles = {
    good: "bg-success/10 text-success",
    warn: "bg-amber-50 text-amber-600",
    bad: "bg-danger/10 text-danger",
    muted: "bg-slate-100 text-slate-500",
  };
  const icons = { good: CheckCircle2, warn: AlertTriangle, bad: XCircle, muted: HelpCircle };
  const Icon = icons[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${styles[tone]}`}>
      <Icon size={13} /> {children}
    </span>
  );
};

export default function AdminSitemap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data: res } = await adminApi.get("/admin/sitemap-status");
      setData(res);
    } catch (err) {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Search Console permission levels, in plain English — 'siteOwner' etc.
  // means nothing to someone skimming an admin panel.
  const permissionLabel = {
    siteOwner: "Verified — Owner",
    siteFullUser: "Verified — Full user",
    siteRestrictedUser: "Verified — Restricted user",
    siteUnverifiedUser: "Not verified",
  };

  return (
    <div className="p-6 lg:p-8 w-full min-h-screen flex flex-col">
      <div className="flex items-center justify-between mb-1 w-full">
        <h1 className="text-xl font-medium text-textDark">Sitemap</h1>
        <button
          onClick={() => fetchStatus(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 text-xs text-primary border border-borderClr rounded-md px-3 py-1.5 hover:border-primary/40 disabled:opacity-60"
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>
      <p className="text-xs text-textMuted mb-5 max-w-3xl">
        sitemap.xml is generated fresh from the database on every request — there's nothing to "regenerate",
        it's always current. This page just shows what's currently in it.
      </p>

      {loading && <p className="text-sm text-textMuted">Loading...</p>}

      {!loading && !data && (
        <p className="text-sm text-danger">Could not load sitemap status. Try refreshing.</p>
      )}

      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 flex-1 auto-rows-fr content-start">
          {/* URL breakdown */}
          <div className="bg-white border border-borderClr rounded-xl p-5 h-full">
            <p className="text-sm font-medium text-textDark mb-2">What's in the sitemap</p>
            <StatRow label="Published posts" value={data.breakdown.posts} />
            <StatRow label="Categories" value={data.breakdown.categories} />
            <StatRow label="Static pages" value={data.breakdown.staticPages} />
            <StatRow label="Total URLs" value={data.totalUrls} />
            <div className="flex gap-4 mt-3 pt-3 border-t border-borderClr">
              <a
                href={data.sitemapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View sitemap.xml <ExternalLink size={11} />
              </a>
              <a
                href={data.robotsTxtUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View robots.txt <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {/* Verification meta tags */}
          <div className="bg-white border border-borderClr rounded-xl p-5 h-full">
            <p className="text-sm font-medium text-textDark mb-3">Verification tags in site HTML</p>
            <div className="flex gap-2 flex-wrap">
              <StatusPill tone={data.verificationTags.google ? "good" : "bad"}>
                Google {data.verificationTags.google ? "tag present" : "tag missing"}
              </StatusPill>
              <StatusPill tone={data.verificationTags.bing ? "good" : "bad"}>
                Bing {data.verificationTags.bing ? "tag present" : "tag missing"}
              </StatusPill>
            </div>
          </div>

          {/* Live Google Search Console status */}
          <div className="bg-white border border-borderClr rounded-xl p-5 h-full">
            <p className="text-sm font-medium text-textDark mb-3">Google Search Console (live)</p>

            {!data.googleSearchConsole.configured && (
              <div>
                <StatusPill tone="muted">Not set up</StatusPill>
                <p className="text-[11px] text-textMuted mt-2">
                  Add a <code className="bg-bgLight px-1 rounded">GOOGLE_SERVICE_ACCOUNT_JSON</code> environment
                  variable to show live verification status here instead of just the static tag check above.
                </p>
              </div>
            )}

            {data.googleSearchConsole.configured && data.googleSearchConsole.verified === null && (
              <div>
                <StatusPill tone="bad">Check failed</StatusPill>
                <p className="text-[11px] text-textMuted mt-2">{data.googleSearchConsole.error}</p>
              </div>
            )}

            {data.googleSearchConsole.configured && data.googleSearchConsole.verified === true && (
              <StatusPill tone="good">
                {permissionLabel[data.googleSearchConsole.permissionLevel] || "Verified"}
              </StatusPill>
            )}

            {data.googleSearchConsole.configured && data.googleSearchConsole.verified === false && (
              <div>
                <StatusPill tone="warn">Not verified yet</StatusPill>
                <p className="text-[11px] text-textMuted mt-2">
                  Credentials are working, but Google doesn't show this property as verified for this
                  service account yet — double check it was added under Search Console → Settings → Users
                  and permissions.
                </p>
              </div>
            )}
          </div>

          <p className="text-[11px] text-textMuted lg:col-span-2 2xl:col-span-3 self-end">
            Checked {new Date(data.checkedAt).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
      )}
    </div>
  );
}