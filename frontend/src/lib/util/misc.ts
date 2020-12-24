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

export type DeepReadonly<T> = T extends Function ? T : {
  readonly [P in keyof T]: T[P] extends { [k: string]: any } ? DeepReadonly<T[P]> : T[P];
}
export type Const<T> = DeepReadonly<T>;

const assertOnlyCalledOnceData: { [k: string]: [string, number] } = {};

export function assertOnlyCalledOnce(id: string | number) {
  let k = id.toString();
  if (assertOnlyCalledOnceData[k] !== undefined) {
    if (assertOnlyCalledOnceData[k][1] === 1) {
      assertOnlyCalledOnceData[k][1] = 2;
    } else {
      throw new Error("Error, called more than twice with same id: " + k + " , callback the first time was : " + assertOnlyCalledOnceData[k]);
    }
  } else {
    const stacktrace = new Error().stack!
    assertOnlyCalledOnceData[k] = [stacktrace, 1];
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

export function batchify<A extends any[]>(fn: (...args: A)=> void): [((...args: A) => void), () => void] {
  let batch: A[] = [];

  return [(...args: A) => {
    batch.push(args);
  }, (() => {
      for (let a of batch) {
        fn(...a);
      }
      batch = [];
    })
  ];
}