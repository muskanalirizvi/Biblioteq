import { Link } from "react-router-dom";
import BookCover from "./BookCover";

export default function BookCard({ book, reason }) {
  const isAvailable = book.available_copies > 0;

  return (
    <Link to={`/books/${book.book_id}`} className="book-card">
      <BookCover book={book} />
      <h3 className="book-title">{book.title}</h3>
      <p className="book-author">{book.author}</p>
      {book.genre && <span className="book-genre">{book.genre}</span>}
      <p className={`book-availability ${isAvailable ? "available" : "unavailable"}`}>
        {isAvailable
          ? `${book.available_copies} / ${book.total_copies} available`
          : "Currently unavailable"}
      </p>
      {reason && <p className="book-recommend-reason">Why we picked this: {reason}</p>}
    </Link>
  );
}
