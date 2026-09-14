import apiClient from "./client";

export function issueBook({ member_id, book_id }) {
  return apiClient.post("/issue", { member_id, book_id }).then((res) => res.data);
}

export function returnBook({ member_id, book_id }) {
  return apiClient.post("/return", { member_id, book_id }).then((res) => res.data);
}

export function getMemberTransactions(memberId) {
  return apiClient.get(`/members/${memberId}/transactions`).then((res) => res.data);
}
