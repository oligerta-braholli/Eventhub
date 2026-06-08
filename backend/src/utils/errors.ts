export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resursen') {
    super(`${resource} hittades inte`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Ej behörig') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Åtkomst nekad') {
    super(message, 403);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}
