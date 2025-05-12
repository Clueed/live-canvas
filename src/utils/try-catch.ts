/**
 * Represents the result of an operation that might fail.
 * Contains either the successful data or the error that occurred.
 */
export type Result<T, E = Error> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: E };

/**
 * Type for a function that handles errors.
 * Can be synchronous or asynchronous.
 */
export type ErrorHandler<E = Error> = (error: E) => void | Promise<void>;

/**
 * Default error handler that logs the error to the console.
 * @param error - The error object caught.
 */
const defaultErrorHandler = (error: Error): void => {
  console.error("Error caught by tryCatch:", error);
};

/**
 * Executes a synchronous function within a try-catch block.
 *
 * @template T - The expected return type of the function if successful.
 * @template E - The expected type of the error if the function throws. Defaults to Error.
 * @param {() => T} fn - The synchronous function to execute.
 * @param {ErrorHandler<E>} [errorHandler=defaultErrorHandler] - Optional function to handle errors. Defaults to logging the error.
 * @returns {Result<T, E>} An object indicating success or failure.
 */
export function tryCatchSync<T, E = Error>(
  fn: () => T,
  errorHandler: ErrorHandler<E> = defaultErrorHandler as ErrorHandler<E>,
): Result<T, E> {
  try {
    const data = fn();
    return { success: true, data, error: null };
  } catch (err) {
    const error = err as E; // Consider more robust error type checking if needed
    // We don't await here as the main function is sync
    Promise.resolve(errorHandler(error)).catch(console.error);
    return { success: false, data: null, error };
  }
}

/**
 * Executes an asynchronous function within a try-catch block.
 *
 * @template T - The expected resolution type of the Promise if successful.
 * @template E - The expected type of the error if the function throws or rejects. Defaults to Error.
 * @param {() => Promise<T>} fn - The asynchronous function (returning a Promise) to execute.
 * @param {ErrorHandler<E>} [errorHandler=defaultErrorHandler] - Optional function to handle errors. Defaults to logging the error.
 * @returns {Promise<Result<T, E>>} A Promise resolving to an object indicating success or failure.
 */
export async function tryCatchAsync<T, E = Error>(
  fn: () => Promise<T>,
  errorHandler: ErrorHandler<E> = defaultErrorHandler as ErrorHandler<E>,
): Promise<Result<T, E>> {
  try {
    const data = await fn();
    return { success: true, data, error: null };
  } catch (err) {
    const error = err as E; // Consider more robust error type checking if needed
    try {
      await errorHandler(error);
    } catch (handlerError) {
      console.error("Error in error handler:", handlerError);
    }
    return { success: false, data: null, error };
  }
}
