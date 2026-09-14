import apiClient from "./client";

export function getRecommendation(query, member_id) {
  const payload = { query };
  if (member_id) {
    payload.member_id = member_id;
  }
  return apiClient
    .post("/recommend", payload)
    .then((res) => res.data.recommendations ?? []);
}
