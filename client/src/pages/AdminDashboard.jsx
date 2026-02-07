import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { getToken, request, setToken } from "../lib/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [pending, setPending] = useState([]);
  const [journalists, setJournalists] = useState([]);
  const [scores, setScores] = useState([]);
  const [myScore, setMyScore] = useState(0);
  const [selectedJournalist, setSelectedJournalist] = useState(null);
  const [journalistArticles, setJournalistArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/admin/login");
      return;
    }

    const load = async () => {
      try {
        const me = await request("/api/auth/me", { token });
        if (me.role === "editor" && me.status !== "approved") {
          navigate("/journalist/pending");
          return;
        }
        if (me.role !== "admin" && me.role !== "editor") {
          navigate("/login");
          return;
        }

        const data = await request("/api/articles/admin/all?limit=50", { token });
        setArticles(data);
        const scoreRes = await request("/api/stats/me", { token });
        setMyScore(scoreRes.score || 0);

        if (me.role === "admin") {
          const pendingUsers = await request("/api/auth/journalists?status=pending", { token });
          setPending(pendingUsers);
          const allJournalists = await request("/api/auth/journalists", { token });
          setJournalists(allJournalists);
          const scoreList = await request("/api/stats/journalists", { token });
          setScores(scoreList);
        }
      } catch (err) {
        setError(err.message || "ডেটা লোড হয়নি");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const remove = async (id) => {
    const token = getToken();
    if (!token) return;
    const confirmed = window.confirm("আপনি কি নিশ্চিতভাবে ডিলিট করতে চান?");
    if (!confirmed) return;
    try {
      await request(`/api/articles/${id}`, { method: "DELETE", token });
      setArticles((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setError(err.message || "ডিলিট ব্যর্থ");
    }
  };

  const approve = async (id) => {
    const token = getToken();
    if (!token) return;
    try {
      const updated = await request(`/api/auth/journalists/${id}/approve`, {
        method: "PATCH",
        token
      });
      setPending((prev) => prev.filter((item) => item._id !== updated._id));
    } catch (err) {
      setError(err.message || "অনুমোদন ব্যর্থ");
    }
  };

  const reject = async (id) => {
    const token = getToken();
    if (!token) return;
    try {
      const updated = await request(`/api/auth/journalists/${id}/reject`, {
        method: "PATCH",
        token
      });
      setPending((prev) => prev.filter((item) => item._id !== updated._id));
    } catch (err) {
      setError(err.message || "বাতিল ব্যর্থ");
    }
  };

  const viewJournalistArticles = async (user) => {
    const token = getToken();
    if (!token) return;
    setSelectedJournalist(user);
    try {
      const items = await request(`/api/articles/admin/by-author/${user._id}`, { token });
      setJournalistArticles(items);
    } catch (err) {
      setError(err.message || "জার্নালিস্টের খবর লোড হয়নি");
    }
  };

  const togglePublish = async (article) => {
    const token = getToken();
    if (!token) return;
    const nextStatus = article.status === "published" ? "draft" : "published";
    try {
      const updated = await request(`/api/articles/${article._id || article.slug}`, {
        method: "PUT",
        token,
        body: {
          status: nextStatus,
          publishedAt: nextStatus === "published" ? new Date().toISOString() : null
        }
      });
      setArticles((prev) =>
        prev.map((item) => (item._id === article._id || item.slug === article.slug ? updated : item))
      );
    } catch (err) {
      setError(err.message || "আপডেট ব্যর্থ");
    }
  };

  return (
    <AdminLayout>
      <div className="admin-header">
        <div>
          <h2>ড্যাশবোর্ড</h2>
          <p className="muted">খবর পরিচালনা করুন</p>
          <p className="muted">আপনার প্রকাশিত খবর: {myScore}</p>
        </div>
        <div className="admin-actions">
          <button
            className="ghost-button"
            onClick={() => {
              setToken(null);
              navigate("/admin/login");
            }}
          >
            লগআউট
          </button>
          <Link className="primary" to="/admin/new">
            নতুন খবর
          </Link>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}
      {loading && <div className="alert">লোড হচ্ছে...</div>}

      <div className="admin-table">
        <div className="admin-row admin-head">
          <span>শিরোনাম</span>
          <span>বিভাগ</span>
          <span>তারিখ</span>
          <span>স্ট্যাটাস</span>
          <span>অ্যাকশন</span>
        </div>
        {articles.map((article) => (
          <div className="admin-row" key={article._id || article.slug}>
            <span>{article.title}</span>
            <span>{article.category}</span>
            <span>
              {article.publishedAt
                ? new Date(article.publishedAt).toLocaleDateString("bn-BD")
                : "ড্রাফট"}
            </span>
            <span>{article.status === "published" ? "Published" : "Draft"}</span>
            <span className="actions">
              <button className="ghost-button" onClick={() => navigate(`/admin/edit/${article._id || article.slug}`)}>
                এডিট
              </button>
              <button className="ghost-button" onClick={() => togglePublish(article)}>
                {article.status === "published" ? "ড্রাফট" : "পাবলিশ"}
              </button>
              <button className="danger" onClick={() => remove(article._id || article.slug)}>
                ডিলিট
              </button>
            </span>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div className="admin-panel">
          <div className="admin-header">
            <div>
              <h3>পেন্ডিং জার্নালিস্ট</h3>
              <p className="muted">অ্যাপ্রুভ বা রিজেক্ট করুন</p>
            </div>
          </div>
          <div className="admin-table">
            <div className="admin-row admin-row-4 admin-head">
              <span>নাম</span>
              <span>ইমেইল</span>
              <span>তারিখ</span>
              <span>অ্যাকশন</span>
            </div>
            {pending.map((user) => (
              <div className="admin-row admin-row-4" key={user._id}>
                <span>{user.name}</span>
                <span>{user.email}</span>
                <span>{new Date(user.createdAt).toLocaleDateString("bn-BD")}</span>
                <span className="actions">
                  <button className="ghost-button" onClick={() => approve(user._id)}>
                    অনুমোদন
                  </button>
                  <button className="danger" onClick={() => reject(user._id)}>
                    বাতিল
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {journalists.length > 0 && (
        <div className="admin-panel">
          <div className="admin-header">
            <div>
              <h3>জার্নালিস্ট তালিকা</h3>
              <p className="muted">প্রতিটি জার্নালিস্টের লেখা খবর দেখুন</p>
            </div>
          </div>
          <div className="admin-table">
            <div className="admin-row admin-row-5 admin-head">
              <span>নাম</span>
              <span>ইমেইল</span>
              <span>স্ট্যাটাস</span>
              <span>স্কোর</span>
              <span>অ্যাকশন</span>
            </div>
            {journalists.map((user) => (
              <div className="admin-row admin-row-5" key={user._id}>
                <span>{user.name}</span>
                <span>{user.email}</span>
                <span>{user.status}</span>
                <span>{scores.find((s) => s.id === user._id)?.score ?? 0}</span>
                <span className="actions">
                  <button className="ghost-button" onClick={() => viewJournalistArticles(user)}>
                    খবর দেখুন
                  </button>
                </span>
              </div>
            ))}
          </div>

          {selectedJournalist && (
            <div className="admin-panel">
              <div className="admin-header">
                <div>
                  <h4>{selectedJournalist.name} এর খবর</h4>
                  <p className="muted">{selectedJournalist.email}</p>
                </div>
              </div>
              <div className="admin-table">
                <div className="admin-row admin-row-4 admin-head">
                  <span>শিরোনাম</span>
                  <span>বিভাগ</span>
                  <span>স্ট্যাটাস</span>
                  <span>তারিখ</span>
                </div>
                {journalistArticles.map((article) => (
                  <div className="admin-row admin-row-4" key={article._id || article.slug}>
                    <span>{article.title}</span>
                    <span>{article.category}</span>
                    <span>{article.status}</span>
                    <span>
                      {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleDateString("bn-BD")
                        : "ড্রাফট"}
                    </span>
                  </div>
                ))}
                {journalistArticles.length === 0 && <p className="muted">কোনো খবর নেই।</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
