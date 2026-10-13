export type ErrorDetail = { field?: string; issue: string };

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: ErrorDetail[];

  constructor(statusCode: number, code: string, message: string, details?: ErrorDetail[]) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}