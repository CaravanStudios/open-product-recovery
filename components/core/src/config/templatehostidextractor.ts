import {ProviderIntegration} from '../coreapi';
import {JsonMap} from '../util/jsonvalue';
import {StatusError} from '../util/statuserror';
import {HostIdExtractor} from './hostidextractor';

export interface TemplateHostIdExtractorOptionsJson extends JsonMap {
  urlTemplate: string;
}

export class TemplateHostIdExtractor implements HostIdExtractor {
  private urlTemplate: string;
  private idExtractRegexp: RegExp;

  constructor(options: TemplateHostIdExtractorOptionsJson) {
    this.urlTemplate = options.urlTemplate;
    this.idExtractRegexp = new RegExp(
      this.urlTemplate.replace('$', '([a-z0-9_-]+)')
    );
  }

  getHostId(reqUrl: string): string | undefined {
    const result = this.idExtractRegexp.exec(reqUrl);
    if (result && result.length > 0 && result[1]) {
      return result[1];
    }
    return undefined;
  }

  getRootPathFromId(id: string): string {
    return this.urlTemplate.replace('$', id);
  }
}

export const TemplateHostIdExtractorIntegration = {
  async construct(json, context?) {
    return new TemplateHostIdExtractor(
      json as TemplateHostIdExtractorOptionsJson
    );
  },
} as ProviderIntegration<TemplateHostIdExtractor>;
