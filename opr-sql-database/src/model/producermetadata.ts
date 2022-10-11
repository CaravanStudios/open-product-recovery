/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
import {DecodedReshareChain} from 'opr-models';
import {
  Entity,
  Column,
  OneToOne,
  Index,
  JoinColumn,
  PrimaryColumn,
  AfterLoad,
} from 'typeorm';
import {OfferSnapshot} from './offersnapshot';

@Entity()
export class ProducerMetadata {
  @PrimaryColumn()
  producerId: string;

  @Column({type: 'bigint'})
  nextRunTimestampUTC: number;

  @Column({type: 'bigint', nullable: true})
  lastUpdateTimeUTC?: number;

  @Column()
  locked: boolean;

  @AfterLoad()
  restoreBigInt() {
    // Bigints are marshalled to strings in some drivers, and are not
    // unmarshalled for fear of precision loss. We can safely unmarshal them,
    // because we know these are timestamps.
    if (typeof this.nextRunTimestampUTC === 'string') {
      this.nextRunTimestampUTC = parseInt(this.nextRunTimestampUTC);
    }

    if (typeof this.lastUpdateTimeUTC === 'string') {
      this.lastUpdateTimeUTC = parseInt(this.lastUpdateTimeUTC);
    }
  }
}
