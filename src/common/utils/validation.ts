import { ValidationError } from 'yup';

export type ValidationDetail = { field: string; message: string };

export function buildValidationDetails(err: unknown): ValidationDetail[] {
  if (!err) return [];
  if (err instanceof ValidationError) {
    if (err.inner && err.inner.length > 0) {
      return err.inner.map((e) => ({
        field: e.path || 'body',
        message: e.message,
      }));
    }
    return [{ field: err.path || 'body', message: err.message }];
  }
  return [];
}
