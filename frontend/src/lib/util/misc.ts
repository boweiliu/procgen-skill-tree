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

  static MinByAndValue<T>(
    list: T[],
    fn: (T: T) => number
  ): { obj: T; value: number } | null {
    let lowestT: T | null = null;
    let lowestValue: number | null = null;

    for (const item of list) {
      const value = fn(item);

      if (lowestValue === null || value < lowestValue) {
        lowestT = item;
        lowestValue = value;
      }
    }

    return lowestT === null || lowestValue === null
      ? null
      : { obj: lowestT, value: lowestValue };
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
      return key(a) - key(b);
    });
  }

  public static ReplaceAll(
    str: string,
    mapObj: { [key: string]: string }
  ): string {
    const re = new RegExp(Object.keys(mapObj).join("|"), "gi");

    return str.replace(re, (matched) => {
      return mapObj[matched.toLowerCase()];
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
      };

      const shouldCallNow = options.isImmediate && timeoutId === undefined;

      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(doLater, waitMilliseconds);

      if (shouldCallNow) {
        func.apply(this, args);
      }
    };

    return result as any;
  }

  public static FormatDate(d: Date): string {
    const monthName = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ][d.getMonth()];

    return `${monthName} ${d.getDate()}, ${("00" + d.getHours()).substr(-2)}:${(
      "00" + d.getMinutes()
    ).substr(-2)}:${("00" + d.getSeconds()).substr(-2)}`;
  }

  public static FlattenByOne<T>(arr: T[][]): T[] {
    let result: T[] = [];

    for (const obj of arr) {
      result = result.concat(obj);
    }

    return result;
  }

  public static PadString(
    string: string,
    length: number,
    intersperse = "",
    character = " "
  ) {
    return string + intersperse + character.repeat(length - string.length);
  }
}

/**
 * A deep readonly type - given an object type, all subobjects and their subobjects are also marked as readonly.
 */
export type Const<T> = T extends Function
  ? T
  : {
      readonly [P in keyof T]: T[P] extends { [k: string]: any }
        ? Const<T[P]>
        : T[P];
    };

const assertOnlyCalledOnceData: { [k: string]: [string, number] } = {};

/**
 * Asserts that a function is not called more than twice. Useful for debugging react lifecycle which may be creating more objects than you realize, impacting performance.
 * @param id identifier
 */
export function assertOnlyCalledOnce(id: string | number) {
  let k = id.toString();
  if (assertOnlyCalledOnceData[k] !== undefined) {
    if (assertOnlyCalledOnceData[k][1] === 1) {
      assertOnlyCalledOnceData[k][1] = 2;
    } else {
      throw new Error(
        "Error, called more than twice with same id: " +
          k +
          " , callback the first time was : " +
          assertOnlyCalledOnceData[k]
      );
    }
  } else {
    const stacktrace = new Error().stack!;
    assertOnlyCalledOnceData[k] = [stacktrace, 1];
  }
}

/**
 * Class representing a value which is only computed when used.
 *
 * Usage: const lazy = new Lazy(() => thingThatReturnsSomething()).
 * Then thingThatReturnsSomething() will only get called on the first time lazy.get() is called.
 * On the second and subsequent times, lazy.get() will return the same object - the factory method is not called again.
 */
export class Lazy<T> {
  private _wasConstructed: boolean = false;
  private _value: T | undefined = undefined;
  private _factory: () => T;

  constructor(
    factory: () => T,
    // structure?: T extends { [key: string]: any } ? T : void
  ) {
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
  public wasConstructed(): boolean {
    return this._wasConstructed;
  }
  // public async getAsync(): Promise<T> {
  //   if (this._value !== undefined || this._wasConstructed === true) {
  //     return Promise.resolve(this._value!);
  //   } else {
  //     return new Promise<T>((resolve, reject) => {
  //       this._value = this._factory();
  //       this._wasConstructed = true;
  //       resolve(this._value);
  //     });
  //   }
  // }
}

export function LazyProxy<
  T extends { [key: string]: any } | { [i: number]: any }
>(factory: () => T): Const<T> {
  return (new Proxy(new Lazy(factory), {
    get: (target, property, receiver) => {
      if (property === "toJSON") {
        return () => {
          if (target.wasConstructed()) {
            return target.get();
          } else {
            return "[Object Lazy]";
          }
        };
      }
      const targetValue = target.get();
      return Reflect.get(targetValue, property);
    },
    ownKeys: (target) => {
      const targetValue = target.get();
      return Reflect.ownKeys(targetValue);
    },
    getOwnPropertyDescriptor: (target, property) => {
      /**
       * https://stackoverflow.com/questions/40352613/why-does-object-keys-and-object-getownpropertynames-produce-different-output
       */

      return Object.getOwnPropertyDescriptor(target.get(), property);
      
    },
    has: (target, property) => {
      // This is called when iterating over array i.e. array.forEach()
      return property in target.get()
    }
  }) as unknown) as Const<T>;
}

/**
 * Multiplies colors (0xFFFFFF === 1). use for applying tints manually.
 * @param color1 A base color
 * @param color2 A tint
 */
export function multiplyColor(color1: number, color2: number): number {
  let reds = [color1 & 0xff0000, color2 & 0xff0000];
  let blues = [color1 & 0x0000ff, color2 & 0x0000ff];
  let greens = [color1 & 0x00ff00, color2 & 0x00ff00];
  let out = Math.round(((reds[0] / 0x010000) * reds[1]) / 0xffffff) * 0x010000;
  out += Math.round(((greens[0] / 0x000100) * greens[1]) / 0x00ff00) * 0x000100;
  out += Math.round((blues[0] * blues[1]) / 0x0000ff);
  return out;
}

export function enumKeys<T extends string>(enm: { [key in T]: T }): T[] {
  return Object.keys(enm) as T[];
}

// export function enumKeys<T extends string>(enm: { [key: string]: string }) : T[] {
//   return Object.keys(enm) as T[];
// }
