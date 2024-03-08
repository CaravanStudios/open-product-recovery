/**
 * Copyright 2023 The Open Product Recovery Authors
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

/* eslint-disable @typescript-eslint/no-unused-vars */
import {Offer} from 'opr-models';
import {
  Entity,
  Column,
  PrimaryColumn,
  OneToMany,
  JoinColumn,
  Index,
  AfterLoad,
} from 'typeorm';
import {CorpusOffer} from './corpusoffer';

@Entity()
export class OfferSnapshot {
  @PrimaryColumn()
  offerId: string;

  @PrimaryColumn({type: 'bigint'})
  lastUpdateUTC: number;

  @PrimaryColumn()
  postingOrgUrl: string;

  @Column({type: 'bigint'})
  @Index()
  expirationUTC: number;

  @Column({type: 'simple-json'})
  offer: Offer;

  @OneToMany(() => CorpusOffer, corpusOffer => corpusOffer.snapshot)
  @JoinColumn()
  corpusOffers: Array<CorpusOffer>;

  @AfterLoad()
  restoreBigInt() {
    // Bigints are marshalled to strings in some drivers, and are not
    // unmarshalled for fear of precision loss. We can safely unmarshal them,
    // because we know these are timestamps.
    if (typeof this.lastUpdateUTC === 'string') {
      this.lastUpdateUTC = parseInt(this.lastUpdateUTC);
    }

    if (typeof this.expirationUTC === 'string') {
      this.expirationUTC = parseInt(this.expirationUTC);
    }
  }
}
