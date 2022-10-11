/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import {Acceptance} from './acceptance';

@Entity()
export class AcceptanceHistoryViewer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  visibleToOrgUrl: string;

  @ManyToOne(() => Acceptance)
  @JoinColumn()
  acceptance: Acceptance;
}
