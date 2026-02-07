import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { request, setToken } from "../lib/api";

export default function JournalistRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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
      const data = await request("/api/auth/journalist/register", {
        method: "POST",
        body: form
      });
      setToken(data.token);
      navigate("/admin");
    } catch (err) {
      setError(err.message || "রেজিস্টার ব্যর্থ হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>জার্নালিস্ট রেজিস্টার</h2>
        <p className="muted">নতুন সম্পাদকীয় অ্যাকাউন্ট তৈরি করুন</p>
        {error && <div className="alert">{error}</div>}
        <form onSubmit={submit} className="form">
          <label>
            নাম
            <input name="name" value={form.name} onChange={update} required />
          </label>
          <label>
            ইমেইল
            <input name="email" value={form.email} onChange={update} required />
          </label>
          <label>
            পাসওয়ার্ড
            <input type="password" name="password" value={form.password} onChange={update} required />
          </label>
          <button className="primary" disabled={loading}>
            {loading ? "লোড হচ্ছে..." : "রেজিস্টার"}
          </button>
        </form>
        <p className="muted">
          আগেই অ্যাকাউন্ট আছে? <Link to="/journalist/login">লগইন করুন</Link>
        </p>
      </div>
    </div>
  );
}
