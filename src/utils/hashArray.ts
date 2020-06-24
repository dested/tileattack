export class HashArray<T extends {getHash(): number}> {
  [index: number]: never;
  array: T[];

  hash: {[key: number]: T};

  constructor() {
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

  exists(item: T) {
    return this.hash[item.getHash()] !== undefined;
  }

  filter(callbackfn: (value: T, index: number, array: T[]) => any): T[] {
    return this.array.filter(callbackfn);
  }

  get(keyItem: T) {
    return this.hash[keyItem.getHash()];
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
    const key = item.getHash();
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

  reassign(oldHash: number, item: T) {
    const key = item.getHash();
    delete this.hash[oldHash];
    this.hash[key] = item;
  }

  reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U) {
    return this.array.reduce(callbackfn, initialValue);
  }

  removeItem(item: T) {
    const key = item.getHash();
    if (!this.hash[key]) {
      return;
    }

    const hashedItem = this.hash[key];
    delete this.hash[key];
    this.array.splice(this.array.indexOf(hashedItem), 1);
  }

  swapItems(item1: T, item2: T) {
    const key1 = item1.getHash();
    const key2 = item2.getHash();
    this.hash[key1] = item1;
    this.hash[key2] = item2;
  }

  static create<T extends {getHash(): number}>(items: T[]) {
    const hashArray = new HashArray<T>();
    hashArray.pushRange(items);
    return hashArray;
  }
}
