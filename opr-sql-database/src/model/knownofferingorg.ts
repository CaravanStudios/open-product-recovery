/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
import {Entity, Column, PrimaryColumn, Index, AfterLoad} from 'typeorm';

@Entity()
/** An organization that has been seen making an offer at some point. */
export class KnownOfferingOrg {
  @PrimaryColumn()
  orgUrl: string;

  @Column()
  @Column({type: 'bigint'})
  lastSeenAtUTC: number;

  @AfterLoad()
  restoreBigInt() {
    // Bigints are marshalled to strings in some drivers, and are not
    // unmarshalled for fear of precision loss. We can safely unmarshal them,
    // because we know these are timestamps.
    if (typeof this.lastSeenAtUTC === 'string') {
      this.lastSeenAtUTC = parseInt(this.lastSeenAtUTC);
    }
  }
}
