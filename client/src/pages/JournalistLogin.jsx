import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { request, setToken } from "../lib/api";

export default function JournalistLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await request("/api/auth/journalist/login", {
        method: "POST",
        body: form
      });
      setToken(data.token);
      navigate("/admin");
    } catch (err) {
      setError(err.message || "লগইন ব্যর্থ হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>জার্নালিস্ট লগইন</h2>
        <p className="muted">আপনার সম্পাদকীয় অ্যাকাউন্ট ব্যবহার করুন</p>
        {error && <div className="alert">{error}</div>}
        <form onSubmit={submit} className="form">
          <label>
            ইমেইল
            <input name="email" value={form.email} onChange={update} required />
          </label>
          <label>
            পাসওয়ার্ড
            <input type="password" name="password" value={form.password} onChange={update} required />
          </label>
          <button className="primary" disabled={loading}>
            {loading ? "লোড হচ্ছে..." : "লগইন"}
          </button>
        </form>
        <p className="muted">
          নতুন জার্নালিস্ট? <Link to="/journalist/register">রেজিস্টার করুন</Link>
        </p>
      </div>
    </div>
  );
}
