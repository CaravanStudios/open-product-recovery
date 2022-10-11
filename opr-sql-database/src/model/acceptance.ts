/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
import {DecodedReshareChain} from 'opr-models';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  Index,
  JoinColumn,
  AfterLoad,
} from 'typeorm';
import {OfferSnapshot} from './offersnapshot';

@Entity()
export class Acceptance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  acceptedBy: string;

  @Column({type: 'bigint'})
  @Index()
  acceptedAtUTC: number;

  @Column({type: 'simple-json', nullable: true})
  decodedReshareChain?: DecodedReshareChain;

  @OneToOne(() => OfferSnapshot)
  @JoinColumn()
  snapshot: OfferSnapshot;

  @AfterLoad()
  restoreBigInt() {
    // Bigints are marshalled to strings in some drivers, and are not
    // unmarshalled for fear of precision loss. We can safely unmarshal them,
    // because we know these are timestamps.
    if (typeof this.acceptedAtUTC === 'string') {
      this.acceptedAtUTC = parseInt(this.acceptedAtUTC);
    }
  }
}
