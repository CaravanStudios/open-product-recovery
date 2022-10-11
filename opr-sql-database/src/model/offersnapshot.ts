/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
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
import {FeedCorpusOffer} from './feedcorpusoffer';
import {TimelineEntry} from './timelineentry';

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

  @OneToMany(() => FeedCorpusOffer, corpusOffer => corpusOffer.snapshot)
  @JoinColumn()
  corpusOffers: Array<FeedCorpusOffer>;

  @OneToMany(() => TimelineEntry, entry => entry.offer)
  @JoinColumn()
  timelineEntries: Array<TimelineEntry>;

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
