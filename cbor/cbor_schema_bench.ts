import { cs } from "./cbor_schema.ts";
import {
  DECODED_APPLE_MACBOOK_WEBAUTHN_PAYLOAD,
} from "./test_data.ts";

const WebAuthnSchema = cs.map([
  cs.field("fmt", cs.string),
  cs.field("attStmt", cs.map([
    cs.field("alg", cs.integer),
    cs.field("sig", cs.bytes),
    cs.field("x5c", cs.optional(cs.array(cs.bytes))),
  ])),
  cs.field("authData", cs.bytes),
]);


const appleMacbook = WebAuthnSchema.decode(DECODED_APPLE_MACBOOK_WEBAUTHN_PAYLOAD);

Deno.bench({
  name: "Decoding a WebAuthn assertion with schema",
  fn() {
    const _appleMacbook = WebAuthnSchema.decode(DECODED_APPLE_MACBOOK_WEBAUTHN_PAYLOAD);
  },
});

Deno.bench({
  name: "Encoding a WebAuthn assertion with schema",
  fn() {
    const _payload = WebAuthnSchema.encode(appleMacbook);
  },
});

