import { expect, test } from "vitest";
import { IAdaptiveObject, WeakOutputSet } from "../../src/adaptive/core/core";
import { AdaptiveObject } from "../../src/adaptive/core/adaptiveObject";
import { ByReference } from "../../src/adaptive/byReference";
const gc = require("expose-gc/function");

class NonEqualObject extends AdaptiveObject {}

const relevantSizes = [0, 1, 2, 4, 8, 9, 20];
// Rewrote test to accomodate different test framework and follor Arrange, Act, Assert
// Split test to separate consume and add function test which was tested together probably to not repeat adding
test("[WeakOutputset] add", () => {
  relevantSizes.forEach((size) => {
    // Arrange
    const many = Array.from(Array(size), () => new NonEqualObject());
    const expectedAddResults = Array.from(Array(size), () => true);

    // Act
    const set = new WeakOutputSet();
    const addResults = many.map((man) => set.add(man));

    // Assert
    expect(addResults).toStrictEqual(expectedAddResults);
  });
});

// Kind of depends on add to function
test("[WeakOutputSet] consume", () => {
  relevantSizes.forEach((size) => {
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
});

test("[WeakOutputSet] remove", () => {
  relevantSizes.forEach((size) => {
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
});

//TODO our JS version of the set does not actually use any weak references.
// We might want to copy the original version and use JS Weak datastructures
// We should also implement benchmarks to find out if there is actually a difference
// This test is not very reliable as it depends on the GC system being exposed during testing
// It won't be exposed in browsers where the code will likely run (AFAIK)
// Additionally this test should not rely on GC since that is out of our control
test("[WeakOutputSet] actually weak", () => {
  relevantSizes.forEach((size) => {
    // Arrange
    // Add dead as in add dead objects?
    const set = new WeakOutputSet();
    // function addDead() {
    //   Array.from(Array(size), () => new NonEqualObject()).forEach(set.add);
    // }
    function addDead() {
      const many = Array.from(Array(size), () => new NonEqualObject());
      for (const element of many) {
        set.add(element);
      }
    }

    // Act
    addDead();
    gc();

    const array: ByReference<Array<IAdaptiveObject>> = {
      // Null cheating, I know
      value: Array.from(Array(8), () => null!),
    };

    const count = set.consume(array);

    // Assert
    expect(count).toBe(0);
  });
});
