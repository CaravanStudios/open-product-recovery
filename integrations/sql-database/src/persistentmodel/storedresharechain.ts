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
import {DecodedReshareChain, ReshareChain} from 'opr-models';
import {Entity, Column, PrimaryColumn} from 'typeorm';

@Entity()
export class StoredReshareChain {
  @PrimaryColumn()
  hostOrgUrl: string;

  @PrimaryColumn()
  offerId: string;

  @PrimaryColumn()
  postingOrgUrl: string;

  @PrimaryColumn()
  forUse: string;

  @Column({type: 'simple-json', nullable: true})
  reshareChain?: ReshareChain;

  @Column({type: 'simple-json', nullable: true})
  decodedReshareChain?: DecodedReshareChain;

  @Column({type: 'int'})
  length: number;
}
