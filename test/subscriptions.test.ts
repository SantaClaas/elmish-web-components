import { test, describe, expect } from "vitest";
import {
  ActiveSubscription,
  differentiate,
  DifferentiationResult,
  NewSubscription,
  Subscribe,
  Subscription,
  type StopFunction,
} from "../lib/subscription";

type SubscriptionContainer<TMessage> = {
  subscription: Subscribe<TMessage>;
  dupe: Subscribe<TMessage>;
};

const stop: StopFunction = () => {};
const subscription: SubscriptionContainer<unknown> = {
  subscription: (_) => stop,
  dupe: (_) => stop,
};

function createNewId(index: number) {
  return ["subscription", index.toString()];
}

function generate(
  idRangeStart: number,
  idRangeEnd: number,
  stop: StopFunction
) {
  const count = idRangeEnd + 1 - idRangeStart;
  return [...Array(count)].map(
    (_, index): ActiveSubscription => ({
      id: createNewId(idRangeStart + index),
      stop,
    })
  );
}

function generateSubscription(
  idRangeStart: number,
  idRangeEnd: number,
  whichSub: Subscribe<unknown>
): NewSubscription<unknown>[] {
  const count = idRangeEnd + 1 - idRangeStart;
  return [...Array(count)].map(
    (_, index): NewSubscription<unknown> => ({
      id: createNewId(idRangeStart + index),
      subscribe: whichSub,
    })
  );
}

// Helper functions

function toKeys(subscriptions: Subscription[]) {
  return subscriptions.map(({ id }) => id);
}

function toIds({
  dupes,
  toStop,
  toKeep,
  toStart,
}: DifferentiationResult<unknown>) {
  return {
    dupes,
    toStop: toKeys(toStop),
    toKeep: toKeys(toKeep),
    toStart: toKeys(toStart),
  };
}

// Dupes is a tuple here
function toIds2({ dupes, toStop, toKeep, toStart }) {
  return {
    dupes: toKeys(dupes),
    toStop: toKeys(toStop),
    toKeep: toKeys(toKeep),
    toStart: toKeys(toStart),
  };
}

const run = differentiate;

function equals(expected, actual) {
  const idsExpected = toIds2(expected);
  const idsActual = toIds(actual);

  expect(idsExpected).toStrictEqual(idsActual);
}

describe("Differentiation behavior", () => {
  // Port these tests from elmish
  test("no changes when subs and active subs are the same", () => {
    const activeSubscriptions = generate(0, 6, stop);
    const subscriptions = generateSubscription(0, 6, subscription.subscription);
    const expected: DifferentiationResult<unknown> = {
      dupes: [],
      toStop: [],
      toKeep: activeSubscriptions,
      toStart: [],
    };
    const actual = run(activeSubscriptions, subscriptions);
    equals(expected, actual);
  });
  test.todo("active subs are stopped when not found in subs");
  test.todo("subs are started when not found in active subs");
  test.todo(
    "subs are started and stopped when subs has new ids and omits old ids"
  );
  test.todo("dupe subs are detected even when there are no changes");
  test.todo("last dupe wins when starting new subs");
});
