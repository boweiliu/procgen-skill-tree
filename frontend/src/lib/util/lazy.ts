import { HashMap, KeyedHashMap } from './data_structures/hash';
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

/**
 * Similar to HashMap, except it allows setting a factory function to be used for missing keys.
 * Also memoizes the result.
 *
 * NOTE: this assume hash() is a strong test for equality, i.e. 2 objects are considered equal if and only if their hashes are the same!!!
 */
export class LazyHashMap<K extends { hash(): string }, V> {
  protected _values: KeyedHashMap<K, V>;
  protected _factory: (k: K) => V;

  constructor(factory: (k: K) => V) {
    this._values = new KeyedHashMap();
    this._factory = factory;
  }

  // setFactory(factory: (k: K) => V) : LazyHashMap<K, V> {
  //   this._factory = factory;
  //   return this;
  // }

  put(key: K, value: V) {
    this._values.put(key, value);
  }

  // remove(key: K): void {
  //   this._values.remove(key);
  // }

  peek(key: K): V | undefined {
    return this._values.get(key);
  }

  get(key: K): V {
    if (this._values.contains(key)) {
      return this._values.get(key)!;
    } else {
      const value = this._factory(key);
      this._values.put(key, value);
      return value;
    }
  }

  precompute(key: K) {
    if (this._values.contains(key)) {
      return;
    } else {
      const value = this._factory(key);
      this._values.put(key, value);
    }
  }

  // returns true if the key was already instantiated
  contains(key: K): boolean {
    return this._values.contains(key);
  }

  values(): V[] {
    return this._values.values();
  }

  keys(): K[] {
    return this._values.keys();
  }

  entries(): [K, V][] {
    return this._values.entries();
  }

  // *[Symbol.iterator]() {
  //   // construct a new iterator. note that as usual editing the object during iteration is not supported
  //   for (let key of Object.keys(this._values)) {
  //     yield key;
  //   }
  // }

  // hashes only the keys - use HashableHashMap if you know that the value type here is also hashable
  // hashKeyset(): string {
  //   const hashes: number[] = Object.keys(this._values).map(s => hashCode(s));
  //   let code: number = hashes.reduce((pv, cv) => pv + cv);
  //   return code.toString();
  // }

  size(): number {
    return this._values.size();
  }

  clone(): LazyHashMap<K, V> {
    let n = new LazyHashMap<K, V>(this._factory);
    n._values = this._values.clone();
    return n;
  }
}
/*
export class LazyHashSet<K extends { hash(): string }> {
  private _values: LazyHashMap<K, boolean>;

  constructor(factory: (k: K) => boolean, initialValues: K[] = []) {
    this._values = new LazyHashMap<K, boolean>(factory);

    for (const value of initialValues) {
      this.put(value);
    }
  }

  // remove(key: K): void {
  //   this._values.remove(key);
  // }

  put(key: K): void {
    this._values.put(key, true);
  }

  get(key: K): boolean {
    return this._values.get(key) !== undefined;
  }

  contains(key: K): boolean {
    return this._values.contains(key);
  }

  values(): K[] {
    return this._values.values();
  }

  // hash(): string {
  //   return this._values.hashKeyset();
  // }

  clone(): HashSet<K> {
    let n = new HashSet<K>();
    n._values = this._values.clone();
    return n;
  }

  size(): number {
    return this._values.size();
  }

  equals(other: HashSet<K> | undefined | null) {
    if (other === undefined || other === null) {
      return false;
    }

    if (this.size() !== other.size()) {
      return false;
    }

    for (let k of this.values()) {
      if (!other.contains(k)) {
        return false;
      }
    }

    return true;
  }

  // *[Symbol.iterator]() {
  //   // construct a new iterator. note that as usual
  //   for (let key of Object.keys(this._values)) {
  //     yield key;
  //   }
  // }
}
*/
