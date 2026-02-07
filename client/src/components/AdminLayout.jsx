import { Link, NavLink, useNavigate } from "react-router-dom";
import { setToken } from "../lib/api";

export default function AdminLayout({ children }) {
  const navigate = useNavigate();

  const logout = () => {
    setToken(null);
    navigate("/admin/login");
  };

  return (
    <div className="admin">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-brand">
          দেশের <strong>কথা</strong>
        </Link>
        <nav>
          <NavLink to="/admin">ড্যাশবোর্ড</NavLink>
          <NavLink to="/admin/new">নতুন খবর</NavLink>
        </nav>
        <button className="ghost-button" onClick={logout}>
          লগআউট
        </button>
      </aside>
      <section className="admin-content">{children}</section>
    </div>
  );
}
