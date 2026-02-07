import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";

const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ArticleForm = lazy(() => import("./pages/ArticleForm"));
const ArticleDetails = lazy(() => import("./pages/ArticleDetails"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const JournalistPending = lazy(() => import("./pages/JournalistPending"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="container" style={{ padding: "2rem 0" }}>
            <div className="alert">লোড হচ্ছে...</div>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/category/:category/:sub" element={<CategoryPage />} />
          <Route path="/article/:slug" element={<ArticleDetails />} />
          <Route path="/login" element={<AuthPage initialType="reader" initialMode="login" />} />
          <Route path="/register" element={<AuthPage initialType="reader" initialMode="register" />} />
          <Route path="/journalist/login" element={<AuthPage initialType="journalist" initialMode="login" />} />
          <Route path="/journalist/register" element={<AuthPage initialType="journalist" initialMode="register" />} />
          <Route path="/journalist/pending" element={<JournalistPending />} />
          <Route path="/admin/login" element={<AuthPage initialType="admin" initialMode="login" />} />
          <Route path="/admin/register" element={<AuthPage initialType="admin" initialMode="register" />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/new" element={<ArticleForm />} />
          <Route path="/admin/edit/:id" element={<ArticleForm />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
