// For updates outside of our control
//TODO do attribute subscriptions here
//TODO web component lifecyle here
/**
 * Most of the messages (changes in the state) will originate within your code, but some will come from the outside, for example from a timer or a websocket. These sources can be tapped into with subscriptions, defined as F# functions that can dispatch new messages as they happen.
 * From https://elmish.github.io/elmish/#subscriptions
 */

import { Dispatch } from "./dispatch";

export type None = [];

export type SubscriptionId = Array<string>;

/**
 * Describes a function to stop the subscription. This enables the subscription to shutdown gracefully and clean up.
 */
export type StopFunction = () => void;

/**
 * Describes a function that starts a subscription and generages new messages when runnning.
 * @returns a stop function to stop the subscription
 */
export type Subscribe<TMessage> = (
  dispatch: Dispatch<TMessage>
) => StopFunction;

export type Subscription<TMessage> =
  | Array<[SubscriptionId, Subscribe<TMessage>]>
  | None;

export const none: None = [];
