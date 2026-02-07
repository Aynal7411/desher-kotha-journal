import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { categories } from "../data/categories";
import { getToken, request } from "../lib/api";

const formatDate = (date) =>
  new Intl.DateTimeFormat("bn-BD", {
    dateStyle: "full"
  }).format(new Date(date));

export default function ArticleDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const articleRes = await fetch(`/api/articles/${slug}?view=1`);
        if (!articleRes.ok) throw new Error("খবর পাওয়া যায়নি");
        const articleData = await articleRes.json();

        const commentsData = await request(`/api/articles/${slug}/comments`);

        if (active) {
          setArticle(articleData);
          setComments(commentsData);
        }
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
  }, [slug]);

  const canSubmit = useMemo(() => commentText.trim().length > 0, [commentText]);

  const submitComment = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const newComment = await request(`/api/articles/${slug}/comments`, {
        method: "POST",
        body: { text: commentText.trim() },
        token
      });
      setComments((prev) => [newComment, ...prev]);
      setCommentText("");
    } catch (err) {
      setError(err.message || "কমেন্ট যোগ হয়নি");
    }
  };

  if (loading) {
    return (
      <div className="article-page">
        <div className="container">
          <div className="alert">লোড হচ্ছে...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="article-page">
        <div className="container">
          <div className="alert">{error}</div>
          <Link to="/" className="ghost-button">
            হোমে ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  if (!article) return null;

  const shareUrl = window.location.href;
  const shareText = `${article.title}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  const paragraphs = article.body ? article.body.split(/\n+/).filter(Boolean) : [];

  const tocItems = paragraphs.slice(0, 6).map((text, idx) => {
    const words = text.replace(/\s+/g, " ").trim().split(" ").slice(0, 4).join(" ");
    return {
      id: `section-${idx + 1}`,
      label: words || `Section ${idx + 1}`
    };
  });

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
        <Link to="/" className="ghost-button">
          ← হোম
        </Link>

        <article className="article-detail">
          <div className="article-hero" style={{ backgroundImage: `url(${article.imageUrl})` }} />
          <div className="article-body">
            <span className="pill">{article.category}</span>
            <h1>{article.title}</h1>
            <div className="meta">
              <span>{article.author}</span>
              <span>•</span>
              <span>{formatDate(article.publishedAt)}</span>
            </div>
            <p className="lead">{article.excerpt}</p>

            <div className="article-content">
              {tocItems.length > 0 && (
                <aside className="article-toc">
                  <h4>সূচিপত্র</h4>
                  <ul>
                    {tocItems.map((item) => (
                      <li key={item.id}>
                        <a href={`#${item.id}`}>{item.label}</a>
                      </li>
                    ))}
                  </ul>
                </aside>
              )}

              <div className="article-text">
                {paragraphs.length > 0
                  ? paragraphs.map((text, idx) => (
                      <p key={idx} id={`section-${idx + 1}`}>
                        {text}
                      </p>
                    ))
                  : article.body && <p>{article.body}</p>}
              </div>
            </div>
            <div className="share-bar">
              <span>শেয়ার করুন:</span>
              <a href={whatsappUrl} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
              <a href={facebookUrl} target="_blank" rel="noreferrer">
                Facebook
              </a>
            </div>
          </div>
        </article>

        <section className="comment-section">
          <div className="section-header">
            <div>
              <span className="kicker">কমেন্ট</span>
              <h2>পাঠকের মতামত</h2>
            </div>
          </div>

          <form className="comment-form" onSubmit={submitComment}>
            <textarea
              rows={4}
              placeholder="আপনার মতামত লিখুন..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button className="primary" type="submit" disabled={!canSubmit}>
              কমেন্ট পাঠান
            </button>
          </form>

          <div className="comment-list">
            {comments.length === 0 && <p className="muted">এখনো কোনো মন্তব্য নেই।</p>}
            {comments.map((comment) => (
              <div key={comment._id} className="comment-card">
                <div className="comment-meta">
                  <strong>{comment.authorName}</strong>
                  <span>{new Date(comment.createdAt).toLocaleDateString("bn-BD")}</span>
                </div>
                <p>{comment.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
