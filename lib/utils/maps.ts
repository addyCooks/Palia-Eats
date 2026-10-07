// A link that opens a location pin in Google Maps (app on phones, website elsewhere).
export function mapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

// The pin saved with an order's address, if the customer shared one.
export function addressPin(address: { lat?: number | null; lng?: number | null }): { lat: number; lng: number } | null {
  return typeof address.lat === "number" && typeof address.lng === "number" ? { lat: address.lat, lng: address.lng } : null;
}
