import { ByReference, toReference } from "../byReference";
import { createReferenceHashSet, ReferenceHashSet } from "../equality";
import { resizeArray } from "../fableHelpers";
import { IterableWeakSet } from "./iterableWeakSet";

//TODO sort out the ref situation since we expect everything of IAdaptiveObject to be ref types anyways don't we?

/**
 * Represents the core interface for all adaptive objects.
 * Contains support for tracking OutOfDate flags, managing in-/outputs
 * and lazy/eager evaluation in the dependency tree.
 */
export interface IAdaptiveObject {
  tag: object | null;
  // Differentiating with ByReference<T> again here to wrap non reference types
  /**
   * Each object can cache a WeakReference pointing to itself.
   * This is because the system internally needs WeakReferences to IAdaptiveObjects
   */
  weak: WeakRef<IAdaptiveObject>;
  /**
   * Used internally to represent the maximal distance from an input
   * cell in the dependency graph when evaluating inside a transaction.
   */
  level: number;

  /**
   * Allows a specific implementation to evaluate the cell during the change propagation process.
   */
  mark(): boolean;

  // Deviate in naming to be clearer here
  /**
   * Indicates whether the object has been marked. This flag should only be accessed when holding
   * a lock on the adaptive object.
   */
  isOutOfDate: boolean;

  /**
   * The adaptive outputs for the object. Represented by Weak references to allow for
   * unused parts of the graph to be garbage collected.
   */
  outputs: IWeakOutputSet;

  /**
   * Gets called whenever a current input of the object gets marked
   * out of date. The first argument represents the Transaction that
   * causes the object to be marked
   */
  inputChanged(transaction: object, adaptiveObject: IAdaptiveObject): void;

  /**
   * Gets called after all inputs of the object have been processed
   * and directly before the object will be marked
   */
  allInputsProcessed(object: object): void;

  /**
   * Indicates whether the IAdaptiveObject is constant
   */
  isConstant: boolean;
}

/**
 * Represents a set of outputs for an AdaptiveObject. The references to all
 * contained elements are weak and the datastructure allows to add/remove entries.
 * the only other functionality is Consume which returns all the (currently alive)
 * entries and clears the set.
 */
export interface IWeakOutputSet {
  /**
   * Indicates whether the set is (conservatively) known to be empty.
   */
  get isEmpty(): boolean;

  /**
   * Adds a weak reference to the given AdaptiveObject to the set
   * And returns a boolean indicating whether the obj was new.
   * @param object adds a weak referenc eto the given AdaptiveObject to the set
   * @returns a boolean indicating whether the object was new
   */
  add(object: IAdaptiveObject): boolean;

  /**
   * Removes the reference to the given AdaptiveObject from the set
   * And returns a boolean indicating whether the obj was removed.
   */
  remove(object: IAdaptiveObject): boolean;

  /**
   * Returns all currently living entries from the set.
   * And clears its content.
   */
  consume(output: ByReference<IAdaptiveObject[]>): number;

  /**
   * Clears the set
   */
  clear(): void;
}

// I ported the fable version since I expect that it will be able to run in JS like fable
export class FableWeakOutputSet implements IWeakOutputSet {
  static arrayThreshold = 8;

  #count: number = 0;
  // The original uses object and boxes it, but that isn't really a concept here so we use a
  // union type to help typescript
  #data: IAdaptiveObject | IAdaptiveObject[] | Set<IAdaptiveObject> | null =
    null;

