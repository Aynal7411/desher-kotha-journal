import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getToken, setToken } from "../lib/api";

const getBreadcrumbs = (pathname, categories) => {
  if (pathname === "/") return [];
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "category") {
    const category = categories.find((c) => c.slug === parts[1]);
    const sub = category?.subs?.find((s) => s.slug === parts[2]);
    const crumbs = [{ label: "হোম", to: "/" }];
    if (category) crumbs.push({ label: category.name, to: `/category/${category.slug}` });
    if (sub) crumbs.push({ label: sub.name, to: `/category/${category.slug}/${sub.slug}` });
    return crumbs;
  }
  if (parts[0] === "article") {
    return [{ label: "হোম", to: "/" }, { label: "খবর", to: pathname }];
  }
  return [{ label: "হোম", to: "/" }];
};

export default function Navbar({ categories = [] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setTokenState] = useState(() => getToken());
  const breadcrumbs = useMemo(
    () => getBreadcrumbs(location.pathname, categories),
    [location.pathname, categories]
  );

  useEffect(() => {
    const onStorage = () => setTokenState(getToken());
    const onAuth = () => setTokenState(getToken());
    window.addEventListener("storage", onStorage);
    window.addEventListener("bn_auth", onAuth);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("bn_auth", onAuth);
    };
  }, []);

  const logout = () => {
    setToken(null);
    setTokenState(null);
    navigate("/");
  };

  return (
    <div className="nav-wrapper">
      <nav className="nav nav-sticky">
        <div className="container nav-inner">
          <div className="nav-category-list">
            {categories.map((cat) => (
              <div className="nav-category" key={cat.slug}>
                <Link to={`/category/${cat.slug}`} className="nav-category-link">
                  {cat.name}
                </Link>
              </div>
            ))}
            <div className="nav-category nav-mega">
              <button className="nav-category-link" type="button">
                আরও বিভাগ
              </button>
              <div className="nav-mega-panel">
                {categories.map((cat) => (
                  <div key={cat.slug} className="nav-mega-col">
                    <Link to={`/category/${cat.slug}`} className="nav-mega-title">
                      {cat.name}
                    </Link>
                    <div className="nav-mega-links">
                      {cat.subs?.map((sub) => (
                        <Link key={sub.slug} to={`/category/${cat.slug}/${sub.slug}`}>
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="nav-dropdown">
            <button className="admin-link" type="button">
              লগইন/রেজিস্টার
            </button>
            <div className="nav-menu">
              <span className="nav-menu-label">লগইন</span>
              <Link to="/login">পাঠক লগইন</Link>
              <Link to="/journalist/login">জার্নালিস্ট লগইন</Link>
              <Link to="/admin/login">অ্যাডমিন লগইন</Link>
              <span className="nav-menu-label">রেজিস্টার</span>
              <Link to="/register">পাঠক রেজিস্টার</Link>
              <Link to="/journalist/register">জার্নালিস্ট রেজিস্টার</Link>
              <Link to="/admin/register">অ্যাডমিন রেজিস্টার</Link>
              {token && (
                <>
                  <span className="nav-menu-label">অ্যাকশন</span>
                  <button className="nav-logout" type="button" onClick={logout}>
                    লগআউট
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      {breadcrumbs.length > 0 && (
        <div className="breadcrumb">
          <div className="container">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.to}>
                <Link to={crumb.to}>{crumb.label}</Link>
                {index < breadcrumbs.length - 1 && <span className="breadcrumb-sep">/</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
