import type {Request} from 'express';

/**
 * Interface for custom request handlers for OprServer. This interface requires
 * that the request body is a (possibly empty) JSON object, and that the
 * response is a JSON object. The response object is not directly available. If
 * the handler encounters a problem it must throw a StatusError.
 */
export interface CustomRequestHandler {
  handle(body: unknown, request: Request): unknown;
}
