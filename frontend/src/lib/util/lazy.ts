import { Const } from './misc';

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
    factory: () => T
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
      if (property === 'toJSON') {
        return () => {
          if (target.wasConstructed()) {
            return target.get();
          } else {
            return '[Object Lazy]';
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
      return property in target.get();
    },
  }) as unknown) as Const<T>;
}
