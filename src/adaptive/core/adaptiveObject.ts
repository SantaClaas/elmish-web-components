import { IAdaptiveObject, FableWeakOutputSet, WeakOutputSet } from "./core";

/**
 * Core implementation of IAdaptiveObject containing tools for evaluation
 * and locking
 */
export class AdaptiveObject implements IAdaptiveObject {
  static #currentEvaluationDepth: number = 0;

  isOutOfDate: boolean = true;
  level: number = 0;
  outputs = new WeakOutputSet();
  #weak: WeakRef<IAdaptiveObject> | null = null;

  tag: object | null = null;

  /**
   * Used for resetting EvaluationDepth in eager evaluation
   * @internal
   */
  static get unsafeEvaluationDepth() {
    return AdaptiveObject.#currentEvaluationDepth;
  }

  /**
   * Used for resetting EvaluationDepth in eager evaluation
   * @internal
   */
  static set unsafeEvaluationDepth(value: number) {
    AdaptiveObject.#currentEvaluationDepth = value;
  }

  /**
   * See IAdaptiveObject.weak
   */
  get weak(): WeakRef<IAdaptiveObject> {
    /**
     * Note that we accept the race condition here since locking the object
     * would potentially cause deadlocks and the worst case is, that we
     * create two different WeakReferences for the same object
     */
    if (this.#weak !== null) return this.#weak;

    const weak = new WeakRef<IAdaptiveObject>(this);
    this.#weak = weak;
    return weak;
  }

  /**
   * See IAdaptiveObject.mark
   */
  mark() {
    return true;
  }

  /**
   * See IAdaptiveObject.allInputProcessed
   */
  allInputsProcessed(_: object) {}

  /**
   * See IAdaptiveObject.inputChanged
   */
  inputChanged() {}

  isConstant: boolean = false;
}
