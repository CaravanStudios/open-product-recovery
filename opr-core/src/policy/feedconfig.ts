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

export interface FeedConfig {
  readonly organizationUrl: string;
  readonly maxUpdateFrequencyMillis: number;
}

export interface FeedConfigProvider {
  getFeeds(): Promise<Array<FeedConfig>>;
}

export class StaticFeedConfigProvider implements FeedConfigProvider {
  private feeds: Array<FeedConfig>;
  constructor(
    feeds: Array<string | FeedConfig>,
    defaultMaxUpdateFrequencyMillis = 10 * 60 * 1000 /* 10 minutes */
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
