export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function requireDb<T>(db: T | null): T {
  if (!db) {
    throw new HttpError(503, "Database is not configured");
  }
  return db;
}
