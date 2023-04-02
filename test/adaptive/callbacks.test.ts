import { describe, test } from "vitest";
import { cval } from "../../src/adaptive/adaptiveValue/adaptiveValue";
describe("MarkingCallback", () => {
  test("fired", () => {
    const m = cval(10);
    const d = m.map((value) => value);

    let fired = 0;
    function callback() {
      // We run on a single thread, don't need interlocked
      fired++;
    }

    function wasFired() {
      const old = fired;
      fired = 0;
      return old;
    }
  });
});
