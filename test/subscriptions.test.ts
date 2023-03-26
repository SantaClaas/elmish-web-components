import { test, describe, expect } from "vitest";
import { batch } from "../lib/command";
import {
  ActiveSubscription,
  differentiate,
  DifferentiationResult,
  NewSubscription,
  Subscribe,
  Subscription,
  SubscriptionId,
  type StopFunction,
} from "../lib/subscription";

type SubscriptionContainer<TMessage> = {
  subscription: Subscribe<TMessage>;
  dupe: Subscribe<TMessage>;
};

const stop: StopFunction = () => {};
const subscription: SubscriptionContainer<void> = {
  subscription: () => stop,
  dupe: (_) => stop,
};

function createNewId(index: number) {
  return ["subscription", index.toString()];
}

function generateActive(
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

function generateNew(
  idRangeStart: number,
  idRangeEnd: number,
  whichSub: Subscribe<void>
): NewSubscription<void>[] {
  const count = idRangeEnd + 1 - idRangeStart;
  return [...Array(count)].map(
    (_, index): NewSubscription<void> => ({
      id: createNewId(idRangeStart + index),
      subscribe: whichSub,
    })
  );
}

// Helper functions

function toKeys(subscriptions: Subscription[]): SubscriptionId[] {
  return subscriptions.map(({ id }) => id);
}

type ResultToCompare = {
  duplicates: SubscriptionId[];
  toStop: SubscriptionId[];
  toKeep: SubscriptionId[];
  toStart: SubscriptionId[];
};
function toIds({
  duplicates,
  toStop,
  toKeep,
  toStart,
}: DifferentiationResult<unknown>): ResultToCompare {
  return {
    duplicates,
    toStop: toKeys(toStop),
    toKeep: toKeys(toKeep),
    toStart: toKeys(toStart),
  };
}

function toIds2({ duplicates, toStop, toKeep, toStart }): ResultToCompare {
  return {
    duplicates: toKeys(duplicates),
    toStop: toKeys(toStop),
    toKeep: toKeys(toKeep),
    toStart: toKeys(toStart),
  };
}

function equals(expected, actual) {
  const idsExpected = toIds2(expected);
  const idsActual = toIds(actual);

  expect(idsExpected).toStrictEqual(idsActual);
}

describe("Differentiation behavior", () => {
  // Port these tests from elmish
  test("no changes when subs and active subs are the same", () => {
    // Arrange
    const activeSubscriptions = generateActive(0, 6, stop);
    const subscriptions = generateNew(0, 6, subscription.subscription);
    const expected: DifferentiationResult<void> = {
      duplicates: [],
      toStop: [],
      toKeep: activeSubscriptions,
      toStart: [],
    };

    // Act
    const actual = differentiate(activeSubscriptions, subscriptions);

    // Assert
    equals(expected, actual);
  });
  test("active subs are stopped when not found in subs", () => {
    // Arrange
    const activeSubscriptions = generateActive(0, 6, stop);
    const subscriptions = generateNew(3, 6, subscription.subscription);
    const expected: DifferentiationResult<void> = {
      duplicates: [],
      toStop: activeSubscriptions.slice(0, 3),
      toKeep: activeSubscriptions.slice(3, 7),
      toStart: [],
    };

    // Act
    const actual = differentiate(activeSubscriptions, subscriptions);

    // Assert
    equals(expected, actual);
  });
  test("subs are started when not found in active subs", () => {
    // Arrange
    const activeSubscriptions = generateActive(0, 2, stop);
    const subscriptions = generateNew(0, 6, subscription.subscription);
    const expected: DifferentiationResult<void> = {
      duplicates: [],
      toStop: [],
      toKeep: activeSubscriptions,
      toStart: subscriptions.slice(3, 7),
    };

    // Act
    const actual = differentiate(activeSubscriptions, subscriptions);

    // Assert
    equals(expected, actual);
  });
  test("subs are started and stopped when subs has new ids and omits old ids", () => {
    // Arrange
    const activeSubscriptions = generateActive(0, 6, stop);
    const temporary = generateNew(0, 9, subscription.subscription);
    const subscriptions = temporary.slice(3, 10);
    const expected: DifferentiationResult<void> = {
      duplicates: [],
      toStop: activeSubscriptions.slice(0, 3),
      toKeep: activeSubscriptions.slice(3, 7),
      toStart: temporary.slice(7, 10),
    };

    // Act
    const actual = differentiate(activeSubscriptions, subscriptions);

    // Assert
    equals(expected, actual);
  });
  test("dupe subs are detected even when there are no changes", () => {
    // Arrange
    const activeSubscriptions = generateActive(0, 6, stop);

    const temporary = generateNew(0, 9, subscription.subscription);
    const subscriptions = temporary.slice(3, 10);
    const expected: DifferentiationResult<void> = {
      duplicates: [],
      toStop: activeSubscriptions.slice(0, 3),
      toKeep: activeSubscriptions.slice(3, 7),
      toStart: temporary.slice(7, 10),
    };

    // Act
    const actual = differentiate(activeSubscriptions, subscriptions);

    // Assert
    equals(expected, actual);
  });
  test.todo("last dupe wins when starting new subs");
});
