import { INTMAX32, squirrel3 } from './random';

/**
 *
 * @param randInt integer generated from random distribution. higher means the lower weights will be picked.
 * @param weights associative array of keys to weights. each key has a probability of being selected proportional to its weight.
 * @param behaviors mapping of keys to callbacks. which callback is called depends on which key was selected. the callback is called with a single argument, which will be the hash of the [randInt] provided to randomSwitch.
 * @returns a value obtained from calling one of the behaviors.
 */
export function randomSwitch<T>(args: {
  seed: number;
  weights: { [k: string]: number };
  behaviors: { [k: string]: (seed: number) => T };
}): T {
  const { seed, weights, behaviors } = args;
  const p = squirrel3(seed) / INTMAX32;
  const newSeed = squirrel3(seed); /* TODO */
  const weightTotal = Object.values(weights).reduce((pv, cv) => pv + cv);
  let unusedWeight = p * weightTotal;
  for (const [key, weight] of Object.entries(weights)) {
    if (unusedWeight <= weight) {
      // use key
      return behaviors[key](newSeed);
    } else {
      unusedWeight -= weight;
    }
  }
  throw Error();
}

/**
 *
 * @param randInt integer generated from random distribution. higher means the lower weights will be picked.
 * @param weights map of keys to weights; each key has a probability of being selected proportional to its weight.
 * @returns the selected key
 */
export function randomValue<T>(args: {
  seed: number;
  weights: { [k in keyof T]: number };
}): keyof T {
  const { seed, weights } = args;
  const p = squirrel3(seed) / INTMAX32;
  const weightTotal = (Object.values(weights) as number[]).reduce(
    (pv, cv) => pv + cv
  );
  let unusedWeight = p * weightTotal;
  for (const [key, weight] of Object.entries(weights) as [keyof T, number][]) {
    if (unusedWeight <= weight) {
      // use key
      return key;
    } else {
      unusedWeight -= weight;
    }
  }
  throw Error();
}

/**
 *
 * @param
 * @returns random number between min and max
 */
export function randomUniform(args: {
  seed: number;
  min: number;
  max: number;
  increment?: number;
  inclusive?: boolean;
}): number {
  const { seed, min, max, increment = 1, inclusive = true } = args;
  const p = squirrel3(seed) / INTMAX32;
  let numBuckets = Math.ceil((max - min) / increment);
  if (min + increment * numBuckets === max && inclusive === true) {
    numBuckets += 1;
  }
  const g = Math.floor(p * numBuckets);
  return min + g * increment;
}

export function randomDice(args: {
  seed: number;
  formula: string;
  plus?: number;
}): number {
  const { seed, formula, plus = 0 } = args;
  const numDice = parseInt(formula.split('d')[0]);
  const numPips = parseInt(formula.split('d')[1]);
  let val = 0;
  for (let i = 0; i < numDice; i++) {
    val += randomUniform({
      seed: seed + i,
      min: 1,
      max: numPips,
      inclusive: true,
    });
  }
  return val + plus;
}