  add(object: IAdaptiveObject): boolean {
    if (this.#count === 0) {
      this.#data = object;
      this.#count = 1;
      return true;
    }

    if (this.#count === 1) {
      if (this.#data === object) return false;

      const array = [...Array(8)];
      array[0] = this.#data;
      array[1] = object;

      this.#data = array;
      this.#count = 2;
      return true;
    }

    if (this.#count <= FableWeakOutputSet.arrayThreshold) {
      const array = <IAdaptiveObject[]>this.#data;

      // Linear search for object and check if it is in here
      for (let index = 0; index < array.length; index++) {
        // Not new, return
        if (object === array[index]) return false;
      }

      // If we are withing array boundary
      if (this.#count < array.length) {
        array[this.#count] = object;
        this.#count = this.#count + 1;
        return true;
      }

      // Else switch to set
      const set = createReferenceHashSet(array);

      for (const element of array) {
        set.add(element);
      }

      this.#count++;
      this.#data = set;
      if (set.has(object)) return false;
      set.add(object);
      return true;
    }

    const set = <ReferenceHashSet<IAdaptiveObject>>this.#data;
    if (set.has(object)) return false;

    set.add(object);
    return true;
  }

  remove(object: IAdaptiveObject): boolean {
    // Case no object
    if (this.#count === 0) {
      return false;
    }

    if (this.#count === 1) {
      // Case one object
      if (object !== this.#data) return false;

      this.#count = 0;
      this.#data = null;
      return true;
    }

    // Case Array before we switched to set
    if (this.#count <= FableWeakOutputSet.arrayThreshold) {
      const array = this.#data as IAdaptiveObject[];

      // Linear search?
      let index = 0;
      for (; index < array.length; index++) {
        if (array[index] === object) break;
      }

      // Case not found
      if (index === array.length) {
        return false;
      }

      // Case found
      // Rewrote this section to early return to reduce nesting.
      // Not sure if it was written without on purpose originally
      const newCount = this.#count - 1;
      // Check if we go back to the other data structure
      if (newCount === 1) {
        this.#data = index === 0 ? array[1] : array[0];
        this.#count = newCount;
        return true;
      }

      if (newCount === index) {
        array[index] = null!;
        this.#count = newCount;
        return true;
      }

      array[index] = array[newCount];
      array[newCount] = null!;
      this.#count = newCount;
      return true;
    }

    // Case Set

    const set = this.#data as Set<IAdaptiveObject>;

    if (set.delete(object)) {
      this.#count = set.size;

      // If we go below, go back to array internal data structure
      if (this.#count <= FableWeakOutputSet.arrayThreshold) {
        this.#data = [...set];
      }

      return true;
    }

    return false;
  }

  consume(output: ByReference<IAdaptiveObject[]>): number {
    if (this.#count == 0) return 0;

    if (this.#count === 1) {
      const data = this.#data;
      this.#data = null;
      this.#count = 0;

      // I guess we assume output is length >= 1?
      output.value[0] = data as IAdaptiveObject;
      return 1;
    }

    if (this.#count <= FableWeakOutputSet.arrayThreshold) {
      const array = this.#data as IAdaptiveObject[];
      const count = this.#count;
      this.#data = null;
      this.#count = 0;

      if (count >= output.value.length) {
        resizeArray(output, array.length * 2);
      }

      for (let index = 0; index < count; index++) {
        output.value[index] = array[index];
      }

      return count;
    }

    // Else Set
    const set = this.#data as Set<IAdaptiveObject>;
    this.#data = null;
    this.#count = 0;

    let outputIndex = 0;
    for (const element of set) {
      if (outputIndex >= output.value.length) {
        resizeArray(output, outputIndex * 2);
      }

      output.value[outputIndex] = element;
      outputIndex++;
    }

    return outputIndex;
  }

  get isEmpty() {
    return this.#count === 0;
  }

  clear(): void {
    this.#data = null;
    this.#count = 0;
  }
}

/**
 * From FSharp data adaptive: "Datastructure for zero-cost casts between different possible representations for WeakOutputSet.
 * We actually did experiments and for huge dependency graphs transactions were ~10% faster
 * than they were when using unbox."
 * We need to test if this is the case in JS too
 */
type VolatileSetData = {
  single: WeakRef<IAdaptiveObject> | null;
  array: (WeakRef<IAdaptiveObject> | null)[] | null;
  // I think this is the same as Set<WeakRef<IAdaptableObject>> in contrast to source but I am not sure
  set: IterableWeakSet<IAdaptiveObject> | null;
  tag: number;
};

export class WeakOutputSet implements IWeakOutputSet {
  // Yes, I know
  #data: VolatileSetData = {
    single: null,
    array: null,
    set: null,
    tag: 0,
  };
  #setOperationsCount = 0;

  #add(object: IAdaptiveObject): boolean {
    const weakObject = object.weak;
    // This variable is on the object scope, not method in the original source.
    // Not sure why. I assume justo on the method scope is ok
    let valueReader: IAdaptiveObject | undefined;
    switch (this.#data?.tag) {
      case 0:
        if (this.#data.single === null) {
          this.#data.single = weakObject;
          return true;
        }

        if (this.#data.single === weakObject) return false;

        valueReader = this.#data.single.deref();
        if (valueReader === undefined) {
          // Single is free so set it to new value
          this.#data.single = weakObject;
          return true;
        }

        // Already set
        if (valueReader === object) return false;

        // Single is "full" so we switch to array
        const array = Array(8).fill(null);
        array[0] = this.#data.single;
        array[1] = weakObject;
        this.#data.tag = 1;
        this.#data.array = array;
        // Clean up single reference
        this.#data.single = null;
        return true;
      case 1:
        // -2 means already added
        let freeIndex = -1;
        // Array should not be null at this point because then we would have skipped single code above
        const length = this.#data.array!.length;
        // Linear search for a free index
        for (let index = 0; index < length; index++) {
          const reference = this.#data.array![index];
          // Found free index
          if (reference === null) {
            freeIndex = index;
            break;
          }

          // Already added
          if (reference === weakObject) {
            return false;
          }

          // Inspect reference
          valueReader = reference.deref();
          // Couldn't read means dead reference so we found a free index
          if (valueReader === undefined) {
            freeIndex = index;
            break;
          }

          if (valueReader === object) {
            // Same object but different weak reference, so return
            return false;
          }

          // Else the weak reference at the current index is alive and belongs to
          // a different object, this means the index is not free and we continue
        }

        if (freeIndex >= 0) {
          // Free index found and object is not already in array, add
          this.#data.array![freeIndex] = weakObject;
          return true;
        }

        // Else if we don't have a free index, we switch to the set as the array is full

        // Also remove dead references
        // No free index and not already in array, switch to set and add new value
        // Need cast because TS doesn't understand they are not null after the filter
        const all = this.#data.array!.filter(
          (element) => element !== null && element.deref() !== undefined
        ) as WeakRef<IAdaptiveObject>[];
        const set = new IterableWeakSet<IAdaptiveObject>(all);

        const result = set.add(weakObject);

        this.#data.tag = 2;
        this.#data.set = set;
        // Clearn up dangling array reference
        this.#data.array = null;
        return result;

      default:
        // Set should not be null at this point because then we would have skipped array code above
        return this.#data.set!.add(weakObject);
    }
  }

  //TODO explore using FinalizationRegistration to clean up instead of calling cleanup every 100 operations
  // The only reason we have to use a manual WeakSet implementation is because the native one
  // is not iterable...
  /**
   * Used internally to get rid of leaking WeakReferences
   */
  #cleanup() {
    if (this.#setOperationsCount <= 100) return;

    // Our port is not concurrency safe. So if this is shared between a worker and the main thread it should be locked.
    this.#setOperationsCount = 0;
    const array: IAdaptiveObject[] = Array(100).fill(undefined);
    const count = this.consume(toReference(array));
    for (let index = 0; index < count; index++) this.#add(array[index]);
  }

  /**
   * Adds a weak reference to the given AdaptiveObject to the set
   * And returns a boolean indicating whether the obj was new.
   */
  add(object: IAdaptiveObject): boolean {
    if (object.isConstant) return false;

    if (!this.#add(object)) return false;

    this.#setOperationsCount++;
    this.#cleanup();
    return true;
  }

  /**
   * Removes the reference to the given AdaptiveObject from the set
   * And returns a boolean indicating whether the obj was removed.
   */
  remove(object: IAdaptiveObject): boolean {
    if (object.isConstant) return false;

    let old: IAdaptiveObject | undefined;

    switch (this.#data?.tag) {
      case 0:
        if (this.#data.single === null) return false;

        old = this.#data.single.deref();
        if (old === undefined) return false;

        this.#data.single = null;
        return true;
      case 1:
        // Should not be null because we switched before (we love shared mutable state)
        let isFound = false;
        const length = this.#data.array!.length;

        let count = 0;
        let living = null;

        for (let index = 0; index < length; index++) {
          const reference = this.#data.array![index];
          if (reference === null) continue;

          old = reference.deref();

          // Dead reference
          if (old === undefined) {
            // Clean up
            this.#data.array![index] = null;
            continue;
          }

          if (old !== object) {
            count++;
            living = reference;
            continue;
          }

          // Yay, found it
          this.#data.array![index] = null;
          isFound = true;
        }

        if (count === 0) {
          // Switch to single
          this.#data.tag = 0;
          this.#data.single = null;
          return isFound;
        }

        if (count === 1) {
          // Switch to single
          this.#data.tag = 0;
          this.#data.single = living;
          return isFound;
        }

        // Here we have count > 2 so we stay in array mode
        return isFound;

      default:
        // Should not be null because we switched before (we love shared mutable state)
        if (!this.#data.set!.remove(object.weak)) return false;

        this.#setOperationsCount++;
        this.#cleanup();
        return true;
    }
  }
  consume(output: ByReference<IAdaptiveObject[]>): number {
    switch (this.#data.tag) {
      case 0:
        if (this.#data.single === null) return 0;

        const value = this.#data.single.deref();
        if (value === undefined) {
          // Original source doesn't clean up the reference here but shouldn't we?
          this.#data.single = null;
          return 0;
        }

        output.value[0] = value;
        this.clear();
        return 1;
      case 1: {
        let outputIndex = 0;
        const array = this.#data.array!;
        for (let index = 0; index < array.length; index++) {
          const reference = array[index];
          if (reference === null) continue;

          const value = reference.deref();
          if (value === undefined) {
            // Again, original source doesn't clean up the reference here but shouldn't we?
            array[index] = null;
            continue;
          }

          if (outputIndex >= output.value.length)
            resizeArray(output, outputIndex << 2);

          output.value[outputIndex] = value;
          outputIndex++;
        }

        this.clear();
        return outputIndex;
      }

      default:
        let outputIndex = 0;
        // This iteration is the only reason we can't use the WeakSet
        for (const reference of this.#data.set!.values()) {
          const object = reference.deref();
          if (object === undefined) continue;
          // Resize if too large
          if (outputIndex >= output.value.length)
            resizeArray(output, outputIndex << 2);

          output.value[outputIndex] = object;
          outputIndex++;
        }

        this.clear();
        return outputIndex;
    }
  }

  clear() {
    this.#data!.single = null;
    this.#data!.tag = 0;
    this.#setOperationsCount = 0;
  }

  /**
   * Indicates whether the set is (conservatively) known to be empty.
   * Note that we don't dereference any WeakReferences here.
   */
  get isEmpty() {
    switch (this.#data!.tag) {
      case 0:
        return this.#data!.single === null;
      default:
        return false;
    }
  }
}

export class EmptyOutputSet implements IWeakOutputSet {
  get isEmpty(): boolean {
    return true;
  }
  add(_: IAdaptiveObject): boolean {
    return false;
  }
  remove(_: IAdaptiveObject): boolean {
    return false;
  }
  consume(_: ByReference<IAdaptiveObject[]>): number {
    return 0;
  }
  clear(): void {}
}
