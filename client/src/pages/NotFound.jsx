import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { categories } from "../data/categories";

export default function NotFound() {
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
        <div className="alert">পেজটি খুঁজে পাওয়া যায়নি।</div>
        <Link to="/" className="ghost-button">
          হোমে ফিরে যান
        </Link>
      </main>
    </div>
  );
}
