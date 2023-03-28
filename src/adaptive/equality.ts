// We don't have control over equality comparison in JS so this is kind of a joke
export type ReferenceHashSet<T> = Set<T>;
export function createReferenceHashSet<T>(
  elments?: Iterable<T>
): ReferenceHashSet<T> {
  return new Set<T>(elments);
}
