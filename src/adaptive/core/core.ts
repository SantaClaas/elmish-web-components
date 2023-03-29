import { ByReference } from "../byReference";
import { createReferenceHashSet, ReferenceHashSet } from "../equality";
import { resizeArray } from "../fableHelpers";

/**
 * Represents the core interface for all adaptive objects.
 * Contains support for tracking OutOfDate flags, managing in-/outputs
 * and lazy/eager evaluation in the dependency tree.
 */
export interface IAdaptiveObject {
  tag: object | null;
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
export class WeakOutputSet implements IWeakOutputSet {
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

    if (this.#count <= WeakOutputSet.arrayThreshold) {
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
    if (this.#count <= WeakOutputSet.arrayThreshold) {
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
      if (this.#count <= WeakOutputSet.arrayThreshold) {
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

    if (this.#count <= WeakOutputSet.arrayThreshold) {
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
