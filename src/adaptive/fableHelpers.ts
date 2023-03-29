// Helpers written in the original for fable but ported for completeness

import { ByReference } from "./byReference";

// Variable names changed for clarity to help me understand the code
export function resizeArray<T>(array: ByReference<T[]>, targetLength: number) {
  const length = array.value.length;

  if (length === targetLength) {
    return;
  }

  if (targetLength < length) {
    array.value = array.value.slice(0, targetLength);
    return;
  }

  // Else targetLength > length
  const result = [...array.value, ...Array(targetLength - length).fill(null)];
  array.value = result;
}
