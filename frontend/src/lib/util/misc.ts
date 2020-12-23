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
export type UpdaterFn<T> = (arg: UpdaterFnParam<T>) => void;

export type UpdaterGeneratorType<T> = {
  [k in keyof T]: T[k] extends { [kkt: string]: any }
  ? (UpdaterGeneratorType<T[k]> & {
    getUpdater: () => UpdaterFn<T[k]>,
    set: UpdaterFn<T[k]>,
    update: UpdaterFn<T[k]>,
  })
  : {
    getUpdater: () => UpdaterFn<T[k]>,
    set: UpdaterFn<T[k]>,
    update: UpdaterFn<T[k]>,
  }
} & {
  getUpdater: () => UpdaterFn<T>,
  set: UpdaterFn<T>,
  update: UpdaterFn<T>,
}

/**
 * Convenience method for generating setState<FancyObject.sub.component>() from setState<FancyObject> callbacks.
 * If used in react, recommended that this be memoized.
 * 
 * @generic T should be a data-only object - nested objects are allowed but arrays, sets not supported
 * @param dataObject ANY instance of T, used only for its keys. MUST have all keys present
 * @param dataUpdater an updater function, which can be called as: dataUpdater(newT) or
 *   dataUpdater((oldT) => { return newTFromOldT(oldT) }) ; e.g. react setState() function.
 * @return a deep object that has the same keys as T, except each key also has a getUpdater()/set/update member;
 *   the getUpdater() on a subobject of T acts similarly to the dataUpdater<T> but to the subobject rather than the whole object.
 * e.g. :
 *   let gameStateUpdater = updaterGenerator(skeletonObject, setGameState);
 *   let setName = gameStateUpdater.player.name.getUpdater();
 *   gameStateUpdater.player.name.set(newName);
 *   gameStateUpdater.player.name.update(oldName => oldName + " ");
 * 
 */
export function updaterGenerator<T>(dataObject: T, dataUpdater: UpdaterFn<T>): UpdaterGeneratorType<T> {
  const updaters: UpdaterGeneratorType<T> = {} as any;
  updaters.getUpdater = () => dataUpdater;
  updaters.set = dataUpdater;
  updaters.update = dataUpdater;
  if (typeof dataObject !== "object") return updaters;
  const keys : (keyof T)[] = Object.keys(dataObject) as any as (keyof T)[];
  keys.forEach((key: (keyof T)) => {
    function keyUpdater(newValueOrCallback: UpdaterFnParam<T[typeof key]>) {
      if (typeof newValueOrCallback === "function") {
        dataUpdater((oldData) => {
          const newData = {
            ...oldData,
            [key]: (newValueOrCallback as Function)(oldData[key]),
          };
          return newData;
        });
      } else {
        dataUpdater((oldData) => ({ ...oldData, [key]: newValueOrCallback }));
      }
    }
    updaters[key] = updaterGenerator(dataObject[key], keyUpdater) as any;
  });
  return updaters;
}

export type DeepReadonly<T> = T extends Function ? T : {
  readonly [P in keyof T]: T[P] extends { [k: string]: any } ? DeepReadonly<T[P]> : T[P];
}


const assertOnlyCalledOnceData: { [k: string]: string } = {};

export function assertOnlyCalledOnce(id: string | number) {
  let k = id.toString();
  if (assertOnlyCalledOnceData[k] !== undefined) {
    throw new Error("Error, called twice with same id: " + k + " , callback the first time was : " + assertOnlyCalledOnceData[k]);
  } else {
    const stacktrace = new Error().stack!
    assertOnlyCalledOnceData[k] = stacktrace;
  }
}

export class Lazy<T> {
  private _wasConstructed: boolean = false;
  private _value: T | undefined = undefined;
  private _factory: () => T

  constructor(factory: () => T) {
    this._factory = factory;
  }

  public get(): T {
    // T might have undefined as a valid value
    if (this._value !== undefined || this._wasConstructed === true) {
      return this._value!;
    } else {
      this._value = this._factory();
      this._wasConstructed = true;
      return this._value;
    }
  }
}