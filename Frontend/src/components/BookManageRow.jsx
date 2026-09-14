import { useState } from "react";
import { deleteBook, updateBook } from "../api/booksService";

function toFormValues(book) {
  return {
    title: book.title || "",
    author: book.author || "",
    isbn: book.isbn || "",
    genre: book.genre || "",
    published_year: book.published_year ?? "",
    cover_image_url: book.cover_image_url || "",
    total_copies: book.total_copies ?? "",
    available_copies: book.available_copies ?? "",
  };
}

export default function BookManageRow({ book, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => toFormValues(book));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEdit() {
    setForm(toFormValues(book));
    setMessage(null);
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
    setMessage(null);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await updateBook(book.book_id, {
        ...form,
        published_year: form.published_year ? Number(form.published_year) : null,
        total_copies: Number(form.total_copies),
        available_copies: Number(form.available_copies),
      });
      setEditing(false);
      setMessage({ type: "success", text: "Book updated successfully." });
      onUpdated?.();
    } catch (err) {
      const text =
        err.response?.data?.detail || "Something went wrong. Please try again.";
      setMessage({ type: "error", text });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${book.title}"? This cannot be undone.`)) return;

    setDeleting(true);
    setMessage(null);

    try {
      await deleteBook(book.book_id);
      onDeleted?.();
    } catch (err) {
      const text =
        err.response?.data?.detail || "Something went wrong. Please try again.";
      setMessage({ type: "error", text });
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <form className="manage-row manage-row-editing" onSubmit={handleSave}>
        <div className="manage-edit-grid">
          <div className="form-group">
            <label htmlFor={`title-${book.book_id}`}>Title</label>
            <input
              id={`title-${book.book_id}`}
              name="title"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor={`author-${book.book_id}`}>Author</label>
            <input
              id={`author-${book.book_id}`}
              name="author"
              value={form.author}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor={`isbn-${book.book_id}`}>ISBN</label>
            <input
              id={`isbn-${book.book_id}`}
              name="isbn"
              value={form.isbn}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor={`genre-${book.book_id}`}>Genre</label>
            <input
              id={`genre-${book.book_id}`}
              name="genre"
              value={form.genre}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor={`year-${book.book_id}`}>Published Year</label>
            <input
              id={`year-${book.book_id}`}
              name="published_year"
              type="number"
              value={form.published_year}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor={`copies-${book.book_id}`}>Total Copies</label>
            <input
              id={`copies-${book.book_id}`}
              name="total_copies"
              type="number"
              min="0"
              value={form.total_copies}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor={`available-${book.book_id}`}>Available Copies</label>
            <input
              id={`available-${book.book_id}`}
              name="available_copies"
              type="number"
              min="0"
              value={form.available_copies}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group manage-edit-grid-wide">
            <label htmlFor={`cover-${book.book_id}`}>Cover Image URL</label>
            <input
              id={`cover-${book.book_id}`}
              name="cover_image_url"
              value={form.cover_image_url}
              onChange={handleChange}
            />
          </div>
        </div>

        {message && (
          <p className={message.type === "success" ? "form-success" : "form-error"}>
            {message.text}
          </p>
        )}

        <div className="manage-row-actions">
          <button type="submit" className="btn-primary btn-small" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            className="btn-secondary btn-small"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="manage-row">
      <div className="manage-row-info">
        <p className="manage-row-title">{book.title}</p>
        <p className="manage-row-author">{book.author}</p>
        {message && (
          <p
            className={
              message.type === "success"
                ? "form-success manage-row-message"
                : "form-error manage-row-message"
            }
          >
            {message.text}
          </p>
        )}
      </div>
      <div className="manage-row-actions">
        <button type="button" className="btn-secondary btn-small" onClick={handleEdit}>
          Edit
        </button>
        <button
          type="button"
          className="btn-danger btn-small"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
