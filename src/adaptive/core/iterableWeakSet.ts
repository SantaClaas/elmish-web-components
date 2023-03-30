// Based on https://gist.github.com/seanlinsley/bc10378fd311d75cf6b5e80394be813d
// I don't understand why WeakSet is not iterable. The reason presented is that it is to avoid side channel attacks
// since we can't observe garbage collection when we can't iterate. But later they added WeakRef and we can build our own
// WeakSet that is iterable with WeakRef + Set so now we could observe Garbage collection couldn't we?
// And assuming this is not a bug (because it seems very obvious), why can't we now have iteration on WeakSet?
// I assume it is for legacy reasons since WeakSet is older than WeakRef.
// ...And that is how we ended up with our own implementation
export class IterableWeakSet<T extends object> {
  #set: Set<WeakRef<T>>;

  constructor(references?: WeakRef<T>[]) {
    this.#set = new Set(references);
  }

  values() {
    return this.#set.values();
  }

  //   has(reference: WeakRef<T>) {
  //     return this.#set.has(reference);
  //   }

  add(reference: WeakRef<T>) {
    if (this.#set.has(reference)) return false;

    this.#set.add(reference);
    return true;
  }

  remove(reference: WeakRef<T>): boolean {
    return this.#set.delete(reference);
  }
}
