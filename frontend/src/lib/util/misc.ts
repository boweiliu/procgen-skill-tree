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
    const re = new RegExp(Object.keys(mapObj).join('|'), 'gi');

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
    ][d.getMonth()];

    return `${monthName} ${d.getDate()}, ${('00' + d.getHours()).substr(-2)}:${(
      '00' + d.getMinutes()
    ).substr(-2)}:${('00' + d.getSeconds()).substr(-2)}`;
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
    intersperse = '',
    character = ' '
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
        'Error, called more than twice with same id: ' +
          k +
          ' , callback the first time was : ' +
          assertOnlyCalledOnceData[k]
      );
    }
  } else {
    const stacktrace = new Error().stack!;
    assertOnlyCalledOnceData[k] = [stacktrace, 1];
  }
}

export function enumKeys<T extends string>(enm: { [key in T]: T }): T[] {
  return Object.keys(enm) as T[];
}

// export function enumKeys<T extends string>(enm: { [key: string]: string }) : T[] {
//   return Object.keys(enm) as T[];
// }

/**
 * Used on pojo filtering functions.
 * Here deepFilter: T => U is expected to be a pure function of the form object => object with a subset of the same properties (deeply).
 * for instance
 * deepFilter: { a: number, b: { c: number , d: string } } => { a: number, b: { c: number } }
 * @returns a list. each element of the list represents an access path that is in the subset of paths kept by the pure filter function.
 * in the example above, the output would be [ ['a'],  ['b', 'c'] ]
 */
export function extractAccessPaths<T, U>(deepFilter: (t: T) => U): string[][] {
  let accessPaths: string[][] = [[]];

  const proxyHandler: ProxyHandler<{ path: string[] }> = {
    get: (
      target: { path: string[] },
      p: string | number | symbol,
      receiver: any
    ): any => {
      const newPath = target.path.concat([p.toString()]);
      // detect if we are merely adding on to an existing path and if so update it in place
      if (accessPaths[accessPaths.length - 1] === target.path) {
        accessPaths[accessPaths.length - 1] = newPath;
      } else {
        accessPaths.push(newPath);
      }
      const newObj = new Proxy({ path: newPath }, proxyHandler);
      return newObj;
    },
  };

  // run the function and record the paths
  deepFilter(new Proxy({ path: accessPaths[0] }, proxyHandler) as any);

  return accessPaths;
}

/**
 *
 * @param deepFilter pojo filtering function, as above
 * @returns a function that takes a T instance and returns the list of properties accessed by deepFilter. useful in react useMemo calls
 */
export function extractDeps<T, U>(
  deepFilter: (t: T) => U
): (t: T | Const<U>) => any[] {
  const accessPaths = extractAccessPaths(deepFilter);

  return (t: T | U) => {
    const deps = accessPaths.map((accessPath) => {
      let ref: any = t;
      for (let p of accessPath) {
        ref = ref?.[p];
      }
      return ref;
    });
    // console.log({ deps });
    return deps;
  };
}
