import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function AdminLogin() {
  const { loginStep1, verify2FA } = useAdminAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState("credentials"); // "credentials" | "code"
  const [form, setForm] = useState({ email: "", password: "" });
  const [pendingToken, setPendingToken] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [setupRequired, setSetupRequired] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCredentials = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginStep1(form);
      setPendingToken(data.pendingToken);
      setSetupRequired(data.setupRequired);
      if (data.setupRequired) setQrCodeDataUrl(data.qrCodeDataUrl);
      setStep("code");
    } catch (err) {
      setError(err.response?.data?.msg || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verify2FA({ pendingToken, code });
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.msg || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primaryDark px-6">
      <div className="w-full max-w-sm bg-white rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={20} className="text-primary" />
          <h1 className="text-lg font-medium text-textDark">Admin access</h1>
        </div>
        <p className="text-xs text-textMuted mb-6">VarityWire control panel — authorized staff only</p>

        {step === "credentials" && (
          <form onSubmit={handleCredentials} className="flex flex-col gap-3">
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
              <label className="text-xs text-textMuted mb-1 block">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary"
              />
            </div>

            {error && <p className="text-xs text-danger">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-white text-sm py-2 rounded-md mt-2 hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? "Checking..." : "Continue"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleVerify} className="flex flex-col gap-3">
            {setupRequired && qrCodeDataUrl && (
              <div className="text-center mb-2">
                <p className="text-xs text-textMuted mb-2">
                  Scan this with Google Authenticator, then enter the code it shows
                </p>
                <img src={qrCodeDataUrl} alt="2FA QR code" className="mx-auto w-40 h-40" />
              </div>
            )}
            {!setupRequired && (
              <p className="text-xs text-textMuted mb-1">Enter the 6-digit code from your authenticator app</p>
            )}

            <input
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary text-center tracking-widest"
            />

            {error && <p className="text-xs text-danger">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-white text-sm py-2 rounded-md mt-1 hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify & sign in"}
            </button>
            <button
              type="button"
              onClick={() => setStep("credentials")}
              className="text-xs text-textMuted hover:text-textDark"
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}