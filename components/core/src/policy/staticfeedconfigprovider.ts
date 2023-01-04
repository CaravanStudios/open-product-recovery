import {JsonMap} from '../util/jsonvalue';
import {FeedConfig, FeedConfigProvider} from './feedconfig';

const DEFAULT_MAX_UPDATE_FREQUENCY_MILLIS = 5 * 60 * 1000; /* 5 minutes */
export class StaticFeedConfigProvider implements FeedConfigProvider {
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

export const StaticFeedConfigProviderIntegration = {
  construct: async (
    json: StaticFeedConfigProviderIntegrationOptions
  ): Promise<Array<FeedConfig>> => {
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
    return feeds;
  },
};
