import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/authService";
import { notifyAuthChange } from "../utils/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await login({ email, password });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("member_id", data.member_id);
      localStorage.setItem("name", data.name);
      localStorage.setItem("role", data.role);
      notifyAuthChange();
      navigate("/dashboard");
    } catch (err) {
      const message =
        err.response?.data?.detail || "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <h1 className="page-heading">Welcome Back</h1>
      <p className="page-subheading">Log in to your Biblioteq account.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p className="form-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
