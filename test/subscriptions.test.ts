import { test, describe } from "vitest";

describe("Differentiation behavior", () => {
  // Port these tests from elmish
  test.todo("no changes when subs and active subs are the same");
  test.todo("active subs are stopped when not found in subs");
  test.todo("subs are started when not found in active subs");
  test.todo(
    "subs are started and stopped when subs has new ids and omits old ids"
  );
  test.todo("dupe subs are detected even when there are no changes");
  test.todo("last dupe wins when starting new subs");
});
