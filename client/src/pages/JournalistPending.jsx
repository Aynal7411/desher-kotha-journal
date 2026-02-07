import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { categories } from "../data/categories";

export default function JournalistPending() {
  const navigate = useNavigate();
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
            <button className="primary" onClick={() => navigate("/")}>সাবস্ক্রাইব</button>
          </div>
        </div>
        <Navbar categories={categories} />
      </header>

      <main className="container main-layout">
        <div className="auth-card">
          <h2>অ্যাপ্রুভাল পেন্ডিং</h2>
          <p className="muted">
            আপনার জার্নালিস্ট অ্যাকাউন্টটি অ্যাডমিন অনুমোদনের অপেক্ষায় আছে। অনুমোদন হলে আপনি
            ড্যাশবোর্ডে খবর প্রকাশ করতে পারবেন।
          </p>
          <Link to="/" className="ghost-button">
            হোমে ফিরে যান
          </Link>
        </div>
      </main>
    </div>
  );
}
