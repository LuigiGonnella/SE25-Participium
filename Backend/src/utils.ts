import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";

export function findOrThrowNotFound<T>(
  array: T[],
  predicate: (item: T) => boolean,
  errorMessage: string
): T {
  const item = array.find(predicate);
  if (!item) {
    throw new NotFoundError(errorMessage);
  }
  return item;
}

export function throwConflictIfFound<T>(
  array: T[],
  predicate: (item: T) => boolean,
  errorMessage: string
): void {
  if (array.find(predicate)) {
    throw new ConflictError(errorMessage);
  }
}