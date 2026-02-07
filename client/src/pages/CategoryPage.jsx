import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { categories, findCategory } from "../data/categories";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const formatDate = (date) =>
  new Intl.DateTimeFormat("bn-BD", {
    dateStyle: "full"
  }).format(new Date(date));

export default function CategoryPage() {
  const { category, sub } = useParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cat = useMemo(() => findCategory(category), [category]);
  const title = cat ? cat.name : "বিভাগ";

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const query = new URLSearchParams();
        if (cat) query.set("category", cat.name);
        if (sub) {
          const subName = cat?.subs?.find((s) => s.slug === sub)?.name;
          if (subName) query.set("tag", subName);
        }
        const response = await fetch(`${API_BASE}/api/articles?limit=30&${query.toString()}`);
        if (!response.ok) throw new Error("ডেটা লোড হয়নি");
        const data = await response.json();
        if (active) setArticles(data);
      } catch (err) {
        if (active) setError(err.message || "ডেটা লোড হয়নি");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [cat, sub]);

  return (
    <div className="app">
      <div className="topbar">
        <div className="container">
          <span>{formatDate(new Date())}</span>
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
        <div className="section-header">
          <div>
            <span className="kicker">বিভাগ</span>
            <h2>
              {title}
              {sub ? ` • ${cat?.subs?.find((s) => s.slug === sub)?.name || ""}` : ""}
            </h2>
          </div>
        </div>

        <div className="category-filter">
          {categories.map((item) => (
            <Link key={item.slug} to={`/category/${item.slug}`} className="pill ghost">
              {item.name}
            </Link>
          ))}
        </div>

        {loading && <div className="alert">লোড হচ্ছে...</div>}
        {error && <div className="alert">{error}</div>}

        <div className="grid">
          {articles.map((article) => (
            <Link key={article.slug} to={`/article/${article.slug}`} className="card-link">
              <article className="card card-md">
                <div className="card-image" style={{ backgroundImage: `url(${article.imageUrl})` }} />
                <div className="card-body">
                  <span className="pill">{article.category}</span>
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                  <div className="meta">
                    <span>{article.author}</span>
                    <span>•</span>
                    <span>{formatDate(article.publishedAt)}</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
