import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate("/"); // login ke baad home pe bhej do
    } catch (err) {
      setError(err.response?.data?.msg || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bgLight">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm bg-white border border-borderClr rounded-xl p-6">
          <h1 className="text-lg font-medium text-textDark mb-1">Welcome back</h1>
          <p className="text-xs text-textMuted mb-6">Sign in to continue to Blogpost</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary"
                placeholder="Your password"
              />
            </div>

            {error && <p className="text-xs text-danger">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-white text-sm py-2 rounded-md mt-2 hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-xs text-textMuted mt-4 text-center">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}