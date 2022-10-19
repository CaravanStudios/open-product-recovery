import type {Request} from 'express';
import {
  CustomRequestHandler,
  CustomRequestMethod,
  getBearerToken,
  StatusError,
} from 'opr-core';
import {GoogleAuth, OAuth2Client, TokenPayload} from 'google-auth-library';

/**
 * Wraps a custom endpoint in an IAM credential checker. This can be used to
 * ensure that requests are coming from an authorized IAM user (usually a
 * service account) from Google Cloud.
 */
export class IamCustomEndpointWrapper implements CustomRequestHandler {
  readonly method?: Array<CustomRequestMethod> | CustomRequestMethod;
  private readonly delegate: CustomRequestHandler;
  private readonly acl: IamAccessControlList;

  constructor(delegate: CustomRequestHandler, acl: IamAccessControlList) {
    this.delegate = delegate;
    this.acl = acl;
    this.method = delegate.method;
  }

  async handle(body: unknown, req: Request): Promise<unknown> {
    const token = getBearerToken(req.header('Authorization'));
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken: token,
    });
    const payload = ticket.getPayload();
    console.log('Decoded payload', payload);
    if (
      !payload ||
      !payload.email ||
      !(await this.acl.isAllowed(payload.email, payload))
    ) {
      throw new StatusError('Forbidden', 'ERROR_FORBIDDEN', 403);
    }
    return await this.delegate.handle(body, req);
  }

  static wrap(delegate: CustomRequestHandler, acl: IamAccessControlList) {
    return new IamCustomEndpointWrapper(delegate, acl);
  }
}

export interface IamAccessControlList {
  isAllowed(userId: string, payload: TokenPayload): Promise<boolean>;
}
