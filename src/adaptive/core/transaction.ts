import { IAdaptiveObject, IWeakOutputSet } from "./core";
// Port note: this locking logic doesn't really lock since there is no Monitor equivalent in JS to my knowledge
// but it can be added here later if it exists
/**
 * Determines whether the object is locked and out-of-date
 */
function isOutOfDateCaller(object: IAdaptiveObject) {
  //  Monitor.IsEntered o && o.OutOfDate
  return object.isOutOfDate;
}

/**
 * Acquires a write-lock to an AdaptiveObject
 */
function enterWrite(_: IAdaptiveObject) {
  // Monitor.Enter o
  return;
}

/**
 * Releases the write-lock to the AdaptiveObject
 */
function exitWrite(_: IAdaptiveObject) {
  // Monitor.Exit o
  return;
}

// Port note: changed  "Exception" postfix to "Error" postfix to match JS style
/**
 * When evaluating AdaptiveObjects inside a Transaction
 * (aka eager evaluation) their level might be inconsistent when
 * attempting to evaluate. Therefore the evaluation may raise
 * this exception causing the evaluation to be delayed to a later
 * time in the Transaction.
 */
export class LevelChangedError extends Error {
  constructor(newLevel: number) {
    super();
    this.newLevel = newLevel;
  }
  /**
   * The new level for the top-level object.
   */
  newLevel: number;
}
/**
 * internal type used for properly handling of decorator objects (as introduced in AVal.mapNonAdaptive)
 * Note that it should never be necessary to use this in user-code.
 */
class IndirectOutputObject implements IAdaptiveObject {
  #weak: WeakRef<IAdaptiveObject> | null = null;
  #release: (indirectOutput: IndirectOutputObject) => void;
  decorator: IAdaptiveObject;
  real: WeakRef<IAdaptiveObject>;

  private constructor(
    real: WeakRef<IAdaptiveObject>,
    decorator: IAdaptiveObject,
    release: (indirectOutput: IndirectOutputObject) => void
  ) {
    this.real = real;
    this.decorator = decorator;
    this.#release = release;
  }

  get tag() {
    return null;
  }

  set tag(_: object | null) {}

  isConstant: boolean = false;

  // weak: WeakRef<IAdaptiveObject>;

  get weak(): WeakRef<IAdaptiveObject> {
    // Note that we accept the race condition here since locking the object
    // would potentially cause deadlocks and the worst case is, that we
    // create two different WeakReferences for the same object
    // Code porting notes: Idk if this behaves the same, I tried my best
    const w = this.#weak;
    if (w === null) {
      const w = new WeakRef<IAdaptiveObject>(this);
      return w;
    } else {
      return w;
    }
  }

  outputs: IWeakOutputSet = null!;

  mark(): boolean {
    return false;
  }

  allInputsProcessed(_: object): void {}

  inputChanged(_: object, __: IAdaptiveObject): void {}

  get isOutOfDate() {
    return false;
  }

  set isOutOfDate(_: boolean) {}

  get level() {
    const realObject = this.real.deref();
    if (realObject === undefined) return 0;

    return realObject.level;
  }

  set level(level: number) {
    const realObject = this.real.deref();
    if (realObject === undefined) return;

    realObject.level = level;
  }

  static create(
    real: IAdaptiveObject,
    decorator: IAdaptiveObject,
    release: (indirectOutput: IndirectOutputObject) => void
  ): IndirectOutputObject {
    // Does this work like type checking?
    if (real instanceof IndirectOutputObject) return real;

    return new IndirectOutputObject(real.weak, decorator, release);
  }

  release() {
    this.#release(this);
  }
}

/**
 * Holds a set of adaptive objects which have been changed and shall
 * therefore be marked as outOfDate. Committing the transaction propagates
 * these changes into the dependency-graph, takes care of the correct
 * execution-order and acquires appropriate locks for all objects affected.
 */
class Transaction {
  // Each thread may have its own running transaction
  // Port note: Idk how that translates to JS. JS is single threaded except when running in workers so this is a TODO to figure out workers
  // Also this is an option type in the original source but we use the OO way of null (yikes)
  //TODO figure out how to do single instance of this for each worker
  private static RunningTransaction: Transaction | null;

  private static CurrentTransaction: Transaction | null;

  // Didn't port this because it had no usages
  //static let cmp = OptimizedClosures.FSharpFunc<_,_,_>.Adapt(fun struct(l,_) struct(r,_) -> compare l r)

  // We use a duplicate-queue here since we expect levels to be identical quite often
  #queue = new TransactQueue<IAdaptiveObject>();

  current: IAdaptiveObject | null = null;
  #currentLevel = 0;
  finalizers: (() => void)[] = [];
  outputs: (IAdaptiveObject | null)[] = [];

  runFinalizers() {
    // Port note: using the fable version here
    const finalizers = this.finalizers;
    this.finalizers = [];
    //TODO debug check finalizers is not empty
    finalizers.forEach((finalizer) => finalizer());
  }

