export const AUTH_EVENT = "biblioteq-auth-change";

export function isLoggedIn() {
  return Boolean(localStorage.getItem("access_token"));
}

export function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("member_id");
  localStorage.removeItem("name");
  localStorage.removeItem("role");
  notifyAuthChange();
}
