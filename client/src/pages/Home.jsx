import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { request } from "../lib/api";
import { categories } from "../data/categories";
import { fallbackArticles } from "../data/fallbackArticles";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const formatDate = (date) =>
  new Intl.DateTimeFormat("bn-BD", {
    dateStyle: "full"
  }).format(new Date(date));

const SectionHeader = ({ title, kicker }) => (
  <div className="section-header">
    <div>
      <span className="kicker">{kicker}</span>
      <h2>{title}</h2>
    </div>
    <button className="text-button">সব দেখুন</button>
  </div>
);

const ArticleCard = ({ article, size = "md" }) => (
  <article className={`card card-${size}`}>
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
);

const CompactItem = ({ article }) => (
  <div className="compact-item">
    <div>
      <span className="pill ghost">{article.category}</span>
      <h4>{article.title}</h4>
      <div className="meta small">
        <span>{article.author}</span>
        <span>•</span>
        <span>{formatDate(article.publishedAt)}</span>
      </div>
    </div>
    <div className="compact-thumb" style={{ backgroundImage: `url(${article.imageUrl})` }} />
  </div>
);

const MemoSectionHeader = React.memo(SectionHeader);
const MemoArticleCard = React.memo(ArticleCard);
const MemoCompactItem = React.memo(CompactItem);

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [mostRead, setMostRead] = useState([]);
  const [trending, setTrending] = useState([]);
  const [cache, setCache] = useState({});
  const mostReadRef = useRef(null);
  const trendingRef = useRef(null);
  const [mostReadLoaded, setMostReadLoaded] = useState(false);
  const [trendingLoaded, setTrendingLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState({ category: "", tag: "", from: "", to: "" });
  const [subscribeStatus, setSubscribeStatus] = useState("idle");
  const [subscribeError, setSubscribeError] = useState("");
  const [subscriberEmail, setSubscriberEmail] = useState("");

  const fetchArticles = async (query) => {
    const key = query.toString();
    if (cache[key]) return cache[key];
    const response = await fetch(`${API_BASE}/api/articles?${key}`);
    if (!response.ok) throw new Error("Failed to load");
    const data = await response.json();
    setCache((prev) => ({ ...prev, [key]: data }));
    return data;
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const baseQuery = new URLSearchParams({ limit: "20" });
        const data = await fetchArticles(baseQuery);
        if (active) {
          setArticles(data);
          setError(null);
        }

      } catch (err) {
        if (active) {
          setArticles(fallbackArticles);
          setError("API সংযোগ পাওয়া যায়নি, নমুনা খবর দেখানো হচ্ছে।");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target === mostReadRef.current && !mostReadLoaded) {
            try {
              const data = await fetchArticles(new URLSearchParams({ limit: "6", sort: "views" }));
              setMostRead(data);
              setMostReadLoaded(true);
            } catch (err) {
              setMostReadLoaded(true);
            }
          }

          if (entry.isIntersecting && entry.target === trendingRef.current && !trendingLoaded) {
            try {
              const data = await fetchArticles(new URLSearchParams({ limit: "6", trending: "1" }));
              setTrending(data);
              setTrendingLoaded(true);
            } catch (err) {
              setTrendingLoaded(true);
            }
          }
        }
      },
      { rootMargin: "200px" }
    );

    if (mostReadRef.current) observer.observe(mostReadRef.current);
    if (trendingRef.current) observer.observe(trendingRef.current);

    return () => observer.disconnect();
  }, [mostReadLoaded, trendingLoaded, cache]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const hero = articles[0];
  const topStories = articles.slice(1, 5);
  const latest = articles.slice(5, 10);

  const categoryList = useMemo(() => categories, []);

  const byCategory = (cat) => articles.filter((a) => a.category === cat).slice(0, 3);

  const runSearch = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const params = new URLSearchParams({ limit: "20" });
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (filter.category) params.set("category", filter.category);
    if (filter.tag) params.set("tag", filter.tag);
    if (filter.from) params.set("from", filter.from);
    if (filter.to) params.set("to", filter.to);
    try {
      const data = await fetchArticles(params);
      setArticles(data);
      setError(null);
    } catch (err) {
      setError("সার্চ ব্যর্থ হয়েছে");
    }
  };

  useEffect(() => {
    if (debouncedSearch || filter.category || filter.tag || filter.from || filter.to) {
      runSearch();
    }
  }, [debouncedSearch, filter.category, filter.tag, filter.from, filter.to]);

  const clearFilters = () => {
    setSearchTerm("");
    setFilter({ category: "", tag: "", from: "", to: "" });
  };

  const activeChips = [
    searchTerm && { label: `খোঁজ: ${searchTerm}`, key: "q" },
    filter.category && { label: filter.category, key: "category" },
    filter.tag && { label: `ট্যাগ: ${filter.tag}`, key: "tag" },
    filter.from && { label: `থেকে: ${filter.from}`, key: "from" },
    filter.to && { label: `পর্যন্ত: ${filter.to}`, key: "to" }
  ].filter(Boolean);

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
              <em className="brand-tagline">সত্যের পাশে, জনতার কণ্ঠে</em>
            </div>
          </div>
          <form className="search" onSubmit={runSearch}>
            <input
              type="text"
              placeholder="খবর খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit">খুঁজুন</button>
          </form>
          <div className="actions">
            <button
              className="primary"
              onClick={() => {
                setSubscribeError("");
                setSubscribeStatus("form");
              }}
              disabled={subscribeStatus === "subscribed"}
            >
              {subscribeStatus === "subscribed" ? "Subscribed" : "সাবস্ক্রাইব"}
            </button>
          </div>
        </div>
        <Navbar categories={categoryList} />
      </header>

      <section className="breaking">
        <div className="container">
          <span className="label">ব্রেকিং</span>
          <div className="breaking-text">{hero?.title || "আজকের সর্বশেষ সংবাদ এখানে চলবে"}</div>
        </div>
      </section>

      <main className="container main-layout">
        <div className="filter-bar">
          <select
            value={filter.category}
            onChange={(e) => setFilter((prev) => ({ ...prev, category: e.target.value }))}
          >
            <option value="">সব বিভাগ</option>
            {categoryList.map((cat) => (
              <option key={cat.slug} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="ট্যাগ"
            value={filter.tag}
            onChange={(e) => setFilter((prev) => ({ ...prev, tag: e.target.value }))}
          />
          <input
            type="date"
            value={filter.from}
            onChange={(e) => setFilter((prev) => ({ ...prev, from: e.target.value }))}
          />
          <input
            type="date"
            value={filter.to}
            onChange={(e) => setFilter((prev) => ({ ...prev, to: e.target.value }))}
          />
          <button type="button" className="ghost-button" onClick={runSearch}>
            ফিল্টার
          </button>
          <button type="button" className="ghost-button" onClick={clearFilters}>
            ক্লিয়ার
          </button>
        </div>

        <div className="filter-meta">
          <div className="filter-chips">
            {activeChips.length === 0 && <span className="muted">কোনো ফিল্টার নেই</span>}
            {activeChips.map((chip) => (
              <span className="filter-chip" key={chip.key + chip.label}>
                {chip.label}
              </span>
            ))}
          </div>
          <span className="muted">মোট ফলাফল: {articles.length}</span>
        </div>

        {error && <div className="alert">{error}</div>}
        {loading && <div className="alert">লোড হচ্ছে...</div>}

        {hero && (
          <section className="hero">
            <div className="hero-card" style={{ backgroundImage: `url(${hero.imageUrl})` }}>
              <div className="hero-content">
                <span className="pill">{hero.category}</span>
                <h1>{hero.title}</h1>
                <p>{hero.excerpt}</p>
                <div className="meta">
                  <span>{hero.author}</span>
                  <span>•</span>
                  <span>{formatDate(hero.publishedAt)}</span>
                </div>
                <Link className="primary" to={`/article/${hero.slug}`}>
                  পড়ুন বিস্তারিত
                </Link>
              </div>
            </div>
            <div className="hero-side">
              <MemoSectionHeader title="শীর্ষ সংবাদ" kicker="টপ স্টোরি" />
              <div className="stack">
                {topStories.map((story) => (
                  <Link key={story.slug} to={`/article/${story.slug}`} className="item-link">
                    <MemoCompactItem article={story} />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="grid-section">
          <MemoSectionHeader title="সর্বশেষ" kicker="লেটেস্ট" />
          <div className="grid">
            {latest.map((item) => (
              <Link key={item.slug} to={`/article/${item.slug}`} className="card-link">
                <MemoArticleCard article={item} />
              </Link>
            ))}
          </div>
        </section>

        <section className="grid-section" ref={mostReadRef}>
          <MemoSectionHeader title="সর্বাধিক পঠিত" kicker="মোস্ট রিড" />
          <div className="grid">
            {mostRead.map((item) => (
              <Link key={item.slug} to={`/article/${item.slug}`} className="card-link">
                <MemoArticleCard article={item} />
              </Link>
            ))}
          </div>
        </section>

        <section className="grid-section" ref={trendingRef}>
          <MemoSectionHeader title="ট্রেন্ডিং" kicker="ট্রেন্ডিং" />
          <div className="grid">
            {trending.map((item) => (
              <Link key={item.slug} to={`/article/${item.slug}`} className="card-link">
                <MemoArticleCard article={item} />
              </Link>
            ))}
          </div>
        </section>

        <section className="category-grid">
          {categoryList.slice(0, 6).map((cat) => {
            const items = byCategory(cat.name);
            return (
              <div key={cat.slug} className="category-panel">
                <MemoSectionHeader title={cat.name} kicker="বিষয়" />
                <div className="stack">
                  {items.length === 0 && <p className="muted">এই বিভাগে এখনো খবর নেই।</p>}
                  {items.map((item) => (
                    <Link key={item.slug} to={`/article/${item.slug}`} className="item-link">
                      <MemoCompactItem article={item} />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <div className="brand sm">
              <div className="brand-mark sm">দক</div>
              <div>
                <span>দেশের</span>
                <strong>কথা</strong>
              </div>
            </div>
            <p>সর্বশেষ, নির্ভরযোগ্য এবং দ্রুত সংবাদ।</p>
          </div>
          <div>
            <h4>সম্পাদকীয়</h4>
            <p>সম্পাদক: Md Aynal Haque</p>
            <p>ইমেইল: aynalhaque7411ad@gmail.com</p>
            <p>মোবাইল: 01908214958</p>
          </div>
          <div>
            <h4>সামাজিক</h4>
            <div className="social">
              <button>ফেসবুক</button>
              <button>টুইটার</button>
              <button>ইউটিউব</button>
            </div>
          </div>
        </div>
        <div className="footer-bottom">© 2026 দেশের কথা। সর্বস্বত্ব সংরক্ষিত।</div>
      </footer>

      {subscribeStatus === "form" && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>ইমেইল দিন</h3>
            <p className="muted">সাবস্ক্রাইব করলে সর্বশেষ খবরের আপডেট পাবেন।</p>
            <input
              type="email"
              placeholder="you@email.com"
              value={subscriberEmail}
              onChange={(e) => setSubscriberEmail(e.target.value)}
            />
            {subscribeError && <div className="alert">{subscribeError}</div>}
            <div className="modal-actions">
              <button className="ghost-button" onClick={() => setSubscribeStatus("idle")}>
                বাতিল
              </button>
              <button
                className="primary"
                onClick={async () => {
                  if (!subscriberEmail) return;
                  try {
                    await request("/api/subscribers", {
                      method: "POST",
                      body: { email: subscriberEmail }
                    });
                    setSubscribeError("");
                    setSubscribeStatus("subscribed");
                  } catch (err) {
                    setSubscribeError("সাবস্ক্রাইব ব্যর্থ হয়েছে");
                  }
                }}
              >
                সাবমিট
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
