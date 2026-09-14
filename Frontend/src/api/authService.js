import apiClient from "./client";

export function register(memberData) {
  return apiClient.post("/register", memberData).then((res) => res.data);
}

export function login(credentials) {
  return apiClient.post("/login", credentials).then((res) => res.data);
}
