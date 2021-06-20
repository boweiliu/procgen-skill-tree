/**
 * Intended as a typescript-friendly replacement for {[k: string]: boolean} that allows us to specify what the key type should be (
 * rather than allowing any keyType.toString() to be a valid key, and without going through the trouble of declaring distinguishable
 * types for each key type we want to use). Also serves as a slightly different version of ES6 native Set(), which is hardcoded
 * to use === for object referential equality.
 *
 * NOTE: this assume hash() is a strong test for equality, i.e. 2 objects are considered equal if and only if their hashes are the same!!!
 * TODO: write StrictHashSet<K extends {hash(): string, equals(k: K): boolean}> to handle custom equality checks
 */
export class HashSet<K extends { hash(): string }> {
  private _values: HashMap<K, K>;

  constructor(initialValues: K[] = []) {
    this._values = new HashMap<K, K>();

    for (const value of initialValues) {
      this.put(value);
    }
  }

  remove(key: K): void {
    this._values.remove(key);
  }

  put(key: K): void {
    this._values.put(key, key);
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

/**
 * Intended as a typescript-friendly replacement for {[k: string]: V} that allows us to specify what the key type should be (
 * rather than allowing any keyType.toString() to be a valid key, and without going through the trouble of declaring distinguishable
 * types for each key type we want to use). Also serves as a slightly different version of ES6 native Map(), which is hardcoded
 * to use === for object referential equality.
 *
 * NOTE: this assume hash() is a strong test for equality, i.e. 2 objects are considered equal if and only if their hashes are the same!!!
 * TODO: write StrictHashMap<K extends {hash(): string, equals(K): boolean}> to handle custom equality checks
 */
export class HashMap<K extends { hash(): string }, V> {
  protected _values: { [key: string]: V } = {};

  constructor(initialValues: [K, V][] = []) {
    for (const [key, value] of initialValues) {
      this.put(key, value);
    }
  }

  put(key: K, value: V) {
    this._values[key.hash()] = value;
  }

  remove(key: K): void {
    delete this._values[key.hash()];
  }

  get(key: K): V | undefined {
    return this._values[key.hash()];
  }

  contains(key: K): boolean {
    // V may be an undefined type
    return this.get(key) !== undefined && key.hash() in this._values;
  }

  values(): V[] {
    return Object.values(this._values);
    // return Object.keys(this._values).map(key => this._values[key]); // why grant???
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
    return Object.keys(this._values).length;
  }

  clone(): HashMap<K, V> {
    let n = new HashMap<K, V>();
    n._values = { ...this._values };
    return n;
  }
}

export class HashableHashMap<
  K extends { hash(): string },
  V extends { hash(): string }
> extends HashMap<K, V> {
  hash(): string {
    const hashes: number[] = Object.entries(this._values).map(
      ([s, v]) => hashCode(s) + hashCode(v.hash())
    );
    let code: number = hashes.reduce((pv, cv) => pv + cv);
    return code.toString();
  }
}

/**
 * Same as HashMap, but actually stores the keys used to key the hashmap, instead of just their hashes.
 * Allows iteration over the full key-value pair set.
 */
export class KeyedHashMap<K extends { hash(): string }, V> {
  private _kvalues: { [key: string]: [K, V] } = {};

  constructor(initialValues: [K, V][] = []) {
    for (const [key, value] of initialValues) {
      this.put(key, value);
    }
  }

  put(key: K, value: V) {
    this._kvalues[key.hash()] = [key, value];
  }

  remove(key: K): void {
    delete this._kvalues[key.hash()];
  }

  get(key: K): V | undefined {
    return this._kvalues[key.hash()]?.[1];
  }

  contains(key: K): boolean {
    // V may be an undefined type
    return this.get(key) !== undefined && key.hash() in this._kvalues;
  }

  keys(): K[] {
    return Object.keys(this._kvalues).map((key) => this._kvalues[key][0]);
  }

  entries(): [K, V][] {
    return Object.keys(this._kvalues).map((key) => this._kvalues[key]);
  }

  values(): V[] {
    return Object.keys(this._kvalues).map((key) => this._kvalues[key][1]);
  }

  hashKeyset(): string {
    const hashes: number[] = Object.keys(this._kvalues).map((s) => hashCode(s));
    let code: number = hashes.reduce((pv, cv) => pv + cv);
    return code.toString();
  }

  clone(): KeyedHashMap<K, V> {
    let n = new KeyedHashMap<K, V>();
    n._kvalues = { ...this._kvalues };
    return n;
  }

  size(): number {
    return Object.keys(this._kvalues).length;
  }

  static SerializeToObject<K extends { hash(): string }, V>(
    obj: KeyedHashMap<K, V>
  ): object {
    return obj.entries();
  }

  static Deserialize<K extends { hash(): string }, V>(
    obj: any
  ): KeyedHashMap<K, V> | null {
    if (!obj || !Array.isArray(obj)) {
      console.error('Failed deserializing keyed hash map');
      return null;
    }
    for (let o of obj) {
      if (
        !o ||
        !Array.isArray(o) ||
        o.length !== 2 ||
        !o[0].hasOwnProperty('hash')
      ) {
        console.error('Failed deserializing keyed hash map');
        return null;
      }
    }
    return new KeyedHashMap(obj);
  }
}

export class DefaultHashMap<K extends { hash(): string }, V> {
  private _values: { [key: string]: V } = {};
  private _makeDefault: () => V;

  constructor(makeDefaultValue: () => V) {
    this._makeDefault = makeDefaultValue;
  }

  put(key: K, value: V) {
    this._values[key.hash()] = value;
  }

  get(key: K): V {
    if (this._values[key.hash()] === undefined) {
      this._values[key.hash()] = this._makeDefault();
    }

    return this._values[key.hash()];
  }
}

// Hash a string to a number. source: https://gist.github.com/hyamamoto/fd435505d29ebfa3d9716fd2be8d42f0
export function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

// declare global {
//   interface Array<T extends { hash(): string }> {
//     hash(): string
//   }
//
//   interface Number {
//     hash(): string
//   }
//
//   interface String {
//     hash(): String
//   }
// }
//
// Array.prototype.hash = function () {
//   return hashArray(this);
// }
//
// Number.prototype.hash = function () {
//   return this.toString();
// }
//
// String.prototype.hash = function () {
//   return this;
// }
//
// function hashArray<T extends { hash(): string }>(arr: T[]): string {
//   return arr.map(elt => hashCode(elt.hash())).reduce((pv, cv) => 31 * pv + cv).hash();
// }
//
