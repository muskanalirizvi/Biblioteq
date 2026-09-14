import { useEffect, useState } from "react";
import { getBooks } from "../api/booksService";
import { getRecommendation } from "../api/recommendService";
import BookCard from "../components/BookCard";

const PRIORITY_BOOK_IDS = [94, 122, 445, 343, 29, 30, 78];

const GENRE_OPTIONS = [
  "fiction",
  "fantasy",
  "mystery",
  "romance",
  "science-fiction",
  "classics",
  "non-fiction",
  "young-adult",
  "historical-fiction",
  "thriller",
  "horror",
  "biography",
];

function formatGenreLabel(genre) {
  return genre
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function withPriorityFirst(books) {
  const byId = new Map(books.map((book) => [book.book_id, book]));
  const priorityIds = new Set(PRIORITY_BOOK_IDS);

  const prioritized = PRIORITY_BOOK_IDS.map((id) => byId.get(id)).filter(Boolean);
  const rest = books.filter((book) => !priorityIds.has(book.book_id));

  return [...prioritized, ...rest];
}

export default function Home() {
  const [titleInput, setTitleInput] = useState("");
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isFiltering = Boolean(title || genre);

  const memberId = localStorage.getItem("member_id");
  const [recommendations, setRecommendations] = useState([]);
  const [recommendLoading, setRecommendLoading] = useState(Boolean(memberId));
  const [recommendFailed, setRecommendFailed] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setTitle(titleInput.trim()), 400);
    return () => clearTimeout(handle);
  }, [titleInput]);

  useEffect(() => {
    if (!memberId) return;

    getRecommendation("", memberId)
      .then((data) => setRecommendations(data))
      .catch(() => setRecommendFailed(true))
      .finally(() => setRecommendLoading(false));
  }, [memberId]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getBooks({ title, genre })
      .then((data) => setBooks(title || genre ? data : withPriorityFirst(data)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [title, genre]);

  function handleClearFilters() {
    setTitleInput("");
    setTitle("");
    setGenre("");
  }

  return (
    <div>
      <h1 className="page-heading">The Collection</h1>
      <p className="page-subheading">Browse what's currently on the shelves.</p>

      {memberId && !recommendFailed && (recommendLoading || recommendations.length > 0) && (
        <div className="recommend-section">
          <h2>Recommended for You</h2>
          {recommendLoading ? (
            <p className="state-message state-message-compact">
              Finding your recommendation...
            </p>
          ) : (
            <div className="book-grid">
              {recommendations.map((book) => (
                <BookCard key={book.book_id} book={book} reason={book.reason} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="search-bar">
        <input
          type="search"
          className="search-input"
          placeholder="Search by title..."
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          aria-label="Search by title"
        />

        <select
          className="genre-select"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          aria-label="Filter by genre"
        >
          <option value="">All genres</option>
          {GENRE_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {formatGenreLabel(g)}
            </option>
          ))}
        </select>

        {isFiltering && (
          <button
            type="button"
            className="btn-secondary btn-small"
            onClick={handleClearFilters}
          >
            Clear filters
          </button>
        )}
      </div>

      {loading && (
        <p className="state-message">
          {isFiltering ? "Searching books..." : "Loading books..."}
        </p>
      )}
      {error && <p className="state-message">Failed to load books: {error}</p>}

      {!loading && !error && books.length === 0 && (
        <p className="state-message">No books found.</p>
      )}

      {!loading && !error && books.length > 0 && (
        <div className="book-grid">
          {books.map((book) => (
            <BookCard key={book.book_id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
