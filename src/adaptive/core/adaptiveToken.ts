import { IAdaptiveObject } from "./core";

/**
 * The concept of a cancellation token does not seem to really exist in JS
 * but if needed this will be the rough concept
 */
interface ICancellationToken {}
/**
 * AdaptiveToken represents a token that can be passed to
 * inner AdaptiveObjects for evaluation.
 * when passing an AdaptiveToken to the evaluation-function of
 * a cell the system will create a dependency edge internally and
 * future marking of the inner cell will also cause the calling cell to
 * be marked.
 */
export class AdaptiveToken {
  /**
   * The (optional) caller for the AdaptiveToken.
   * Represents the calling IAdaptiveObject or null if none.
   * Note, this is only mutable because that exposes the underlying field
   * for (reportedly) more performant access.
   * @internal
   */
  caller: IAdaptiveObject | null = null;

  constructor(caller: IAdaptiveObject | null) {
    this.caller = caller;
  }

  /**
   * Creates a new AdaptiveToken with the given caller.
   */
  withCaller(caller: IAdaptiveObject) {
    return new AdaptiveToken(caller);
  }

  /**
   * Creates a new AdaptiveToken with the given CancellationToken.
   */
  withCancellationToken(_: ICancellationToken) {
    // The original source code does not do anything with the cancellation token. Probably only there to be inherited?
    return new AdaptiveToken(this.caller);
  }

  /**
   * The top-level AdaptiveToken without a calling IAdaptiveObject.
   */
  static readonly top = new AdaptiveToken(null);

  /**
   * Creates a top-level AdaptiveToken with the given CancellationToken.
   */
  static CreateCancelable(_: ICancellationToken) {
    // The original source code does not do anything with the cancellation token. Probably only there to be inherited?
    return new AdaptiveToken(null);
  }
}
