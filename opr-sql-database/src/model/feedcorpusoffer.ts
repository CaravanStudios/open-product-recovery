/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
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
