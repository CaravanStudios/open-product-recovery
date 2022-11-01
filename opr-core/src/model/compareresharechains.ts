import {DecodedReshareChain} from 'opr-models';

export function compareReshareChainsForAccept(
  a?: DecodedReshareChain,
  b?: DecodedReshareChain
): number {
  const aIsAccept = a === undefined || a[a.length - 1].scopes.indexOf('ACCEPT') >= 0;
  const bIsAccept = b === undefined || b[b.length - 1].scopes.indexOf('ACCEPT') >= 0;
  const aLength = a === undefined ? 0 : a.length;
  const bLength = b === undefined ? 0 : b.length;
  if (aIsAccept && bIsAccept) {
    return aLength - bLength;
  }
  if (aIsAccept) {
    return -1;
  }
  return 1;
}

export function compareReshareChainsForReshare(
  a?: DecodedReshareChain,
  b?: DecodedReshareChain
): number {
  const aIsReshare =
    a !== undefined && a[a.length - 1].scopes.indexOf('RESHARE') >= 0;
  const bIsReshare =
    b !== undefined && b[b.length - 1].scopes.indexOf('RESHARE') >= 0;
  if (aIsReshare && bIsReshare) {
    return a.length - b.length;
  }
  if (aIsReshare) {
    return -1;
  }
  return 1;
}
