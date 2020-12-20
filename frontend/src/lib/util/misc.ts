let lastUsedId = 0;

export const getUniqueID = () => {
  return lastUsedId++;
};

export class Util {
  static MinBy<T>(list: T[], fn: (T: T) => number): T | null {
    let lowestT: T | null = null;
    let lowestValue: number | null = null;

    for (const item of list) {
      const value = fn(item);

      if (lowestValue === null || value < lowestValue) {
        lowestT = item;
        lowestValue = value;
      }
    }

    return lowestT;
  }

  static MinByAndValue<T>(list: T[], fn: (T: T) => number): { obj: T, value: number } | null {
    let lowestT: T | null = null;
    let lowestValue: number | null = null;

    for (const item of list) {
      const value = fn(item);

      if (lowestValue === null || value < lowestValue) {
        lowestT = item;
        lowestValue = value;
      }
    }

    return lowestT === null || lowestValue === null ? null : { obj: lowestT, value: lowestValue };
  }

  static MaxBy<T>(list: T[], fn: (T: T) => number): T | null {
    let highestT: T | null = null;
    let highestValue: number | null = null;

    for (const item of list) {
      const value = fn(item);

      if (highestValue === null || value > highestValue) {
        highestT = item;
        highestValue = value;
      }
    }

    return highestT;
  }

  static RandRange(low: number, high: number): number {
    return Math.floor(Math.random() * (high - low) + low);
  }

  public static SortByKey<T>(array: T[], key: (x: T) => number): T[] {
    return array.sort((a, b) => {
      return key(a) - key(b)
    });
  }

  public static ReplaceAll(
    str: string,
    mapObj: { [key: string]: string }
  ): string {
    const re = new RegExp(Object.keys(mapObj).join('|'), 'gi')

    return str.replace(re, matched => {
      return mapObj[matched.toLowerCase()]
    });
  }

  public static Debounce<F extends (...args: any[]) => void>(
    func: F,
    waitMilliseconds = 50,
    options = {
      isImmediate: false,
    }
  ): F {
    let timeoutId: any; // types are different on node vs client, so we have to use any.

    const result = (...args: any[]) => {
      const doLater = () => {
        timeoutId = undefined;
        if (!options.isImmediate) {
          func.apply(this, args);
        }
      }

      const shouldCallNow = options.isImmediate && timeoutId === undefined;

      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(doLater, waitMilliseconds);

      if (shouldCallNow) {
        func.apply(this, args);
      }
    }

    return result as any;
  }

  public static FormatDate(d: Date): string {
    const monthName = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ][d.getMonth()]

    return `${monthName} ${d.getDate()}, ${('00' + d.getHours()).substr(-2)}:${(
      '00' + d.getMinutes()
    ).substr(-2)}:${('00' + d.getSeconds()).substr(-2)}`;
  }

  public static FlattenByOne<T>(arr: T[][]): T[] {
    let result: T[] = []

    for (const obj of arr) {
      result = result.concat(obj)
    }

    return result
  }

  public static PadString(string: string, length: number, intersperse = "", character = " ") {
    return string + intersperse + character.repeat(length - string.length);
  }
}

type UpdaterFnParam<T> = T | ((prev: T) => T);
type UpdaterFn<T> = (arg: UpdaterFnParam<T>) => void;

type UpdaterGeneratorType<T> = {
  [k in keyof T]: T[k] extends { [kkt: string]: any }
  ? (UpdaterGeneratorType<T[k]> & { getUpdater: () => UpdaterFn<T[k]> })
  : { getUpdater: () => UpdaterFn<T[k]> }
} & { getUpdater: () => UpdaterFn<T> }

export function updaterGenerator<T>(dataObject: T, dataUpdater: UpdaterFn<T>): UpdaterGeneratorType<T> {
  const updaters: UpdaterGeneratorType<T> = {} as any;
  updaters.getUpdater = () => dataUpdater;
  if (typeof dataObject !== "object") return updaters;
  const keys : (keyof T)[] = Object.keys(dataObject) as any as (keyof T)[];
  keys.forEach((key: (keyof T)) => {
    const asdfaf: T[typeof key] = dataObject[key];
    // function keyUpdater(newValueOrCallback: (T[typeof key] | ((prev: T[typeof key]) => T[typeof key]) )) {
    function keyUpdater(newValueOrCallback: UpdaterFnParam<T[typeof key]>) {
      // console.log(newValueOrCallback);
      if (typeof newValueOrCallback === "function") {
      // if (newValueOrCallback is "function") {
        dataUpdater((oldData) => {
          const newData = {
            ...oldData,
            [key]: (newValueOrCallback as Function)(oldData[key]),
          };
          // console.log({ newData });
          return newData;
        });
      } else {
        dataUpdater((oldData) => ({ ...oldData, [key]: newValueOrCallback }));
      }
    }
    updaters[key] = updaterGenerator(dataObject[key], keyUpdater) as any;
    // updaters[key].getUpdater = () => keyUpdater;
  });
  return updaters;
}

