/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  Index,
  JoinColumn,
  AfterLoad,
} from 'typeorm';
import {FeedCorpusOffer} from './feedcorpusoffer';

@Entity()
export class FeedCorpus {
  @PrimaryGeneratedColumn()
  id: number;

  // If the sourceFeed is null, it indicates the current server's feed corpus -
  // the entire set of outgoing offers. If the sourceFeed is populated, it
  // indicates the corpus of offers last seen from a particular feed.
  @Column({
    nullable: true,
  })
  @Index()
  sourceFeed: string;

  @Column({type: 'bigint'})
  recordedAtUTC: number;

  @OneToMany(() => FeedCorpusOffer, offer => offer.corpus)
  @JoinColumn()
  offers: FeedCorpusOffer[];

  @Column()
  @Index()
  isLatest: boolean;

  @AfterLoad()
  restoreBigInt() {
    // Bigints are marshalled to strings in some drivers, and are not
    // unmarshalled for fear of precision loss. We can safely unmarshal them,
    // because we know these are timestamps.
    if (typeof this.recordedAtUTC === 'string') {
      this.recordedAtUTC = parseInt(this.recordedAtUTC);
    }
  }
}
