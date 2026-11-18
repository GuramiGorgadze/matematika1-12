export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details) => new HttpError(400, "bad_request", message, details);
export const unauthorized = (message = "Authentication required") => new HttpError(401, "unauthorized", message);
export const forbidden = (message = "Not allowed") => new HttpError(403, "forbidden", message);
export const notFound = (message = "Not found") => new HttpError(404, "not_found", message);
export const conflict = (message, details) => new HttpError(409, "conflict", message, details);
export const unavailable = (message) => new HttpError(503, "unavailable", message);

/** Thrown by data adapters when a unique key is already taken. */
export class DuplicateKeyError extends Error {
  constructor(field) {
    super(`Duplicate value for ${field}`);
    this.field = field;
  }
}
