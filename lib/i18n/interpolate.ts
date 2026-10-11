// Pure (no imports) so it can be tested on its own.

// "Order #{n} from {name}" + { n: 1058, name: "Brown Pizza" } -> "Order #1058 from Brown Pizza".
// A {placeholder} with no value is left as it is, so a mistake is visible instead of silent.
export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}
