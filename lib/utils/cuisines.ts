// Cuisines across a set of restaurants, most common first (ties in A–Z order).
export function cuisinesByCount(tagLists: string[][]): string[] {
  const counts = new Map<string, number>();
  for (const tags of tagLists) for (const tag of tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([tag]) => tag);
}
