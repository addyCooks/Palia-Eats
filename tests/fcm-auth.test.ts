// Tests for the Firebase service-account login (lib/push/fcm-auth.ts): reading the key file and
// building the signed note Google exchanges for an access token.
import assert from "node:assert/strict";
import { createPublicKey, createVerify, generateKeyPairSync } from "node:crypto";
import { test } from "node:test";
import { buildServiceAccountJwt, FCM_SCOPE, GOOGLE_TOKEN_URL, parseServiceAccount } from "../lib/push/fcm-auth.ts";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

const keyFile = JSON.stringify({
  type: "service_account",
  project_id: "palia-eats",
  client_email: "firebase-adminsdk-test@palia-eats.iam.gserviceaccount.com",
  private_key: privateKey,
});

test("reads the key file as JSON text, as base64, and with escaped line breaks", () => {
  const plain = parseServiceAccount(keyFile);
  assert.equal(plain?.projectId, "palia-eats");
  assert.equal(plain?.clientEmail, "firebase-adminsdk-test@palia-eats.iam.gserviceaccount.com");
  assert.ok(plain?.privateKey.includes("BEGIN PRIVATE KEY"));

  const encoded = parseServiceAccount(Buffer.from(keyFile).toString("base64"));
  assert.equal(encoded?.privateKey, plain?.privateKey);

  // Some settings screens turn real line breaks into the two characters \n: that still works.
  const flattened = JSON.stringify({ project_id: "p", client_email: "e@x", private_key: privateKey.replace(/\n/g, "\\n") });
  assert.equal(parseServiceAccount(flattened)?.privateKey, plain?.privateKey);
});

test("refuses anything that is not a usable key file", () => {
  assert.equal(parseServiceAccount(undefined), null);
  assert.equal(parseServiceAccount(""), null);
  assert.equal(parseServiceAccount("not json"), null);
  assert.equal(parseServiceAccount(JSON.stringify({ project_id: "p" })), null);
  assert.equal(parseServiceAccount(JSON.stringify({ project_id: "p", client_email: "e", private_key: "nope" })), null);
});

test("the signed note names the right account, scope and address, and its signature checks out", () => {
  const account = parseServiceAccount(keyFile)!;
  const jwt = buildServiceAccountJwt(account, 1_800_000_000);
  const [header, claims, signature] = jwt.split(".");

  assert.deepEqual(JSON.parse(Buffer.from(header, "base64url").toString()), { alg: "RS256", typ: "JWT" });
  assert.deepEqual(JSON.parse(Buffer.from(claims, "base64url").toString()), {
    iss: account.clientEmail,
    scope: FCM_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    iat: 1_800_000_000,
    exp: 1_800_003_600,
  });

  const verifier = createVerify("RSA-SHA256").update(`${header}.${claims}`);
  assert.equal(verifier.verify(createPublicKey(publicKey), Buffer.from(signature, "base64url")), true);

  // Tampering with the note breaks the signature.
  const forged = createVerify("RSA-SHA256").update(`${header}.${claims}x`);
  assert.equal(forged.verify(createPublicKey(publicKey), Buffer.from(signature, "base64url")), false);
});
