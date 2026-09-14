import apiClient from "./client";

export function getMembers() {
  return apiClient.get("/members").then((res) => res.data);
}

export function updateMemberStatus(memberId, isActive) {
  return apiClient
    .put(`/members/${memberId}/status`, { is_active: isActive })
    .then((res) => res.data);
}
