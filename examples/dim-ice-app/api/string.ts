// Different alias types for string because strings often represent different things or objects and have a lot of
// different meanings that get lost without typing. As usual with TypeScript, these types don't guarantee that they are
// in the promised format during runtime

/**
 * A string very likely in the URI format but not guaranteed. Not to be confused with UrlString.
 */
export type UriString = string;

/**
 * A string very likely in the URL format but not guaranteed. Not to be confused with UriString.
 */
export type UrlString = string;

/**
 * Represents a string that contains HTML but is not checked against XSS attacks or other malicious content
 */
export type UnsafeHtmlString = string;

/**
 * Represents a unix timestamp as string but not guaranteed
 */
export type UnixTimestampString = string;

/**
 * Represents a number that is actuallly a string but not guaranteed
 */
export type NumberString = string;
