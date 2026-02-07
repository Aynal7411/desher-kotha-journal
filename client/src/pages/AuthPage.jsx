import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { categories } from "../data/categories";
import { request, setToken } from "../lib/api";

const typeLabels = {
  reader: "পাঠক",
  journalist: "জার্নালিস্ট",
  admin: "অ্যাডমিন"
};

const modes = ["login", "register"];

export default function AuthPage({ initialType = "reader", initialMode = "login" }) {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState(initialType);
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: "", firstName: "", lastName: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({});

  const isRegister = mode === "register";

  const title = useMemo(() => {
    const roleLabel = typeLabels[accountType] || "পাঠক";
    return isRegister ? `${roleLabel} রেজিস্টার` : `${roleLabel} লগইন`;
  }, [accountType, isRegister]);

  const update = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const markTouched = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const resolveEndpoint = () => {
    if (accountType === "reader") {
      return isRegister ? "/api/auth/register" : "/api/auth/login";
    }
    if (accountType === "journalist") {
      return isRegister ? "/api/auth/journalist/register" : "/api/auth/journalist/login";
    }
    return isRegister ? "/api/auth/register" : "/api/auth/journalist/login";
  };

  const buildPayload = () => {
    if (isRegister) {
      const name =
        accountType === "journalist"
          ? `${form.firstName} ${form.lastName}`.trim()
          : form.name;
      const base = { name, email: form.email, password: form.password };
      if (accountType === "admin") {
        return { ...base, role: "admin" };
      }
      return base;
    }
    return { email: form.email, password: form.password };
  };

  const validate = () => {
    const next = {};
    if (isRegister && accountType !== "journalist" && !form.name.trim()) next.name = "নাম লিখুন";
    if (isRegister && accountType === "journalist") {
      if (!form.firstName.trim()) next.firstName = "প্রথম নাম লিখুন";
      if (!form.lastName.trim()) next.lastName = "শেষ নাম লিখুন";
    }
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
      const data = await request(resolveEndpoint(), {
        method: "POST",
        body: buildPayload()
      });
      setToken(data.token);
      if (accountType === "reader") {
        navigate("/");
        return;
      }

      if (data.user?.status === "rejected") {
        setError("আপনার আবেদন বাতিল হয়েছে।");
        return;
      }

      if (data.user?.status === "pending") {
        navigate("/journalist/pending");
        return;
      }

      navigate("/admin");
    } catch (err) {
      setError(err.message || "অনুরোধ ব্যর্থ হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const loginWithFacebookMock = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await request("/api/auth/facebook/mock", {
        method: "POST",
        body: { accountType }
      });
      setToken(data.token);
      if (accountType === "reader") {
        navigate("/");
        return;
      }
      if (data.user?.status === "rejected") {
        setError("আপনার আবেদন বাতিল হয়েছে।");
        return;
      }
      if (data.user?.status === "pending") {
        navigate("/journalist/pending");
        return;
      }
      navigate("/admin");
    } catch (err) {
      setError(err.message || "ফেসবুক লগইন ব্যর্থ হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="topbar">
        <div className="container">
          <span>{new Date().toLocaleDateString("bn-BD")}</span>
          <span>ঢাকা • ২৬° • আর্দ্রতা ৮২%</span>
          <span>দেশেরকথা.com</span>
        </div>
      </div>

      <header className="header">
        <div className="container header-grid">
          <div className="brand">
            <div className="brand-mark">দক</div>
            <div>
              <span>দেশের</span>
              <strong>কথা</strong>
            </div>
          </div>
          <div className="search">
            <input type="text" placeholder="খবর খুঁজুন..." />
            <button>খুঁজুন</button>
          </div>
          <div className="actions">
            <button className="primary">সাবস্ক্রাইব</button>
          </div>
        </div>
        <Navbar categories={categories} />
      </header>

      <main className="container main-layout">
        <div className="auth-card">
          <h2>{title}</h2>
          <p className="muted">একটি অ্যাকাউন্ট টাইপ নির্বাচন করুন</p>

          <div className="auth-tabs">
            {["reader", "journalist", "admin"].map((type) => (
              <button
                key={type}
                type="button"
                className={accountType === type ? "active" : ""}
                onClick={() => setAccountType(type)}
              >
                {typeLabels[type]}
              </button>
            ))}
          </div>

          <div className="auth-toggle">
            {modes.map((item) => (
              <button
                key={item}
                type="button"
                className={mode === item ? "active" : ""}
                onClick={() => setMode(item)}
              >
                {item === "login" ? "লগইন" : "রেজিস্টার"}
              </button>
            ))}
          </div>

          {error && <div className="alert">{error}</div>}

          <form onSubmit={submit} className="form">
            {isRegister && accountType !== "journalist" && (
              <label>
                নাম
                <input name="name" value={form.name} onChange={update} onBlur={markTouched} required />
                {touched.name && !form.name.trim() && <span className="field-error">নাম লিখুন</span>}
              </label>
            )}
            {isRegister && accountType === "journalist" && (
              <>
                <label>
                  প্রথম নাম
                  <input name="firstName" value={form.firstName} onChange={update} onBlur={markTouched} required />
                  {touched.firstName && !form.firstName.trim() && (
                    <span className="field-error">প্রথম নাম লিখুন</span>
                  )}
                </label>
                <label>
                  শেষ নাম
                  <input name="lastName" value={form.lastName} onChange={update} onBlur={markTouched} required />
                  {touched.lastName && !form.lastName.trim() && (
                    <span className="field-error">শেষ নাম লিখুন</span>
                  )}
                </label>
              </>
            )}
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
              {loading ? "লোড হচ্ছে..." : isRegister ? "রেজিস্টার" : "লগইন"}
            </button>
          </form>

          <button className="ghost-button" type="button" onClick={loginWithFacebookMock} disabled={loading}>
            ফেসবুক দিয়ে লগইন (মক)
          </button>

          <p className="muted">
            হোমে ফিরুন? <Link to="/">হোম</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
