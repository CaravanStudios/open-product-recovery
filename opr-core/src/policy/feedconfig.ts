/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
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
