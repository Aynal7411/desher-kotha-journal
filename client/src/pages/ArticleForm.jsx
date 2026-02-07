import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { getToken, request } from "../lib/api";

const emptyForm = {
  title: "",
  category: "",
  author: "",
  excerpt: "",
  body: "",
  imageUrl: "",
  tags: "",
  status: "published"
};

export default function ArticleForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({});

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/admin/login");
      return;
    }

    if (!isEdit) return;

    const load = async () => {
      try {
        const data = await request(`/api/articles/${id}`, { token });
        setForm({
          title: data.title || "",
          category: data.category || "",
          author: data.author || "",
          excerpt: data.excerpt || "",
          body: data.body || "",
          imageUrl: data.imageUrl || "",
          tags: data.tags ? data.tags.join(", ") : "",
          status: data.status || "published"
        });
      } catch (err) {
        setError(err.message || "লোড ব্যর্থ");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isEdit, navigate]);

  const update = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const markTouched = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = "শিরোনাম লিখুন";
    if (!form.category.trim()) next.category = "বিভাগ লিখুন";
    if (!form.author.trim()) next.author = "লেখক লিখুন";
    if (!form.excerpt.trim()) next.excerpt = "সারসংক্ষেপ লিখুন";
    if (!form.body.trim()) next.body = "বিস্তারিত লিখুন";
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
    const token = getToken();
    if (!token) return;

    const payload = {
      ...form,
      tags: form.tags
        ? form.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : []
    };

    try {
      if (isEdit) {
        await request(`/api/articles/${id}`, { method: "PUT", body: payload, token });
      } else {
        await request("/api/articles", { method: "POST", body: payload, token });
      }
      navigate("/admin");
    } catch (err) {
      setError(err.message || "সংরক্ষণ ব্যর্থ");
    }
  };

  return (
    <AdminLayout>
      <div className="admin-header">
        <div>
          <h2>{isEdit ? "খবর আপডেট" : "নতুন খবর"}</h2>
          <p className="muted">শিরোনাম, বিভাগ ও বিস্তারিত লিখুন</p>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}
      {loading ? (
        <div className="alert">লোড হচ্ছে...</div>
      ) : (
        <form className="form admin-form" onSubmit={submit}>
          <label>
            শিরোনাম
            <input name="title" value={form.title} onChange={update} onBlur={markTouched} required />
            {touched.title && !form.title.trim() && <span className="field-error">শিরোনাম লিখুন</span>}
          </label>
          <label>
            বিভাগ
            <input name="category" value={form.category} onChange={update} onBlur={markTouched} required />
            {touched.category && !form.category.trim() && <span className="field-error">বিভাগ লিখুন</span>}
          </label>
          <label>
            লেখক
            <input name="author" value={form.author} onChange={update} onBlur={markTouched} required />
            {touched.author && !form.author.trim() && <span className="field-error">লেখক লিখুন</span>}
          </label>
          <label>
            সারসংক্ষেপ
            <textarea name="excerpt" value={form.excerpt} onChange={update} onBlur={markTouched} required rows={3} />
            {touched.excerpt && !form.excerpt.trim() && (
              <span className="field-error">সারসংক্ষেপ লিখুন</span>
            )}
          </label>
          <label>
            বিস্তারিত
            <textarea name="body" value={form.body} onChange={update} onBlur={markTouched} required rows={6} />
            {touched.body && !form.body.trim() && <span className="field-error">বিস্তারিত লিখুন</span>}
          </label>
          <label>
            ছবি URL
            <input name="imageUrl" value={form.imageUrl} onChange={update} />
          </label>
          <label>
            ট্যাগ (কমা দিয়ে লিখুন)
            <input name="tags" value={form.tags} onChange={update} />
          </label>
          <label>
            স্ট্যাটাস
            <select name="status" value={form.status} onChange={update}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </label>
          <button className="primary" type="submit">
            {isEdit ? "আপডেট" : "সংরক্ষণ"}
          </button>
        </form>
      )}
    </AdminLayout>
  );
}
