import { decodeCBOR, encodeCBOR } from "./cbor.ts";
import {
  APPLE_MACBOOK_WEBAUTHN_PAYLOAD,
  DECODED_APPLE_MACBOOK_WEBAUTHN_PAYLOAD,
} from "./test_data.ts";

Deno.bench({
  name: "Decoding a WebAuthn assertion",
  fn() {
    const _appleMacbook = decodeCBOR(APPLE_MACBOOK_WEBAUTHN_PAYLOAD);
  },
});

Deno.bench({
  name: "Encoding a WebAuthn assertion",
  fn() {
    const _payload = encodeCBOR(DECODED_APPLE_MACBOOK_WEBAUTHN_PAYLOAD);
  },
});
