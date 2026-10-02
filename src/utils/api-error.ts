export class ApiError extends Error {
  public readonly isOperational = true;
  constructor(public readonly message: string, public readonly statusCode: number) {
    super(message);
    this.name = "ApiError";
  }
}
