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

import {Clock, DefaultClock, OfferProducer, OfferSetUpdate} from 'opr-core';
import {Offer} from 'opr-models';

interface Drink {
  name: string;
  count: number;
  firstDrink?: number;
  lastDrink?: number;
}

export class FakeOfferProducer implements OfferProducer {
  readonly id: string;
  private drinks: Array<Drink>;
  private fakeOffers: Array<Offer>;
  private clock: Clock;
  private sourceOrgUrl: string;

  constructor(sourceOrgUrl: string, clock = new DefaultClock()) {
    this.id = 'SingingOfferProducer';
    this.drinks = [
      {
        name: 'beer',
        count: 99,
      },
      {
        name: 'kombucha',
        count: 99,
      },
      {
        name: 'Iron Bru',
        count: 99,
      },
    ];
    this.fakeOffers = [];
    this.clock = clock;
    this.sourceOrgUrl = sourceOrgUrl;
  }

  makeFakeOffer(drink: Drink): Offer {
    const creationTimeUTC = drink.firstDrink ?? Date.now();
    const expirationTimeUTC =
      drink.lastDrink || creationTimeUTC + 24 * 60 * 1000;
    const isCreation = drink.firstDrink === undefined;
    drink.firstDrink = creationTimeUTC;
    drink.lastDrink = expirationTimeUTC;
    const offer = {
      id: `${drink.name.split(' ').join('_').toLowerCase()}`,
      description: `${drink.count} bottles of ${drink.name} on the wall`,
      contents: {
        id: 'xyz',
        description: `Wall of ${drink.count} bottles of ${drink.name}`,
        quantity: 1,
        packagingType: 'shippingcontainer',
        contents: [
          {
            description: 'Bottle of beer on the wall',
            expirationTimestampUTC: 1663217495798,
            itemTypeIds: [
              {
                itemId: '022100013926',
                vocabularyId: 'gtin',
              },
            ],
            quantity: drink.count,
          },
        ],
        unitWeight: {
          unit: 'pound',
          value: (drink.count * 40) / 16,
        },
      },
      contactInfo: {
        contactName: 'The Redundant Cowboy Who Is Redundant',
        contactEmail: 'cowboyboots@examplehost.org',
      },
      offerLocation: {
        locationName: "The Ol' Saloon",
        locationAddress: '1 Main Street, Cowpoke Town, Outer Territories',
        accessWindows: [
          {
            startTimeUTC: creationTimeUTC,
            endTimeUTC: expirationTimeUTC,
          },
        ],
      },
      offeredBy: this.sourceOrgUrl,
      offerExpirationUTC: expirationTimeUTC,
      offerCreationUTC: creationTimeUTC,
      offerUpdateUTC: isCreation ? undefined : Date.now(),
    } as Offer;
    drink.count--;
    return offer;
  }

  private updateFakeOffers(): void {
    for (let i = 0; i < this.fakeOffers.length; i++) {
      this.fakeOffers[i] = this.makeFakeOffer(this.drinks[i]);
    }
    if (this.fakeOffers.length < this.drinks.length) {
      this.fakeOffers.push(
        this.makeFakeOffer(this.drinks[this.fakeOffers.length])
      );
    }
  }

  async produceOffers(/* ignoring all params */): Promise<OfferSetUpdate> {
    this.updateFakeOffers();
    const now = this.clock.now();
    return {
      offers: this.fakeOffers,
      updateCurrentAsOfTimestampUTC: now,
      earliestNextRequestUTC: now + 1000 /* one second */,
      sourceOrgUrl: this.sourceOrgUrl,
    };
  }
}
