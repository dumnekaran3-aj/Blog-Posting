import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";

export default function VerifyOtp() {
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      await verifyOtp({ email, otp });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.msg || "Could not verify. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Enter your email first, then tap resend.");
      return;
    }
    setError("");
    setResendMsg("");
    try {
      setResending(true);
      await resendOtp({ email });
      setResendMsg("If a pending account exists for this email, a new code has been sent.");
    } catch (err) {
      setError(err.response?.data?.msg || "Could not resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bgLight">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm bg-white border border-borderClr rounded-xl p-6">
          <h1 className="text-lg font-medium text-textDark mb-1">Verify your email</h1>
          <p className="text-xs text-textMuted mb-6">
            Signed up already but never entered the code? Enter your email and the 6-digit
            code we sent — or tap resend for a new one.
          </p>

          {success ? (
            <p className="text-sm text-success">Verified! Redirecting you to sign in...</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-textMuted mb-1 block">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="text-xs text-textMuted mb-1 block">6-digit code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary tracking-widest"
                  placeholder="123456"
                />
              </div>

              {error && <p className="text-xs text-danger">{error}</p>}
              {resendMsg && <p className="text-xs text-success">{resendMsg}</p>}

              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-white text-sm py-2 rounded-md mt-2 hover:bg-primary/90 disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-xs text-primary hover:underline mt-1 disabled:opacity-60"
              >
                {resending ? "Sending..." : "Didn't get a code? Resend"}
              </button>
            </form>
          )}

          <p className="text-xs text-textMuted mt-4 text-center">
            <Link to="/login" className="text-primary">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}