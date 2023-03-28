import { test, describe, expect } from "vitest";
import {
  ActiveSubscription,
  differentiate,
  DifferentiationResult,
  NewSubscription,
  Subscribe,
  Subscription,
  SubscriptionId,
  type StopFunction,
} from "../../src/elmish/subscription";

type SubscriptionContainer<TMessage> = {
  subscription: Subscribe<TMessage>;
  duplicate: Subscribe<TMessage>;
};

const stop: StopFunction = () => {};
const subscription: SubscriptionContainer<void> = {
  subscription: () => stop,
  duplicate: (_) => stop,
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
      start: whichSub,
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
  test("No changes when subscriptions and active subscriptions are the same", () => {
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
  test("Active subscriptions are stopped when not found in subscriptions", () => {
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
  test("Subscriptions are started when not found in active subscriptions", () => {
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
  test("Subscriptions are started and stopped when subscriptions has new ids and omits old ids", () => {
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
  test("Duplicate subscriptions are detected even when there is no changes", () => {
    // Arrange
    const activeSubscriptions = generateActive(0, 6, stop);
    const subscriptions = [
      generateNew(2, 2, subscription.duplicate),
      generateNew(2, 2, subscription.duplicate),
      generateNew(0, 6, subscription.subscription),
    ].flat();
    const expected = {
      duplicates: subscriptions.slice(0, 2),
      toStop: [],
      toKeep: activeSubscriptions,
      toStart: [],
    };

    // Act
    const actual = differentiate(activeSubscriptions, subscriptions);

    // Assert
    equals(expected, actual);
  });
  test("last dupe wins when starting new subs", () => {
    // Arrange
    const activeSubscriptions = [];
    const duplicateSubscriptionId = createNewId(2);
    const subscriptions = [
      generateNew(2, 2, subscription.duplicate),
      generateNew(2, 2, subscription.duplicate),
      generateNew(0, 6, subscription.subscription),
    ].flat();
    const expected = {
      duplicates: subscriptions.slice(0, 2),
      toStop: [],
      toKeep: activeSubscriptions,
      toStart: subscriptions.slice(2, 9),
    };

    // Act
    const actual = differentiate(activeSubscriptions, subscriptions);
    const { duplicates, toStart } = actual;
    const { id: startId, start: startDuplicate } = toStart[2];

    // Assert
    expect(
      duplicates.every(
        (id) => duplicateSubscriptionId.join() === id.join(),
        "Duplicates should have wrong id"
      )
    ).toBe(true);
    expect(startId.join(), "Started duplicate should have wrong id").toBe(
      duplicateSubscriptionId.join()
    );
    expect(startDuplicate, "Started duplicate should be the wrong one").toBe(
      subscription.subscription
    );
    expect(
      startDuplicate,
      "Started duplicate should be the wrong one"
    ).not.toBe(subscription.duplicate);

    equals(expected, actual);
  });
});
