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
  Index,
  AfterLoad,
} from 'typeorm';
import {OfferSnapshot} from './offersnapshot';

@Entity()
export class TimelineEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  targetOrganizationUrl: string;

  @Column({default: false})
  @Index()
  isReservation: boolean;

  @Column({default: false})
  @Index()
  isRejection: boolean;

  @Column({type: 'bigint'})
  @Index()
  startTimeUTC: number;

  @Column({type: 'bigint'})
  @Index()
  endTimeUTC: number;

  @Column({type: 'simple-json', nullable: true})
  reshareChain?: ReshareChain;

  @ManyToOne(() => OfferSnapshot)
  @JoinColumn()
  offer: OfferSnapshot;

  @AfterLoad()
  restoreBigInt() {
    // Bigints are marshalled to strings in some drivers, and are not
    // unmarshalled for fear of precision loss. We can safely unmarshal them,
    // because we know these are timestamps.
    if (typeof this.startTimeUTC === 'string') {
      this.startTimeUTC = parseInt(this.startTimeUTC);
    }

    if (typeof this.endTimeUTC === 'string') {
      this.endTimeUTC = parseInt(this.endTimeUTC);
    }
  }
}
