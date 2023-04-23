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
import {ReshareChain} from 'opr-models';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import {FeedCorpus} from './feedcorpus';
import {OfferSnapshot} from './offersnapshot';

@Entity()
export class FeedCorpusOffer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => FeedCorpus, corpus => corpus.offers)
  corpus: FeedCorpus;

  @Column({type: 'simple-json', nullable: true})
  reshareChain?: ReshareChain;

  @ManyToOne(() => OfferSnapshot, snapshot => snapshot.corpusOffers)
  @JoinColumn()
  snapshot: OfferSnapshot;
}
