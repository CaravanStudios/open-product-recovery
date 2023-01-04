export interface HostIdExtractor {
  getHostId(reqUrl: string): string | undefined;
  getRootPathFromId(id: string): string;
}
