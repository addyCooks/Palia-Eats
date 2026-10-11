// Tests for the support links (lib/utils/support.ts): the support phone number must never end up in a
// page, and links that anyone can craft must not be able to inject odd text into a message.
import assert from "node:assert/strict";
import { test } from "node:test";

delete process.env.SUPPORT_PHONE;
delete process.env.NEXT_PUBLIC_SUPPORT_HOURS;
delete process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
const { supportLinks, whatsappTarget, cleanName, SUPPORT_EMAIL, SUPPORT_HOURS } = await import("../lib/utils/support.ts");

test("with no number set only email shows and the redirect has nowhere to go", () => {
  delete process.env.SUPPORT_PHONE;
  const s = supportLinks({ orderNumber: 1058, restaurantName: "Brown Pizza" });
  assert.equal(SUPPORT_EMAIL, "paliaeats@gmail.com");
  assert.equal(SUPPORT_HOURS, "10 AM to 10 PM");
  assert.equal(s.whatsappHref, null);
  assert.equal(s.hours, "10 AM to 10 PM");
  assert.ok(decodeURIComponent(s.emailHref).includes("Help with order #1058 from Brown Pizza"));
  assert.equal(whatsappTarget(new URLSearchParams()), null);
});

test("the page link is our own address and never contains the number", () => {
  for (const raw of ["8318634088", "+91 83186-34088", "08318634088", "918318634088"]) {
    process.env.SUPPORT_PHONE = raw;
    const s = supportLinks({ orderNumber: 7, restaurantName: "Blue Cafe" });
    assert.ok(s.whatsappHref!.startsWith("/support/whatsapp?"), raw);
    assert.ok(!s.whatsappHref!.includes("8318634088"), "the number must not be in the page link");
    assert.ok(!s.emailHref.includes("8318634088"), "nor in the email link");
    const url = whatsappTarget(new URL("http://x" + s.whatsappHref!).searchParams);
    assert.ok(url!.startsWith("https://wa.me/918318634088?text="), raw);
    assert.equal(decodeURIComponent(url!.split("text=")[1]), "Hi PaliaEats, I need help with order #7 from Blue Cafe.");
  }
});

test("rubbish in the setting is ignored", () => {
  for (const raw of ["abc", "12345", ""]) {
    process.env.SUPPORT_PHONE = raw;
    assert.equal(supportLinks().whatsappHref, null, raw);
    assert.equal(whatsappTarget(new URLSearchParams()), null, raw);
  }
});

test("crafted links only get a clean order number and a plain name through", () => {
  process.env.SUPPORT_PHONE = "8318634088";
  const hostile = whatsappTarget(
    new URLSearchParams({ order: "1058; DROP", restaurant: "<script>alert(1)</script> Evil\nName http://phish.example" }),
  )!;
  const message = decodeURIComponent(hostile.split("text=")[1]);
  assert.ok(!message.includes("<") && !message.includes(">") && !message.includes("\n"), message);
  assert.ok(!message.includes("#"), "a bad order number is ignored: " + message);
  assert.equal(whatsappTarget(new URLSearchParams({ order: "-5" }))!.includes("%23"), false);
  assert.equal(cleanName("  Shahi   Rasoi & Sons's  "), "Shahi Rasoi & Sons's");
  assert.equal(cleanName("x".repeat(200)).length, 50);
});

test("restaurants asking about the panel, and a plain 'need help'", () => {
  process.env.SUPPORT_PHONE = "8318634088";
  const panel = whatsappTarget(new URLSearchParams({ for: "panel", restaurant: "Brown Pizza" }))!;
  assert.equal(decodeURIComponent(panel.split("text=")[1]), "Hi PaliaEats, I'm from Brown Pizza and I need help with my restaurant panel.");
  const plain = whatsappTarget(new URLSearchParams())!;
  assert.equal(decodeURIComponent(plain.split("text=")[1]), "Hi PaliaEats, I need some help.");
  const link = supportLinks({ panel: true, restaurantName: "Brown Pizza" });
  assert.ok(link.whatsappHref!.startsWith("/support/whatsapp?for=panel"));
  assert.ok(decodeURIComponent(link.emailHref).includes("Restaurant panel help: Brown Pizza"));
});
