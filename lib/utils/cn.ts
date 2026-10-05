// Tiny helper to join conditional class names (a mini "clsx").
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
