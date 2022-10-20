import {RandomSeed, create} from 'random-seed';

function d(seed: RandomSeed): string {
  return seed.range(16).toString(16);
}

const GROUPINGS = [8, 4, 4, 4, 12];

export default function getUuid(seed?: RandomSeed) {
  if (!seed) {
    seed = create();
  }
  const strBuilder = [];
  let first = true;
  for (const groupCount of GROUPINGS) {
    if (first) {
      first = false;
    } else {
      strBuilder.push('-');
    }
    for (let i = 0; i < groupCount; i++) {
      strBuilder.push(seed.range(16).toString(16));
    }
  }
  return strBuilder.join('');
}
