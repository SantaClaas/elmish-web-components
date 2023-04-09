// This type definition isn't strictly necessary but I wanted to play with TypeScript Template Literal Types
// https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html
// Most of this is from https://gist.github.com/MrChocolatine/367fb2a35d02f6175cc8ccb3d3a20054 through
// https://stackoverflow.com/a/74070128
// Limitations:
//  * Number is not limited to integers and allows floating point and/or negative numbers.
//    You could use something like this: type Digit = `0` | `1` | `2` | `3` | `4` | `5` | `6` | `7` | `8` | `9` | `0`;
//    But that makes the type definition too complex for TypeScript to handle so it gives you an error
//  * This does not provide runtime checks, but that should be a given in TypeScript

// In TS, interfaces are "open" and can be extended
export interface Date {
  /**
   * Give a more precise return type to the method `toISOString()`:
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
   */
  toISOString(): Iso8601DateTime;
}

type Year = `${number}${number}${number}${number}`;
type Month = `${number}${number}`;
type Day = `${number}${number}`;
type Hours = `${number}${number}`;
type Minutes = `${number}${number}`;
type Seconds = `${number}${number}`;
type Milliseconds = `${number}${number}`;
/**
 * Represent a string like `2021-01-08`
 */
type Iso8601Date = `${Year}-${Month}-${Day}`;
/**
 * Represent a string like `14:42:34.678`
 */
type Iso8601Time = `${Hours}:${Minutes}:${Seconds}.${Milliseconds}`;

/**
 * Represent a string like `2021-01-08T14:42:34.678Z` (format: ISO 8601).
 *
 * It is not possible to type more precisely (list every possible values for months, hours etc) as
 * it would result in a warning from TypeScript:
 *   "Expression produces a union type that is too complex to represent. ts(2590)
 */
type Iso8601DateTime = `${Iso8601Date}T${Iso8601Time}Z`;
export default Iso8601DateTime;
