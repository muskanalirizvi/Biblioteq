import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getBook } from "../api/booksService";
import { issueBook } from "../api/transactionsService";
import BookCover from "../components/BookCover";

export default function BookDetail() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [issuing, setIssuing] = useState(false);
  const [issueMessage, setIssueMessage] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setIssueMessage(null);

    getBook(id)
      .then(setBook)
      .catch((err) => setError(err.response?.data?.detail || err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const memberId = localStorage.getItem("member_id");
  const isLoggedIn = Boolean(localStorage.getItem("access_token") && memberId);

  async function handleIssue() {
    setIssuing(true);
    setIssueMessage(null);

    try {
      await issueBook({ member_id: Number(memberId), book_id: Number(id) });
      setIssueMessage({ type: "success", text: "Book issued successfully!" });
      const updated = await getBook(id);
      setBook(updated);
    } catch (err) {
      const text =
        err.response?.data?.detail || "Something went wrong. Please try again.";
      setIssueMessage({ type: "error", text });
    } finally {
      setIssuing(false);
    }
  }

  if (loading) return <p className="state-message">Loading book...</p>;
  if (error) return <p className="state-message">Failed to load book: {error}</p>;
  if (!book) return null;

  const isAvailable = book.available_copies > 0;

  return (
    <div>
      <Link to="/" className="back-link">
        &larr; Back to books
      </Link>

      <div className="book-detail">
        <BookCover book={book} className="book-detail-cover" />

        <div className="book-detail-info">
          <h1 className="page-heading">{book.title}</h1>
          <p className="book-detail-author">{book.author}</p>

          <div className="book-detail-meta">
            {book.genre && <span className="book-genre">{book.genre}</span>}
            {book.published_year && (
              <span className="book-detail-meta-item">
                Published {book.published_year}
              </span>
            )}
            {book.average_rating != null && (
              <span className="book-detail-meta-item">
                &#9733; {Number(book.average_rating).toFixed(2)}
              </span>
            )}
          </div>

          <p className={`book-availability ${isAvailable ? "available" : "unavailable"}`}>
            {isAvailable
              ? `${book.available_copies} / ${book.total_copies} available`
              : "Currently unavailable"}
          </p>

          {issueMessage && (
            <p className={issueMessage.type === "success" ? "form-success" : "form-error"}>
              {issueMessage.text}
            </p>
          )}

          {isLoggedIn ? (
            <button
              type="button"
              className="btn-primary"
              onClick={handleIssue}
              disabled={issuing}
            >
              {issuing ? "Issuing..." : "Issue this book"}
            </button>
          ) : (
            <p className="form-footer">
              <Link to="/login">Login to issue this book</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
