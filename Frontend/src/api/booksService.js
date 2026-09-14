import apiClient from "./client";

export function getBooks({ title, genre } = {}) {
  const params = {};
  if (title) params.title = title;
  if (genre) params.genre = genre;

  return apiClient.get("/books", { params }).then((res) => res.data);
}

export function getBook(bookId) {
  return apiClient.get(`/books/${bookId}`).then((res) => res.data);
}

export function addBook(data) {
  return apiClient.post("/books", data).then((res) => res.data);
}

export function updateBook(bookId, data) {
  return apiClient.put(`/books/${bookId}`, data).then((res) => res.data);
}

export function deleteBook(bookId) {
  return apiClient.delete(`/books/${bookId}`).then((res) => res.data);
}
