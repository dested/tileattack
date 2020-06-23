export class HashArray<T extends TKey, TKey = T> {
  [index: number]: never;
  array: T[];

  hash: {[key: number]: T};

  constructor(public getKey: (t: TKey) => number) {
    this.hash = {};
    this.array = [];
  }

  get length() {
    return this.array.length;
  }
  [Symbol.iterator]() {
    return this.array[Symbol.iterator]();
  }

  afind(predicate: (value: T, index: number, obj: T[]) => boolean) {
    return this.array.find(predicate);
  }

  exists(item: TKey) {
    return this.hash[this.getKey(item)] !== undefined;
  }

  filter(callbackfn: (value: T, index: number, array: T[]) => any): T[] {
    return this.array.filter(callbackfn);
  }

  get(keyItem: TKey) {
    return this.hash[this.getKey(keyItem)];
  }

  getByKey(key: number) {
    return this.hash[key];
  }

  getIndex(index: number) {
    return this.array[index];
  }

  map<T2>(callbackfn: (value: T) => T2) {
    return this.array.map(callbackfn);
  }

  push(item: T) {
    const key = this.getKey(item);
    if (this.hash[key]) {
      return;
    }

    this.hash[key] = item;
    this.array.push(item);
  }

  pushRange(items: T[]) {
    for (const item of items) {
      this.push(item);
    }
  }

  reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U) {
    return this.array.reduce(callbackfn, initialValue);
  }

  removeItem(item: T) {
    const key = this.getKey(item);
    if (!this.hash[key]) {
      return;
    }

    const hashedItem = this.hash[key];
    delete this.hash[key];
    this.array.splice(this.array.indexOf(hashedItem), 1);
  }

  static create<T extends TKey, TKey>(items: T[], getKey: (t: TKey) => number) {
    const hashArray = new HashArray<T, TKey>(getKey);
    hashArray.pushRange(items);
    return hashArray;
  }
}

export class DoubleHashArray<T extends TKey1 & TKey2, TKey1 = T, TKey2 = T> {
  [index: number]: never;
  array: T[];

  hash1: {[key: string]: T};
  hash2: {[key: number]: T};

  constructor(public getKey1: (t: TKey1) => string, public getKey2: (t: TKey2) => number) {
    this.hash1 = {};
    this.hash2 = {};
    this.array = [];
  }

  get length() {
    return this.array.length;
  }
  [Symbol.iterator]() {
    return this.array[Symbol.iterator]();
  }

  exists1(item: TKey1) {
    return this.hash1[this.getKey1(item)] !== undefined;
  }
  exists2(item: TKey2) {
    return this.hash2[this.getKey2(item)] !== undefined;
  }

  filter(callbackfn: (value: T, index: number, array: T[]) => any): T[] {
    return this.array.filter(callbackfn);
  }

  find(predicate: (value: T, index: number, obj: T[]) => boolean) {
    return this.array.find(predicate);
  }

  get1(keyItem: TKey1) {
    return this.hash1[this.getKey1(keyItem)];
  }
  get2(keyItem: TKey2) {
    return this.hash2[this.getKey2(keyItem)];
  }

  getIndex(index: number) {
    return this.array[index];
  }

  map<T2>(callbackfn: (value: T) => T2) {
    return this.array.map(callbackfn);
  }

  moveKey1(e: T, fromT1: TKey1, toT1: TKey1) {
    delete this.hash1[this.getKey1(fromT1)];
    this.hash1[this.getKey1(toT1)] = e;
  }

  push(item: T) {
    const key1 = this.getKey1(item);
    if (this.hash1[key1]) {
      return;
    }

    this.hash1[key1] = item;

    const key2 = this.getKey2(item);
    this.hash2[key2] = item;
    this.array.push(item);
  }

  pushRange(items: T[]) {
    for (const item of items) {
      this.push(item);
    }
  }

  reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U) {
    return this.array.reduce(callbackfn, initialValue);
  }

  removeItem(item: T) {
    const key1 = this.getKey1(item);
    if (!this.hash1[key1]) {
      return;
    }
    const hashedItem = this.hash1[key1];
    const key2 = this.getKey2(item);

    delete this.hash1[key1];
    delete this.hash2[key2];

    this.array.splice(this.array.indexOf(hashedItem), 1);
  }

  static create<T extends TKey1 & TKey2, TKey1, TKey2>(
    items: T[],
    getKey1: (t: TKey1) => string,
    getKey2: (t: TKey2) => number
  ) {
    const hashArray = new DoubleHashArray<T, TKey1, TKey2>(getKey1, getKey2);
    hashArray.pushRange(items);
    return hashArray;
  }
}
