/**
 * Copyright 2023 Google LLC
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

import {PluggableFactory} from '../integrations/pluggablefactory';
import {JsonMap} from '../util/jsonvalue';
import {FeedConfig, FeedConfigProvider} from './feedconfig';

const DEFAULT_MAX_UPDATE_FREQUENCY_MILLIS = 5 * 60 * 1000; /* 5 minutes */
export class StaticFeedConfigProvider implements FeedConfigProvider {
  readonly type = 'feedConfigProvider';

  private feeds: Array<FeedConfig>;
  constructor(
    feeds: Array<string | FeedConfig>,
    defaultMaxUpdateFrequencyMillis = DEFAULT_MAX_UPDATE_FREQUENCY_MILLIS
  ) {
    this.feeds = feeds.map(feed => {
      if (typeof feed === 'string') {
        return {
          organizationUrl: feed,
          maxUpdateFrequencyMillis: defaultMaxUpdateFrequencyMillis,
        };
      } else {
        return feed;
      }
    });
  }

  async getFeeds(): Promise<Array<FeedConfig>> {
    return this.feeds;
  }
}

export interface StaticFeedConfigProviderIntegrationOptions extends JsonMap {
  feeds: Array<FeedConfig | string>;
}

export const StaticFeedConfigProviderIntegration: PluggableFactory<
  StaticFeedConfigProvider,
  StaticFeedConfigProviderIntegrationOptions
> = {
  construct: async (
    json: StaticFeedConfigProviderIntegrationOptions
  ): Promise<StaticFeedConfigProvider> => {
    const feedJsonArray = (json.feeds ?? []) as Array<string | FeedConfig>;
    const feeds: FeedConfig[] = [];
    for (const feedJson of feedJsonArray) {
      if (typeof feedJson === 'string') {
        feeds.push({
          organizationUrl: feedJson,
          maxUpdateFrequencyMillis: DEFAULT_MAX_UPDATE_FREQUENCY_MILLIS,
        });
      } else {
        feeds.push(feedJson);
      }
    }
    return new StaticFeedConfigProvider(feeds);
  },
};
