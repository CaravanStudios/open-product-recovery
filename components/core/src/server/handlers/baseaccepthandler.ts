/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Verifier} from '../../auth/verifier';
import {StatusError} from '../../util/statuserror';
import {OfferModel} from '../../model/offermodel';
import {JWTPayload} from 'jose';
import {
  AcceptOfferPayload,
  DecodedReshareChain,
  ReshareChain,
} from 'opr-models';
import {AuthenticatedRequestHandler} from './authenticatedrequesthandler';

export abstract class BaseAcceptHandler<
  RequestType,
  ResponseType
> extends AuthenticatedRequestHandler<RequestType, ResponseType> {
  private verifier?: Verifier;
  private myOrgUrl?: string;

  constructor(
    database: OfferModel,
    requestSchemaId: string,
    responseSchemaId: string,
    myOrgUrl?: string,
    verifier?: Verifier
  ) {
    super(database, ['ACCEPTPRODUCT'], requestSchemaId, responseSchemaId);
    this.verifier = verifier;
    this.myOrgUrl = myOrgUrl;
  }

  async decodeReshareChain(
    finalSubject: string,
    initialEntitlement: string,
    initialIssuer?: string,
    chain?: ReshareChain | undefined
  ): Promise<DecodedReshareChain | undefined> {
    if (!chain) {
      return undefined;
    }
    if (!initialIssuer) {
      throw new StatusError(
        'Internal error',
        'INTERNAL_ERROR_RESHARE_CHAIN_NO_ORG_URL_CONFIGURED',
        500
      );
    }
    if (!this.verifier) {
      throw new StatusError(
        'Internal error',
        'INTERNAL_ERROR_RESHARE_CHAIN_NO_VERIFIER_CONFIGURED',
        500
      );
    }
    return await this.verifier.verifyChain(chain, {
      finalSubject: finalSubject,
      initialEntitlements: initialEntitlement,
      initialIssuer: initialIssuer,
      finalScope: 'ACCEPT',
    });
  }

  shouldIgnoreAccessControlList(requestBody: RequestType): boolean {
    return 'reshareChain' in (requestBody as Record<string, unknown>);
  }

  async handle(
    request: RequestType,
    decodedAuthToken: JWTPayload
  ): Promise<ResponseType> {
    const offerId = (request as unknown as AcceptOfferPayload).offerId;
    const reshareChain = (request as unknown as AcceptOfferPayload)
      .reshareChain;
    const decodedReshareChain = await this.decodeReshareChain(
      decodedAuthToken.iss!,
      offerId,
      this.myOrgUrl,
      reshareChain
    );
    return await this.handleWithChain(
      request,
      decodedAuthToken,
      decodedReshareChain
    );
  }

  abstract handleWithChain(
    request: RequestType,
    decodedAuthToken: JWTPayload,
    decodedChain?: DecodedReshareChain
  ): Promise<ResponseType>;
}
