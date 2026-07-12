export class AdminAuthError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function assertAdmin(request) {
  const requiredToken = process.env.ADMIN_TOKEN;
  if (!requiredToken) {
    return;
  }

  const providedToken = request.headers.get("x-admin-token");
  if (providedToken !== requiredToken) {
    throw new AdminAuthError(401, "Admin token required.");
  }
}

export function adminHeaders() {
  if (typeof window === "undefined") {
    return {};
  }

  const token = window.sessionStorage.getItem("adminToken");
  return token ? { "x-admin-token": token } : {};
}
