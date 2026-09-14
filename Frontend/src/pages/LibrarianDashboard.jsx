import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addBook, getBooks } from "../api/booksService";
import { getMembers } from "../api/membersService";
import BookManageRow from "../components/BookManageRow";
import MemberManageRow from "../components/MemberManageRow";

const emptyBookForm = {
  title: "",
  author: "",
  isbn: "",
  genre: "",
  published_year: "",
  cover_image_url: "",
  total_copies: "",
};

export default function LibrarianDashboard() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);

  const [bookForm, setBookForm] = useState(emptyBookForm);
  const [addLoading, setAddLoading] = useState(false);
  const [addMessage, setAddMessage] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [books, setBooks] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState(null);

  const selfMemberId = Number(localStorage.getItem("member_id"));

  useEffect(() => {
    const role = localStorage.getItem("role");

    if (role !== "librarian") {
      navigate("/");
      return;
    }

    setAuthorized(true);
  }, [navigate]);

  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const loadBooks = useCallback((title) => {
    setListLoading(true);
    setListError(null);

    return getBooks({ title })
      .then(setBooks)
      .catch((err) => setListError(err.response?.data?.detail || err.message))
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => {
    if (!authorized) return;
    loadBooks(search);
  }, [authorized, search, loadBooks]);

  const loadMembers = useCallback(() => {
    setMembersLoading(true);
    setMembersError(null);

    return getMembers()
      .then(setMembers)
      .catch((err) => setMembersError(err.response?.data?.detail || err.message))
      .finally(() => setMembersLoading(false));
  }, []);

  useEffect(() => {
    if (!authorized) return;
    loadMembers();
  }, [authorized, loadMembers]);

  function handleBookFormChange(e) {
    const { name, value } = e.target;
    setBookForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAddBook(e) {
    e.preventDefault();
    setAddLoading(true);
    setAddMessage(null);

    try {
      await addBook({
        ...bookForm,
        published_year: bookForm.published_year ? Number(bookForm.published_year) : null,
        total_copies: Number(bookForm.total_copies),
      });
      setAddMessage({ type: "success", text: "Book added successfully." });
      setBookForm(emptyBookForm);
      loadBooks(search);
    } catch (err) {
      const text =
        err.response?.data?.detail || "Something went wrong. Please try again.";
      setAddMessage({ type: "error", text });
    } finally {
      setAddLoading(false);
    }
  }

  if (!authorized) return null;

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1 className="page-heading">Librarian Dashboard</h1>
          <p className="page-subheading">Manage books and members</p>
        </div>
      </div>

      <section className="dashboard-section">
        <h2 className="section-heading">Manage Books</h2>

        <form className="book-form" onSubmit={handleAddBook}>
          <div className="book-form-grid">
            <div className="form-group">
              <label htmlFor="add-title">Title</label>
              <input
                id="add-title"
                name="title"
                value={bookForm.title}
                onChange={handleBookFormChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="add-author">Author</label>
              <input
                id="add-author"
                name="author"
                value={bookForm.author}
                onChange={handleBookFormChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="add-isbn">ISBN</label>
              <input
                id="add-isbn"
                name="isbn"
                value={bookForm.isbn}
                onChange={handleBookFormChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="add-genre">Genre</label>
              <input
                id="add-genre"
                name="genre"
                value={bookForm.genre}
                onChange={handleBookFormChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="add-year">Published Year</label>
              <input
                id="add-year"
                name="published_year"
                type="number"
                value={bookForm.published_year}
                onChange={handleBookFormChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="add-copies">Total Copies</label>
              <input
                id="add-copies"
                name="total_copies"
                type="number"
                min="0"
                value={bookForm.total_copies}
                onChange={handleBookFormChange}
                required
              />
            </div>
            <div className="form-group book-form-grid-wide">
              <label htmlFor="add-cover">Cover Image URL</label>
              <input
                id="add-cover"
                name="cover_image_url"
                value={bookForm.cover_image_url}
                onChange={handleBookFormChange}
              />
            </div>
          </div>

          {addMessage && (
            <p className={addMessage.type === "success" ? "form-success" : "form-error"}>
              {addMessage.text}
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={addLoading}>
            {addLoading ? "Adding..." : "Add Book"}
          </button>
        </form>

        <div className="search-bar">
          <input
            type="search"
            className="search-input"
            placeholder="Search by title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search books"
          />
        </div>

        {listLoading && <p className="state-message state-message-compact">Loading books...</p>}
        {listError && (
          <p className="state-message state-message-compact">
            Failed to load books: {listError}
          </p>
        )}
        {!listLoading && !listError && books.length === 0 && (
          <p className="state-message state-message-compact">No books found.</p>
        )}

        {!listLoading && !listError && books.length > 0 && (
          <div className="manage-list">
            {books.map((book) => (
              <BookManageRow
                key={book.book_id}
                book={book}
                onUpdated={() => loadBooks(search)}
                onDeleted={() => loadBooks(search)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <h2 className="section-heading">Manage Members</h2>

        {membersLoading && (
          <p className="state-message state-message-compact">Loading members...</p>
        )}
        {membersError && (
          <p className="state-message state-message-compact">
            Failed to load members: {membersError}
          </p>
        )}
        {!membersLoading && !membersError && members.length === 0 && (
          <p className="state-message state-message-compact">No members found.</p>
        )}

        {!membersLoading && !membersError && members.length > 0 && (
          <div className="manage-list">
            {members.map((member) => (
              <MemberManageRow
                key={member.member_id}
                member={member}
                isSelf={member.member_id === selfMemberId}
                onUpdated={loadMembers}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
