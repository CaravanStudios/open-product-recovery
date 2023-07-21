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
