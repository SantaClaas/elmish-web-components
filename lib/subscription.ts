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

export type SubscriptionId = string[];
/**
 * A function that creates a key for comparison from a value
 */
type ToKeyFunction<TValue, TKey> = (value: TValue) => TKey;
// We have the problem that fsharp compares by value mostly but JS doesn't in Set and others.
// We could:
// 1. Make subscription Id just a concatinated string instead of a string array which gets compared by reference
// 2. Implement our own set on top of set to concatinate subscription id arrays and then compare them. Downside is this creates overhead and we might need to add similiar measures elsewhere instead of relying on string comparison.
// I choose option 2 as I don't fully understand the repurcussions of deviating from the elmish standard wich uses string array as id
class ExtendedSet<TKey, TValue> {
  #internalSet: Set<TKey>;
  #toKey: ToKeyFunction<TValue, TKey>;
  constructor(toKey: ToKeyFunction<TValue, TKey>, ids: TValue[] = []) {
    this.#toKey = toKey;
    this.#internalSet = new Set(ids.map(toKey));
  }

  has(id: TValue) {
    const key = this.#toKey(id);
    return this.#internalSet.has(key);
  }

  add(id: TValue) {
    const key = this.#toKey(id);
    this.#internalSet.add(key);
    return this;
  }

  get size(): number {
    return this.#internalSet.size;
  }
}

function idToKey(value: SubscriptionId) {
  // Please note we can only convert from an id to a key, not reverse as the id consists of random strings that might contain the delimiter.
  // The delimiter is only for debugging purposes
  return value.join(" ");
}

/**
 * Describes a function to stop the subscription. This enables the subscription to shutdown gracefully and clean up.
 */
export type StopFunction = () => void;

export type Subscription = {
  id: SubscriptionId;
};
export type ActiveSubscription = Subscription & { stop: StopFunction };

/**
 * Describes a function that starts a subscription and generages new messages when runnning.
 * @returns a stop function to stop the subscription
 */
export type Subscribe<TMessage> = (
  dispatch: Dispatch<TMessage>
) => StopFunction;

export type NewSubscription<TMessage> = Subscription & {
  subscribe: Subscribe<TMessage>;
};

export const none: None = [];

type DifferentiateState<TMessage> = {
  duplicates: SubscriptionId[];
  newKeys: ExtendedSet<string, SubscriptionId>;
  newSubscriptions: NewSubscription<TMessage>[];
};
// I assume this is creating new values in the orginal too?...Omg yes it does because it is creating new lists because its functional and follows immutability 🤦
function initial<TMessage>(): DifferentiateState<TMessage> {
  return {
    duplicates: [],
    newKeys: new ExtendedSet(idToKey),
    newSubscriptions: [],
  };
}

function update<TMessage>(
  { duplicates, newKeys, newSubscriptions }: DifferentiateState<TMessage>,
  subscription: NewSubscription<TMessage>
): DifferentiateState<TMessage> {
  const { id } = subscription;
  if (newKeys.has(id)) {
    // It's a prepend and new list in the original and I'm careful
    return { duplicates: [id, ...duplicates], newKeys, newSubscriptions };
  }

  // Else
  return {
    duplicates: duplicates,
    newKeys: newKeys.add(id),
    newSubscriptions: [subscription, ...newSubscriptions],
  };
}

function findDuplicates<TMessage>(
  subscriptions: NewSubscription<TMessage>[]
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
      return [[...trueResults, value], falseResults];
    }

    // Else
    return [trueResults, [...falseResults, value]];
  }

  return values.reduce(reducer, [[], []]);
}

export type DifferentiationResult<TMessage> = {
  duplicates: SubscriptionId[];
  toStop: ActiveSubscription[];
  toKeep: ActiveSubscription[];
  toStart: NewSubscription<TMessage>[];
};

export function differentiate<TMessage>(
  activeSubscriptions: ActiveSubscription[],
  subscriptions: NewSubscription<TMessage>[]
): DifferentiationResult<TMessage> {
  const keys = activeSubscriptions.map(({ id }) => id);
  const { duplicates, newKeys, newSubscriptions } =
    findDuplicates(subscriptions);
  // If keys "set" and new keys set are equal
  if (keys.length === newKeys.size && keys.every((key) => newKeys.has(key))) {
    return {
      duplicates,
      toStop: [],
      toKeep: activeSubscriptions,
      toStart: [],
    };
  }

  // Else
  const [toKeep, toStop] = partition(
    ({ id }: ActiveSubscription) => newKeys.has(id),
    activeSubscriptions
  );

  const keysSet = new ExtendedSet(idToKey, keys);
  const isStarted = ({ id }: NewSubscription<TMessage>) => !keysSet.has(id);
  const toStart = newSubscriptions.filter(isStarted);
  return { duplicates, toStop, toKeep, toStart };
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
  { duplicates, toStop, toKeep, toStart }: DifferentiationResult<TMessage>
): ActiveSubscription[] {
  duplicates.forEach((duplicates) => warnDupe(onError, duplicates));
  stopSubscriptions(onError, toStop);

  const started: ActiveSubscription[] = choose(
    (subscription) => tryStart(onError, dispatch, subscription),
    toStart
  );

  return [...toKeep, ...started];
}

function tryStart<TMessage>(
  onError: HandleErrorFunction,
  dispatch: Dispatch<TMessage>,
  subscription: NewSubscription<TMessage>
): ActiveSubscription | false {
  const { id, subscribe: start } = subscription;
  try {
    return { id, stop: start(dispatch) };
  } catch (error) {
    onError(`Error starting subscription: ${toString(id)}`, error);
    return false;
  }
}

function tryStop(
  onError: HandleErrorFunction,
  { id: subscriptionId, stop: stopSubscription }: ActiveSubscription
) {
  try {
    stopSubscription();
  } catch (error) {
    onError(`Error stopping subscription: ${subscriptionId}`, error);
  }
}

export function stopSubscriptions(
  onError: HandleErrorFunction,
  subscriptions: ActiveSubscription[]
) {
  subscriptions.forEach((subscription) => tryStop(onError, subscription));
}

export function batch<TMessage>(
  commands: Iterable<NewSubscription<TMessage>>
): NewSubscription<TMessage>[] {
  return Array.from(commands).flat();
}
