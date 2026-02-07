import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { request, setToken } from "../lib/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({});

  const update = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const markTouched = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = "ইমেইল লিখুন";
    if (!form.password.trim()) next.password = "পাসওয়ার্ড লিখুন";
    if (form.password && form.password.length < 6) next.password = "কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন";
    return next;
  };

  const submit = async (e) => {
    e.preventDefault();
    const fieldErrors = validate();
    setTouched((prev) => ({ ...prev, ...Object.keys(fieldErrors).reduce((acc, key) => ({ ...acc, [key]: true }), {}) }));
    if (Object.keys(fieldErrors).length > 0) {
      setError("ফর্মে ভুল আছে");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await request("/api/auth/login", {
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
    <div className="admin-login">
      <div className="admin-card">
        <h2>অ্যাডমিন লগইন</h2>
        <p className="muted">এডিটর বা অ্যাডমিন অ্যাকাউন্ট ব্যবহার করুন।</p>
        {error && <div className="alert">{error}</div>}
        <form onSubmit={submit} className="form">
          <label>
            ইমেইল
            <input name="email" value={form.email} onChange={update} onBlur={markTouched} required />
            {touched.email && !form.email.trim() && <span className="field-error">ইমেইল লিখুন</span>}
          </label>
          <label>
            পাসওয়ার্ড
            <input type="password" name="password" value={form.password} onChange={update} onBlur={markTouched} required />
            {touched.password && form.password.length < 6 && (
              <span className="field-error">কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন</span>
            )}
          </label>
          <button className="primary" disabled={loading}>
            {loading ? "লোড হচ্ছে..." : "লগইন"}
          </button>
        </form>
      </div>
    </div>
  );
}
