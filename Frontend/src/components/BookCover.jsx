import { useMemo, useState } from "react";

// Try Open Library's higher-res ISBN cover first, then fall back to the
// (lower-res) cover_image_url from our DB, then a placeholder.
export default function BookCover({ book, className = "book-cover" }) {
  const sources = useMemo(() => {
    const list = [];
    if (book.isbn) {
      list.push(`https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`);
    }
    if (book.cover_image_url) {
      list.push(book.cover_image_url);
    }
    return list;
  }, [book.isbn, book.cover_image_url]);

  const [sourceIndex, setSourceIndex] = useState(0);
  const currentSrc = sources[sourceIndex];

  function advanceToNextSource() {
    setSourceIndex((i) => i + 1);
  }

  function handleImageLoad(e) {
    // Open Library returns a tiny 1x1 placeholder gif (HTTP 200, not an
    // error) when it has no cover for a given ISBN — treat that as a miss.
    if (e.target.naturalWidth <= 1) {
      advanceToNextSource();
    }
  }

  if (!currentSrc) {
    return (
      <div className={`${className} book-cover-placeholder`}>
        <span className="book-cover-placeholder-icon" aria-hidden="true">
          📖
        </span>
        <span className="book-cover-placeholder-title">{book.title}</span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={book.title}
      className={className}
      onError={advanceToNextSource}
      onLoad={handleImageLoad}
    />
  );
}
