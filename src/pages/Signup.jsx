import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import FormAlert from "../components/common/FormAlert";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(form);
      // /verify-otp ek standalone page hai (refresh/tab-close ke baad bhi
      // wapas aa sakte ho) — pehle ye sirf ek in-memory "step" tha jo
      // navigate away/refresh pe kho jaata tha, aur wapas aane ka koi
      // rasta nahi tha ("user already exists" dead-end).
      navigate("/verify-otp", { state: { email: form.email } });
    } catch (err) {
      setError(err.response?.data?.msg || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bgLight">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm bg-white border border-borderClr rounded-xl p-6">
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

            <FormAlert message={error} />

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
          <p className="text-xs text-textMuted mt-1 text-center">
            Signed up already but never verified?{" "}
            <Link to="/verify-otp" className="text-primary">
              Enter your code
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}