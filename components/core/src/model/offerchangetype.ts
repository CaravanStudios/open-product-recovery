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

type OfferChangeType =
  | 'ADD'
  | 'DELETE'
  | 'UPDATE'
  // Indicates that an offer from this host was accepted.
  | 'ACCEPT'
  // Indicates that an offer was accepted BY this host via an OprClient
  | 'REMOTE_ACCEPT'
  // Indicates that an offer was rejected BY this host via an OprClient
  | 'REMOTE_REJECT'
  // Indicates that an offer was reserved BY this host via an OprClient
  | 'REMOTE_RESERVE';

export {OfferChangeType};