  addFinalizer(finalizer: () => void) {
    this.finalizers = [finalizer, ...this.finalizers];
  }

  isContained(element: IAdaptiveObject) {
    return this.#queue.contains(element);
  }

  /**
   * Gets the transaction currently running on this thread (if any)
   */
  static get running() {
    return Transaction.RunningTransaction;
  }

  /**
   * Sets the transaction currently running on this thread (if any)
   */
  static set running(transaction: Transaction | null) {
    Transaction.RunningTransaction = transaction;
  }

  /**
   * Gets the transaction currently being built on this thread (via transact (fun () -> ...))
   */
  static get current() {
    return Transaction.CurrentTransaction;
  }

  /**
   * Sets the transaction currently being built on this thread (via transact (fun () -> ...))
   */
  static set current(transaction: Transaction | null) {
    Transaction.CurrentTransaction = transaction;
  }

  /**
   * Indicates if inside a running Transaction
   */
  static get hasRunning() {
    return Transaction.RunningTransaction !== null;
  }

  /**
   * Gets the level of the currently running Transaction or
   * Int32.MaxValue when no Transaction is running
   * Port note: We use number.MAX_SAFE_INTEGER as this seems to be the highest number we shold use
   */
  static get runningLevel() {
    if (Transaction.RunningTransaction === null)
      return Number.MAX_SAFE_INTEGER - 1;

    return Transaction.RunningTransaction.#currentLevel;
  }

  /**
   * Gets the current Level the Transaction operates on
   */
  get currentLevel() {
    return this.#currentLevel;
  }

  /**
   * Enqueues an adaptive object for marking
   */
  enqueue(element: IAdaptiveObject) {
    // Enqueues a key value pair into the queue
    this.#queue.enqueue(element.level, element);
  }

  /**
   * Gets the current AdaptiveObject being marked
   */
  get currentAdaptiveObject() {
    return this.current;
  }

  /**
   * Performs the entire marking process, causing all affected objects to
   * be made consistent with the enqueued changes.
   */
  commit() {
    // cache the currently running transaction (if any)
    // and make ourselves current.
    const old = Transaction.RunningTransaction;
    Transaction.RunningTransaction = this;
    let outputCount = 0;

    while (!this.#queue.isEmpty) {
      const { level, element } = this.#queue.dequeue();
      this.current = element;
      this.#currentLevel = level;

      // since we're about to access the outOfDate flag
      // for this object we must acquire a lock here.
      // Note that the transaction will at most hold one
      // lock at a time.
      if (isOutOfDateCaller(element)) {
        element.allInputsProcessed(this);
        this.current = null;
        continue;
      }

      enterWrite(element);

      try {
        outputCount = 0;

        // if the element is already outOfDate we
        // do not traverse the graph further.
        if (element.isOutOfDate) {
          element.allInputsProcessed(this);
        } else {
          // if the object's level has changed since it
          // was added to the queue we re-enqueue it with the new level
          // Note that this may of course cause runtime overhead and
          // might even change the asymptotic runtime behaviour of the entire
          // system in the worst case but we opted for this approach since
          // it is relatively simple to implement.
          if (this.#currentLevel !== element.level) {
            this.#queue.enqueue(element.level, element);
          } else {
            // however if the level is consistent we may proceed
            // by marking the object as outOfDate
            element.isOutOfDate = true;
            element.allInputsProcessed(this);

            try {
              // here mark and the callbacks are allowed to evaluate
              // the adaptive object but must expect any call to AddOutput to
              // raise a LevelChangedException whenever a level has been changed
              if (element.mark()) {
                // if everything succeeded we return all current outputs
                // which will cause them to be enqueued
                outputCount = element.outputs.consume(this.outputs);
              } else {
                element.isOutOfDate = false;
              }
            } catch (error) {
              if (!(error instanceof LevelChangedError)) {
                // don't care. Doesn't this destroy the callstack?
                throw error;
              }

              // if the level was changed either by a callback
              // or Mark we re-enqueue the object with the new level and
              // mark it upToDate again (since it would otherwise not be processed again)
              element.level = Math.max(element.levem, error.newLevel);
              element.isOutOfDate = false;
              this.#queue.enqueue(element.level, element);
            }
          }
        }
      } finally {
        exitWrite(element);
      }

      // finally we enqueue all returned outputs
      const outputs = this.outputs;
      for (let index = 0; index < outputCount; index++) {
        const output = outputs[index];
        outputs[index] = null;

        if (output instanceof IndirectOutputObject) {
          const real = output.real.deref();
          if (real !== undefined) {
            real.inputChanged(this, output.decorator);
            this.enqueue(real);
          } else {
            output.release();
          }
        } else {
          output!.inputChanged(this, element);
          this.enqueue(output!);
        }
      }

      this.current = null;
    }

    // when the commit is over we restore the old
    // running transaction (if any)
    Transaction.RunningTransaction = old;
    this.#currentLevel = 0;
  }

  /**
   * Disposes the transaction running all of its "Finalizers"
   */
  dispose() {
    this.runFinalizers();
  }
}
