import { startVitest } from "vitest/node";
// A script to run tests with garbage collection
process.env.NODE_ENV = "test";
console.log(process.env);
console.log("Starting vitest");
const vitest = await startVitest(
  "test",
  ["test/adaptive/weakOutputSet.test.ts"],
  {
    globals: true,
    // watch: true,
  }
);

global.gc();
console.log("Waiting for vitest to close");
await vitest?.close();
console.log("Vitest closed");
