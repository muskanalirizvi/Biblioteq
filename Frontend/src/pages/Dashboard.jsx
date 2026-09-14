import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMemberTransactions } from "../api/transactionsService";
import TransactionCard from "../components/TransactionCard";
import { logout } from "../utils/auth";

export default function Dashboard() {
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const loadTransactions = useCallback((memberId, { silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);

    return getMemberTransactions(memberId)
      .then(setTransactions)
      .catch((err) => setError(err.response?.data?.detail || err.message))
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const memberId = localStorage.getItem("member_id");

    if (!token || !memberId) {
      navigate("/login");
      return;
    }

    setMember({
      id: memberId,
      name: localStorage.getItem("name"),
      role: localStorage.getItem("role"),
    });

    loadTransactions(memberId);
  }, [navigate, loadTransactions]);

  function handleLogout() {
    logout();
    navigate("/");
  }

  if (!member) return null;

  const issuedTransactions = transactions.filter((t) => t.status === "issued");
  const returnedTransactions = transactions.filter((t) => t.status === "returned");

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1 className="page-heading">Welcome, {member.name || "Member"}</h1>
          <p className="page-subheading">
            {member.role
              ? member.role.charAt(0).toUpperCase() + member.role.slice(1)
              : "Member"}{" "}
            account &middot; Your borrowing history
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={handleLogout}>
          Log out
        </button>
      </div>

      {loading && <p className="state-message">Loading your transactions...</p>}
      {error && <p className="state-message">Failed to load transactions: {error}</p>}

      {!loading && !error && transactions.length === 0 && (
        <p className="state-message">You haven't borrowed any books yet.</p>
      )}

      {!loading && !error && transactions.length > 0 && (
        <>
          <section className="dashboard-section">
            <h2 className="section-heading">Currently Issued</h2>
            {issuedTransactions.length === 0 ? (
              <p className="state-message state-message-compact">
                You have no books issued right now.
              </p>
            ) : (
              <div className="transaction-list">
                {issuedTransactions.map((t) => (
                  <TransactionCard
                    key={t.transaction_id}
                    transaction={t}
                    memberId={member.id}
                    onReturned={() => loadTransactions(member.id, { silent: true })}
                  />
                ))}
              </div>
            )}
          </section>

          {returnedTransactions.length > 0 && (
            <section className="dashboard-section dashboard-section-history">
              <div className="section-heading-row">
                <h2 className="section-heading section-heading-muted">History</h2>
                <button
                  type="button"
                  className="btn-secondary btn-small"
                  onClick={() => setShowHistory((prev) => !prev)}
                >
                  {showHistory ? "Hide History" : "View History"}
                </button>
              </div>

              {showHistory && (
                <div className="transaction-list transaction-list-history">
                  {returnedTransactions.map((t) => (
                    <TransactionCard
                      key={t.transaction_id}
                      transaction={t}
                      memberId={member.id}
                      onReturned={() => loadTransactions(member.id, { silent: true })}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
