import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signup, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState("signup"); // "signup" -> "otp"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(form);
      setStep("otp"); // signup ho gaya, ab OTP maango
    } catch (err) {
      setError(err.response?.data?.msg || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyOtp({ email: form.email, otp });
      navigate("/login"); // verify ho gaya, ab login page pe bhej do
    } catch (err) {
      setError(err.response?.data?.msg || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bgLight">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm bg-white border border-borderClr rounded-xl p-6">
          {step === "signup" ? (
            <>
              <h1 className="text-lg font-medium text-textDark mb-1">Create your account</h1>
              <p className="text-xs text-textMuted mb-6">Start writing and sharing your posts</p>

              <form onSubmit={handleSignup} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-textMuted mb-1 block">Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary"
                    placeholder="Your name"
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
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="text-xs text-textMuted mb-1 block">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary"
                    placeholder="At least 6 characters"
                  />
                </div>

                {error && <p className="text-xs text-danger">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-white text-sm py-2 rounded-md mt-2 hover:bg-primary/90 disabled:opacity-60"
                >
                  {loading ? "Creating account..." : "Sign up"}
                </button>
              </form>

              <p className="text-xs text-textMuted mt-4 text-center">
                Already have an account?{" "}
                <Link to="/login" className="text-primary">
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-lg font-medium text-textDark mb-1">Verify your email</h1>
              <p className="text-xs text-textMuted mb-6">
                Enter the 6-digit code sent to <span className="text-textDark">{form.email}</span>
              </p>

              <form onSubmit={handleVerify} className="flex flex-col gap-3">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary tracking-widest text-center"
                  placeholder="000000"
                />

                {error && <p className="text-xs text-danger">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-white text-sm py-2 rounded-md mt-2 hover:bg-primary/90 disabled:opacity-60"
                >
                  {loading ? "Verifying..." : "Verify & continue"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}