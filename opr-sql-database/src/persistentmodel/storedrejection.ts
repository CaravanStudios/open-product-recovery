/**
 * Copyright 2022 Google LLC
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
import {Entity, Column, PrimaryColumn, Index, AfterLoad} from 'typeorm';

/** A record of an offer rejection. */
@Entity()
export class StoredRejection {
  @PrimaryColumn()
  hostOrgUrl: string;

  @PrimaryColumn()
  rejectingOrgUrl: string;

  @PrimaryColumn()
  offerId: string;

  @PrimaryColumn()
  postingOrgUrl: string;

  @Column({type: 'bigint'})
  rejectedAtUTC: number;

  @AfterLoad()
  restoreBigInt() {
    // Bigints are marshalled to strings in some drivers, and are not
    // unmarshalled for fear of precision loss. We can safely unmarshal them,
    // because we know these are timestamps.
    if (typeof this.rejectedAtUTC === 'string') {
      this.rejectedAtUTC = parseInt(this.rejectedAtUTC);
    }
  }
}
