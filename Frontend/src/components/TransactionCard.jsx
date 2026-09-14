import { useState } from "react";
import { returnBook } from "../api/transactionsService";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TransactionCard({ transaction, memberId, onReturned }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [returning, setReturning] = useState(false);
  const [returnMessage, setReturnMessage] = useState(null);

  const isReturned = transaction.status === "returned";
  const fine = Number(transaction.fine_amount);

  async function handleReturn() {
    setReturning(true);
    setReturnMessage(null);

    try {
      await returnBook({ member_id: Number(memberId), book_id: transaction.book_id });
      setReturnMessage({ type: "success", text: "Book returned successfully." });
      onReturned?.();
    } catch (err) {
      const text =
        err.response?.data?.detail || "Something went wrong. Please try again.";
      setReturnMessage({ type: "error", text });
    } finally {
      setReturning(false);
    }
  }

  return (
    <div className="transaction-card">
      {transaction.cover_image_url && !imgFailed ? (
        <img
          src={transaction.cover_image_url}
          alt={transaction.book_title}
          className="transaction-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="transaction-cover transaction-cover-placeholder" aria-hidden="true">
          📖
        </div>
      )}

      <div className="transaction-details">
        <h3 className="transaction-title">{transaction.book_title}</h3>
        <div className="transaction-meta">
          <span>Issued: {formatDate(transaction.issue_date)}</span>
          <span>Due: {formatDate(transaction.due_date)}</span>
          {isReturned && <span>Returned: {formatDate(transaction.return_date)}</span>}
        </div>
        <div className="transaction-footer">
          <span className={`transaction-status ${isReturned ? "returned" : "issued"}`}>
            {isReturned ? "Returned" : "Issued"}
          </span>
          {fine > 0 && <span className="transaction-fine">Fine: Rs. {fine}</span>}
          {!isReturned && (
            <button
              type="button"
              className="btn-secondary btn-small"
              onClick={handleReturn}
              disabled={returning}
            >
              {returning ? "Returning..." : "Return this book"}
            </button>
          )}
        </div>
        {returnMessage && (
          <p
            className={
              returnMessage.type === "success"
                ? "form-success transaction-message"
                : "form-error transaction-message"
            }
          >
            {returnMessage.text}
          </p>
        )}
      </div>
    </div>
  );
}
