/**
 * Represents a set of outputs for an AdaptiveObject. The references to all
 * contained elements are weak and the datastructure allows to add/remove entries.
 * the only other functionality is Consume which returns all the (currently alive)
 * entries and clears the set.
 */
export interface IWeakOutpuSet {
  /**
   * Indicates whether the set is (conservatively) known to be empty.
   */
  isEmpty: boolean;

  /**
   * Adds a weak reference to the given AdaptiveObject to the set
   * And returns a boolean indicating whether the obj was new.
   * @param object adds a weak referenc eto the given AdaptiveObject to the set
   * @returns a boolean indicating whether the object was new
   */
  add: (object: IAdaptiveObject) => boolean;

  /**
   * Removes the reference to the given AdaptiveObject from the set
   * And returns a boolean indicating whether the obj was removed.
   */
  remove: (object: IAdaptiveObject) => boolean;

  /**
   * Returns all currently living entries from the set.
   * And clears its content.
   */
  consume: () => [objects: IAdaptiveObject[], number: number];

  /**
   * Clears the set
   */
  clear: () => void;
}
/**
 * Represents the core interface for all adaptive objects.
 * Contains support for tracking OutOfDate flags, managing in-/outputs
 * and lazy/eager evaluation in the dependency tree.
 */
export interface IAdaptiveObject {
  tag: object;
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
  mark: () => boolean;

  /**
   * Indicates whether the object has been marked. This flag should only be accessed when holding
   * a lock on the adaptive object.
   */
  isOutOfDate: boolean;

  /**
   * The adaptive outputs for the object. Represented by Weak references to allow for
   * unused parts of the graph to be garbage collected.
   */
  outputs: IWeakOutpuSet;

  /**
   * Gets called whenever a current input of the object gets marked
   * out of date. The first argument represents the Transaction that
   * causes the object to be marked
   */
  inputChanged: (transaction: object, adaptiveObject: IAdaptiveObject) => void;

  /**
   * Gets called after all inputs of the object have been processed
   * and directly before the object will be marked
   */
  allInputsProcessed: (object: object) => void;

  /**
   * Indicates whether the IAdaptiveObject is constant
   */
  isConstant: boolean;
}

// export abstract class AdaptiveObject implements IAdaptiveObject {
//     tag: object;
//     weak: WeakRef<AdaptiveObject>;
//     level: number;

// }
