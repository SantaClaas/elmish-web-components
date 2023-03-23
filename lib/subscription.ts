// For updates outside of our control
//TODO do attribute subscriptions here
//TODO web component lifecyle here
/**
 * Most of the messages (changes in the state) will originate within your code, but some will come from the outside, for example from a timer or a websocket. These sources can be tapped into with subscriptions, defined as F# functions that can dispatch new messages as they happen.
 * From https://elmish.github.io/elmish/#subscriptions
 */

import { Dispatch } from "./command";
import { HandleErrorFunction } from "./error";

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

export type Subscription<TMessage> = [SubscriptionId, Subscribe<TMessage>];

//TODO remove this type definition and replace it with the array
export type Subscriptions<TMessage> = Array<Subscription<TMessage>>;

export const none: None = [];

type DifferentiateState<TMessage> = [
  dupes: Array<SubscriptionId>,
  newKeys: Set<SubscriptionId>,
  newSubscriptions: Array<Subscription<TMessage>>
];
// I assume this is creating new values in the orginal too?...Omg yes it does because it is creating new lists because its functional and follows immutability 🤦
function initial<TMessage>(): DifferentiateState<TMessage> {
  return [new Array(), new Set(), new Array()];
}

function update<TMessage>(
  [dupes, newKeys, newSubscriptions]: DifferentiateState<TMessage>,
  subscription: Subscription<TMessage>
): DifferentiateState<TMessage> {
  //TODO replace with object notation
  const [id] = subscription;
  if (newKeys.has(id)) {
    // It's a prepend and new list in the original and I'm careful
    return [[id, ...dupes], newKeys, newSubscriptions];
  }

  // Else
  return [dupes, newKeys.add(id), [subscription, ...newSubscriptions]];
}

function calculateNewSubscriptions<TMessage>(
  subscriptions: Subscriptions<TMessage>
): DifferentiateState<TMessage> {
  // This calculates the difference?
  return subscriptions.reduceRight(update, initial());
}

/**
 * Partiations an array into two arrays based on a predicate
 */
function partition<TValue>(
  predicate: (value: TValue) => boolean,
  values: Array<TValue>
) {
  function reducer(
    [trueResults, falseResults]: [TValue[], TValue[]],
    value: TValue
  ): [TValue[], TValue[]] {
    if (predicate(value)) {
      return [[value, ...trueResults], falseResults];
    }

    // Else
    return [trueResults, [value, ...falseResults]];
  }

  return values.reduce(reducer, [[], []]);
}

export type DifferentiationResult<TMessage> = [
  dupes: SubscriptionId[],
  toStop: [SubscriptionId, StopFunction][],
  toKeep: [SubscriptionId, StopFunction][],
  toStart: Subscription<TMessage>[]
];

export function differentiate<TMessage>(
  activeSubscriptions: Array<[SubscriptionId, StopFunction]>,
  subscriptions: Subscriptions<TMessage>
): DifferentiationResult<TMessage> {
  const keys = activeSubscriptions.map(([id]) => id);
  const [dupes, newKeys, newSubscriptions] =
    calculateNewSubscriptions(subscriptions);

  // If keys "set" and new keys set are equal
  if (keys.every((key) => newKeys.has(key))) {
    return [dupes, [], activeSubscriptions, []];
  }

  // Else
  const [toKeep, toStop] = partition(
    ([id]: [SubscriptionId, StopFunction]) => newKeys.has(id),
    activeSubscriptions
  );

  const keysSet = new Set(keys);
  const hasStarted = ([id]: Subscription<TMessage>) => !keysSet.has(id);
  const toStart = newSubscriptions.filter(hasStarted);
  return [dupes, toStop, toKeep, toStart];
}

function toString(subscriptionId: SubscriptionId) {
  return subscriptionId.join("/");
}

function warnDupe(
  onError: HandleErrorFunction,
  subscriptionId: SubscriptionId
) {
  const error = Error("Duplicate subscription id");
  onError(`Duplicate subscription id: ${toString(subscriptionId)}`, error);
}

function choose<TValue, TResult>(
  predicate: (value: TValue) => TResult | false,
  array: TValue[]
): TResult[] {
  const results: TResult[] = [];
  array.map(predicate).forEach((v) => {
    if (v === false) return;

    results.push(v);
  });

  return results;
}
export function change<TMessage>(
  onError: HandleErrorFunction,
  dispatch: Dispatch<TMessage>,
  [dupes, toStop, toKeep, toStart]: DifferentiationResult<TMessage>
): [SubscriptionId, StopFunction][] {
  dupes.forEach((dupe) => warnDupe(onError, dupe));
  stopSubscriptions(onError, toStop);

  const started: [SubscriptionId, StopFunction][] = choose(
    (subscription) => tryStart(onError, dispatch, subscription),
    toStart
  );

  return [...toKeep, ...started];
}

function tryStart<TMessage>(
  onError: HandleErrorFunction,
  dispatch: Dispatch<TMessage>,
  subscription: Subscription<TMessage>
): [SubscriptionId, StopFunction] | false {
  const [id, start] = subscription;
  try {
    return [id, start(dispatch)];
  } catch (error) {
    onError(`Error starting subscription: ${toString(id)}`, error);
    return false;
  }
}

function tryStop(
  onError: HandleErrorFunction,
  [subscriptionId, stopSubscription]: [SubscriptionId, StopFunction]
) {
  try {
    stopSubscription();
  } catch (error) {
    onError(`Error stopping subscription: ${subscriptionId}`, error);
  }
}

export function stopSubscriptions(
  onError: HandleErrorFunction,
  subscriptions: Array<[SubscriptionId, StopFunction]>
) {
  subscriptions.forEach((subscription) => tryStop(onError, subscription));
}
