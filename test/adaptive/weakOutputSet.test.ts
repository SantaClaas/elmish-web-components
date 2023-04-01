// @vitest-environment node
import { expect, test, describe } from "vitest";
import { IAdaptiveObject, WeakOutputSet } from "../../src/adaptive/core/core";
import { AdaptiveObject } from "../../src/adaptive/core/adaptiveObject";
import { ByReference, toReference } from "../../src/adaptive/byReference";

class NonEqualObject extends AdaptiveObject {}

const relevantSizes = [0, 1, 2, 4, 8, 9, 20];
// Rewrote test to accomodate different test framework and follor Arrange, Act, Assert
// Split test to separate consume and add function test which was tested together probably to not repeat adding

describe("WeakOutputSet", () => {
  test.each(relevantSizes)("can add with size: %i", (size) => {
    // Arrange
    const many = Array.from(Array(size), () => new NonEqualObject());
    const expectedAddResults = Array.from(Array(size), () => true);

    // Act
    const set = new WeakOutputSet();
    const addResults = many.map((man) => set.add(man));

    // Assert
    expect(addResults).toStrictEqual(expectedAddResults);
  });

  // Kind of depends on add to function
  test.each(relevantSizes)("can consume with size: %i", (size) => {
    // Arrange
    const many = Array.from(Array(size), () => new NonEqualObject());

    // Act
    const set = new WeakOutputSet();
    many.forEach((man) => set.add(man));
    const array: ByReference<Array<IAdaptiveObject>> = {
      // Null cheating, I know
      value: Array.from(Array(size), () => null!),
    };

    const count = set.consume(array);

    // Assert
    expect(count).toBe(many.length);

    for (let index = 0; index < count; index++) {
      const value = array.value[index];
      expect(many.some((object) => object === value)).toBe(true);
    }
  });

  test.each(relevantSizes)("can remove with size: %i", (size) => {
    // Arrange
    const many = Array.from(Array(size), () => new NonEqualObject());
    const expectedResults = Array.from(Array(size), () => true);

    // Act
    const set = new WeakOutputSet();
    const addResults = many.map((man) => set.add(man));
    const removeResults = many.map((man) => set.remove(man));

    // Assert
    expect(addResults).toStrictEqual(expectedResults);
    expect(removeResults).toStrictEqual(expectedResults);
  });

  //TODO find way to test weak nature. Can't rely on garbage collection
  // We might want to copy the original version and use JS Weak datastructures
  // We should also implement benchmarks to find out if there is actually a difference
  // This test is not very reliable as it depends on the GC system being exposed during testing
  // It won't be exposed in browsers where the code will likely run (AFAIK)
  // Additionally this test should not rely on GC since that is out of our control
  //   test.skipIf(!("gc" in global)).each(relevantSizes)(
  //     "should be actually weak with size: %i",
  //     async (size) => {
  //       // Arrange
  //       // Add dead as in add dead objects?
  //       const set = new WeakOutputSet();
  //       // function addDead() {
  //       //   Array.from(Array(size), () => new NonEqualObject()).forEach(set.add);
  //       // }

  //       let resulve;
  //       let registry;
  //       let promise;
  //       if (size) {
  //         promise = new Promise((resolve) => (resulve = resolve));
  //         registry = new FinalizationRegistry((key) => {
  //           console.log("uhu", key);
  //           resulve();
  //         });
  //       }

  //       function addDead() {
  //         const many = Array.from(Array(size), () => new NonEqualObject());
  //         for (const element of many) {
  //           set.add(element);
  //           if (size) registry.register(element, "dub");
  //         }
  //       }

  //       // Act
  //       addDead();
  //       // global.gc!();
  //       if (size) await promise;

  //       const array: ByReference<Array<IAdaptiveObject>> = {
  //         // Null cheating, I know
  //         value: Array(8).fill(undefined),
  //       };

  //       const count = set.consume(array);

  //       // Assert
  //       const expected = toReference(Array(8).fill(undefined));
  //       expect(array).toStrictEqual(expected);
  //       expect(count).toBe(0);
  //     }
  //   );
});
