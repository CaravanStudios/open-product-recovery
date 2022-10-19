import type {Request} from 'express';

export type CustomRequestMethod = 'POST' | 'GET';

/**
 * Interface for custom request handlers for OprServer. This interface requires
 * that the request body is a (possibly empty) JSON object, and that the
 * response is a JSON object. The response object is not directly available. If
 * the handler encounters a problem it must throw a StatusError.
 */
export interface CustomRequestHandler {
  /** The http method for which this handler will be called. */
  readonly method?: Array<CustomRequestMethod> | CustomRequestMethod;

  /** Handles the request and returns a JSON response. */
  handle(body: unknown, request: Request): Promise<unknown>;
}
