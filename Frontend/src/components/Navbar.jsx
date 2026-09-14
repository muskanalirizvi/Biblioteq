import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AUTH_EVENT, isLoggedIn, logout } from "../utils/auth";

export default function Navbar() {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [role, setRole] = useState(localStorage.getItem("role"));

  useEffect(() => {
    function syncAuth() {
      setLoggedIn(isLoggedIn());
      setRole(localStorage.getItem("role"));
    }

    window.addEventListener(AUTH_EVENT, syncAuth);
    window.addEventListener("storage", syncAuth);

    return () => {
      window.removeEventListener(AUTH_EVENT, syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">Biblioteq</Link>
      <div className="navbar-links">
        <Link to="/">Home</Link>
        {loggedIn ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            {role === "librarian" && (
              <Link to="/librarian">Librarian Dashboard</Link>
            )}
            <button type="button" className="navbar-logout" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
