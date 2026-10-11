// Colour maths for readable text. Pure (no imports) so it can be tested on its own.

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

// How bright a #rrggbb colour looks to the eye, 0 (black) to 1 (white).
export function luminance(hex: string): number {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return 0;
  const n = parseInt(match[1], 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

// The WCAG contrast ratio between two colours (1 = identical, 21 = black on white). Text needs 4.5.
export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

// A restaurant picks its own brand colour. On the website's dark chips (selected category,
// selected plate size) the brand colour is used for the text when it is readable there, otherwise
// the text turns white. The chips are #16120d in light mode and #2a241c in dark mode.
export function readableOnDeep(brand: string): string {
  const readable = contrast(brand, "#16120d") >= 4.5 && contrast(brand, "#2a241c") >= 4.5;
  return readable ? brand : "#ffffff";
}
