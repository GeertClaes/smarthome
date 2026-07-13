export class AdminAuthError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function assertAdmin() {
  return;
}
