import type {Request} from 'express';
import {IamAccessControlList} from './iamaccesscontrollist';
import {getBearerToken, StatusError} from 'opr-core';
import {OAuth2Client} from 'google-auth-library';

export async function checkIamAuth(
  req: Request,
  acl: IamAccessControlList
): Promise<void> {
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
    !(await acl.isAllowed(payload.email, payload))
  ) {
    throw new StatusError('Forbidden', 'ERROR_FORBIDDEN', 403);
  }
}
