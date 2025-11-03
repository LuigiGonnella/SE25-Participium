import { AppError } from "@errors/AppError";

export class InternalServerError extends AppError {

  constructor(message: string) {
    super(message, 500);
    this.name = "InternalServerError"
    }
}