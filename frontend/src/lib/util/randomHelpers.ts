import { INTMAX32, squirrel3 } from './random';

export function randomSwitch<T>(args: {
  randInt: number;
  weights: { [k: string]: number };
  behaviors: { [k: string]: (randInt: number) => T };
}): T {
  const { randInt, weights, behaviors } = args;
  const p = randInt / INTMAX32;
  const newRandInt = squirrel3(randInt);
  const weightTotal = Object.values(weights).reduce((pv, cv) => pv + cv);
  let unusedWeight = p * weightTotal;
  for (const [key, weight] of Object.entries(weights)) {
    if (unusedWeight <= weight) {
      // use key
      return behaviors[key](newRandInt);
    } else {
      unusedWeight -= weight;
    }
  }
  throw Error();
}

export function randomValue<T>(args: {
  randInt: number;
  weights: { [k in keyof T]: number };
}): keyof T {
  const { randInt, weights } = args;
  const p = randInt / INTMAX32;
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

export function randomUniform(args: {
  randInt: number;
  min: number;
  max: number;
  increment?: number;
  inclusive?: boolean;
}): number {
  const { randInt, min, max, increment = 1, inclusive = true } = args;
  const p = randInt / INTMAX32;
  let numBuckets = Math.ceil((max - min) / increment);
  if (min + increment * numBuckets === max && inclusive === true) {
    numBuckets += 1;
  }
  const g = Math.floor(p * numBuckets);
  return min + g * increment;
}

export function randomDice(args: {
  randInt: number;
  formula: string;
  plus?: number;
}): number {
  const { randInt, formula, plus = 0 } = args;
  const numDice = parseInt(formula.split('d')[0]);
  const numPips = parseInt(formula.split('d')[1]);
  let val = 0;
  for (let i = 0; i < numDice; i++) {
    val += randomUniform({
      randInt: squirrel3(randInt + i),
      min: 1,
      max: numPips,
      inclusive: true,
    });
  }
  return val + plus;
}
