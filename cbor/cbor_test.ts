//deno-lint-ignore-file no-explicit-any
import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { CBORTag, decodeCBOR, decodePartialCBOR, encodeCBOR } from "./cbor.ts";
import {
  APPLE_MACBOOK_WEBAUTHN_PAYLOAD,
  BYTES_HELLO_WORLD_CBOR,
  DECODED_APPLE_MACBOOK_WEBAUTHN_PAYLOAD,
  DECODED_WEBAUTHN_REGISTRATION_PAYLOAD,
  DECODED_YUBIKEY_WEBAUTHN_PAYLOAD,
  HELLO_WORLD_AS_BYTES,
  HELLO_WORLD_CBOR,
  LONG_ARRAY,
  LONG_ARRAY_CBOR,
  LOWER_ALPHABET_BYTES,
  LOWER_ALPHABET_BYTES_CBOR,
  LOWER_ALPHABET_CBOR,
  WEBAUTHN_REGISTRATION_PAYLOAD,
  YUBIKEY_WEBAUTHN_PAYLOAD,
} from "./test_data.ts";
import { decodeHex } from "https://deno.land/x/tiny_encodings@0.1.0/encoding.ts";

Deno.test({
  name: "Rejects empty input",
  fn() {
    assertThrows(() => {
      decodeCBOR(new Uint8Array([]));
    });
    assertThrows(() => {
      decodePartialCBOR(new Uint8Array([]), -1);
    });
    assertThrows(() => {
      decodePartialCBOR(new Uint8Array([]), 1);
    });
  },
});
Deno.test({
  name: "Can decode a single byte unsigned integer",
  fn() {
    assertEquals(decodeCBOR(new Uint8Array([0])), 0);
    assertEquals(decodeCBOR(new Uint8Array([1])), 1);
    assertEquals(decodeCBOR(new Uint8Array([23])), 23);
  },
});
Deno.test({
  name: "Can encode a single byte unsigned integer",
  fn() {
    assertEquals(encodeCBOR(0), new Uint8Array([0]));
    assertEquals(encodeCBOR(1), new Uint8Array([1]));
    assertEquals(encodeCBOR(23), new Uint8Array([23]));
    assertEquals(encodeCBOR(0n), new Uint8Array([0]));
    assertEquals(encodeCBOR(1n), new Uint8Array([1]));
    assertEquals(encodeCBOR(23n), new Uint8Array([23]));
  },
});
Deno.test({
  name: "Rejects seemingly valid input but with extra data on the end",
  fn() {
    assertThrows(() => {
      decodeCBOR(new Uint8Array([0, 0]));
    });
  },
});
Deno.test({
  name: "Rejects unknown input",
  fn() {
    assertThrows(() => {
      decodeCBOR(new Uint8Array([0xFF, 0xFF]));
    });
  },
});
Deno.test({
  name: "Rejects unsupported single byte unsigned integers",
  fn() {
    // Not enough length
    assertThrows(() => {
      decodeCBOR(new Uint8Array([0x18]));
    });
    // Not enough length
    assertThrows(() => {
      decodeCBOR(new Uint8Array([0x19]));
    });
    // Not supported
    assertThrows(() => {
      decodeCBOR(new Uint8Array([0x1a]));
    });
    // Not supported
    assertThrows(() => {
      decodeCBOR(new Uint8Array([0x1b]));
    });
    // Not supported
    assertThrows(() => {
      decodeCBOR(new Uint8Array([0x1c]));
    });
  },
});
Deno.test({
  name: "Can decode a double byte unsigned integer",
  fn() {
    assertEquals(decodeCBOR(new Uint8Array([0x18, 24])), 24);
    assertEquals(decodeCBOR(new Uint8Array([0x18, 255])), 255);
  },
});
Deno.test({
  name: "Can encode a double byte unsigned integer",
  fn() {
    assertEquals(encodeCBOR(24), new Uint8Array([0x18, 24]));
    assertEquals(encodeCBOR(255), new Uint8Array([0x18, 255]));
    assertEquals(encodeCBOR(24n), new Uint8Array([0x18, 24]));
    assertEquals(encodeCBOR(255n), new Uint8Array([0x18, 255]));
  },
});
Deno.test({
  name: "Rejects unsupported double byte unsigned integers",
  fn() {
    // Less than 24
    assertThrows(() => {
      decodeCBOR(new Uint8Array([0x18, 0]));
    });
    assertThrows(() => {
      decodeCBOR(new Uint8Array([0x18, 23]));
    });
    // Not enough
    assertThrows(() => {
      decodeCBOR(new Uint8Array([0x19, 0]));
    });
  },
});
Deno.test({
  name: "Can decode a triple byte unsigned integer",
  fn() {
    assertEquals(decodeCBOR(new Uint8Array([0x19, 1, 0])), 256);
    assertEquals(decodeCBOR(new Uint8Array([0x19, 1, 255])), 511);
    assertEquals(decodeCBOR(new Uint8Array([0x19, 2, 0])), 512);
    assertEquals(decodeCBOR(new Uint8Array([0x19, 255, 255])), 65535);
  },
});
Deno.test({
  name: "Can encode a triple byte unsigned integer",
  fn() {
    assertEquals(encodeCBOR(256), new Uint8Array([0x19, 1, 0]));
    assertEquals(encodeCBOR(511), new Uint8Array([0x19, 1, 255]));
    assertEquals(encodeCBOR(512), new Uint8Array([0x19, 2, 0]));
    assertEquals(encodeCBOR(65535), new Uint8Array([0x19, 255, 255]));
    assertEquals(encodeCBOR(256n), new Uint8Array([0x19, 1, 0]));
    assertEquals(encodeCBOR(511n), new Uint8Array([0x19, 1, 255]));
    assertEquals(encodeCBOR(512n), new Uint8Array([0x19, 2, 0]));
    assertEquals(encodeCBOR(65535n), new Uint8Array([0x19, 255, 255]));
  },
});
Deno.test({
  name: "Can decode a single byte negative integer",
  fn() {
    assertEquals(decodeCBOR(new Uint8Array([0x20])), -1);
    assertEquals(decodeCBOR(new Uint8Array([0x21])), -2);
    assertEquals(decodeCBOR(new Uint8Array([0x37])), -24);
  },
});
Deno.test({
  name: "Can encode a single byte negative integer",
  fn() {
    assertEquals(encodeCBOR(-1), new Uint8Array([0x20]));
    assertEquals(encodeCBOR(-2), new Uint8Array([0x21]));
    assertEquals(encodeCBOR(-24), new Uint8Array([0x37]));
  },
});
Deno.test({
  name: "Can decode a double byte negative integer",
  fn() {
    assertEquals(decodeCBOR(new Uint8Array([0x38, 0x18])), -25);
    assertEquals(decodeCBOR(new Uint8Array([0x38, 255])), -256);
  },
});
Deno.test({
  name: "Can encode a double byte negative integer",
  fn() {
    assertEquals(encodeCBOR(-25), new Uint8Array([0x38, 0x18]));
    assertEquals(encodeCBOR(-256), new Uint8Array([0x38, 255]));
  },
});
Deno.test({
  name: "Can decode a triple byte unsigned integer",
  fn() {
    assertEquals(decodeCBOR(new Uint8Array([0x39, 1, 0])), -257);
    assertEquals(decodeCBOR(new Uint8Array([0x39, 1, 255])), -512);
    assertEquals(decodeCBOR(new Uint8Array([0x39, 2, 0])), -513);
    assertEquals(decodeCBOR(new Uint8Array([0x39, 255, 255])), -65536);
  },
});
Deno.test({
  name: "Can encode a triple byte unsigned integer",
  fn() {
    assertEquals(encodeCBOR(-257), new Uint8Array([0x39, 1, 0]));
    assertEquals(encodeCBOR(-512), new Uint8Array([0x39, 1, 255]));
    assertEquals(encodeCBOR(-513), new Uint8Array([0x39, 2, 0]));
    assertEquals(encodeCBOR(-65536), new Uint8Array([0x39, 255, 255]));
  },
});
Deno.test({
  name: "Can encode a many byte integer",
  fn() {
    assertEquals(
      encodeCBOR(18446744073709551615n),
      new Uint8Array([0x1b, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
    );
    assertEquals(
      encodeCBOR(-18446744073709551616n),
      new Uint8Array([0x3b, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
    );
  },
});
Deno.test({
  name: "Can decode empty strings",
  fn() {
    assertEquals(decodeCBOR(new Uint8Array([0x60])), "");
  },
});
Deno.test({
  name: "Can encode empty strings",
  fn() {
    assertEquals(encodeCBOR(""), new Uint8Array([0x60]));
  },
});
Deno.test({
  name: "Can decode short strings",
  fn() {
    assertEquals(decodeCBOR(new Uint8Array([0x61, 0x68])), "h");
    assertEquals(
      decodeCBOR(HELLO_WORLD_CBOR),
      "hello world",
    );
  },
});
Deno.test({
  name: "Can encode short strings",
  fn() {
    assertEquals(encodeCBOR("h"), new Uint8Array([0x61, 0x68]));
    assertEquals(
      encodeCBOR("hello world"),
      HELLO_WORLD_CBOR,
    );
  },
});
Deno.test({
  name: "Can decode longer strings",
  fn() {
    assertEquals(
      decodeCBOR(LOWER_ALPHABET_CBOR),
      "abcdefghijklmnopqrstuvwxyz",
    );
  },
});
Deno.test({
  name: "Can encode longer strings",
  fn() {
    assertEquals(
      encodeCBOR("abcdefghijklmnopqrstuvwxyz"),
      LOWER_ALPHABET_CBOR,
    );
  },
});
Deno.test({
  name: "Can decode empty byte strings",
  fn() {
    assertEquals(decodeCBOR(new Uint8Array([0x40])), new Uint8Array([]));
  },
});
Deno.test({
  name: "Can encode empty byte strings",
  fn() {
    assertEquals(encodeCBOR(new Uint8Array([])), new Uint8Array([0x40]));
  },
});
Deno.test({
  name: "Can decode short byte strings",
  fn() {
    // h
    assertEquals(
      decodeCBOR(new Uint8Array([0x41, 0x68])),
      new Uint8Array([0x68]),
    );
    // hello world
    assertEquals(
      decodeCBOR(BYTES_HELLO_WORLD_CBOR),
      HELLO_WORLD_AS_BYTES,
    );
  },
});
Deno.test({
  name: "Can encode short byte strings",
  fn() {
    // h
    assertEquals(
      encodeCBOR(
        new Uint8Array([0x68]),
      ),
      new Uint8Array([0x41, 0x68]),
    );
    // hello world
    assertEquals(
      encodeCBOR(HELLO_WORLD_AS_BYTES),
      BYTES_HELLO_WORLD_CBOR,
    );
  },
});
Deno.test({
  name: "Can decode longer byte strings",
  fn() {
    assertEquals(
      decodeCBOR(LOWER_ALPHABET_BYTES_CBOR),
      LOWER_ALPHABET_BYTES,
    );
  },
});
Deno.test({
  name: "Can encode longer byte strings",
  fn() {
    assertEquals(
      encodeCBOR(LOWER_ALPHABET_BYTES),
      LOWER_ALPHABET_BYTES_CBOR,
    );
  },
});
Deno.test({
  name: "Rejects strings that are too short",
  fn() {
    assertThrows(() => {
      decodeCBOR(new Uint8Array([0x41]));
    });
    assertThrows(() => {
      decodeCBOR(new Uint8Array([0x58, 0x1a, 0x61]));
    });
  },
});
Deno.test({
  name: "Can decode an empty array",
  fn() {
    assertEquals(decodeCBOR(new Uint8Array([0x80])), []);
  },
});
Deno.test({
  name: "Can encode an empty array",
  fn() {
    assertEquals(encodeCBOR([]), new Uint8Array([0x80]));
  },
});
Deno.test({
  name: "Can decode a short array",
  fn() {
    assertEquals(decodeCBOR(new Uint8Array([0x81, 1])), [1]);
    assertEquals(decodeCBOR(new Uint8Array([0x82, 1, 2])), [1, 2]);
  },
});
Deno.test({
  name: "Can encode a short array",
  fn() {
    assertEquals(encodeCBOR([1]), new Uint8Array([0x81, 1]));
    assertEquals(encodeCBOR([1, 2]), new Uint8Array([0x82, 1, 2]));
  },
});
Deno.test({
  name: "Can decode a longer array",
  fn() {
    assertEquals(
      decodeCBOR(
        LONG_ARRAY_CBOR,
      ),
      LONG_ARRAY,
    );
  },
});
Deno.test({
  name: "Can encode a longer array",
  fn() {
    assertEquals(
      encodeCBOR(LONG_ARRAY),
      LONG_ARRAY_CBOR,
    );
  },
});
Deno.test({
  name: "Rejects arrays that are too short",
  fn() {
    assertThrows(() => {
      decodeCBOR(new Uint8Array([0x81]));
    });
    assertThrows(() => {
      decodeCBOR(new Uint8Array([0x98]));
    });
    assertThrows(() => {
      decodeCBOR(new Uint8Array([0x98, 0x18]));
    });
    // Less than 24
    assertThrows(() => {
      decodeCBOR(new Uint8Array([0x98, 1, 0]));
    });
  },
});
Deno.test({
  name: "Can decode an empty map",
  fn() {
    assertEquals(decodeCBOR(new Uint8Array([0xa0])), new Map());
  },
});
Deno.test({
  name: "Can encode an empty map",
  fn() {
    assertEquals(encodeCBOR(new Map()), new Uint8Array([0xa0]));
  },
});
Deno.test({
  name: "Can decode a small map",
  fn() {
    assertEquals(
      decodeCBOR(new Uint8Array([0xa1, 0x61, 0x31, 1])),
      new Map([["1", 1]]),
    );
  },
});
Deno.test({
  name: "Can encode a small map",
  fn() {
    assertEquals(
      encodeCBOR(new Map([["1", 1]])),
      new Uint8Array([0xa1, 0x61, 0x31, 1]),
    );
  },
});
Deno.test({
  name: "Rejects maps with missing key and values",
  fn() {
    assertThrows(() => {
      decodeCBOR(new Uint8Array([0xa1]));
    });
    assertThrows(() => {
      decodeCBOR(new Uint8Array([0xa1, 0x61]));
    });
    assertThrows(() => {
      decodeCBOR(new Uint8Array([0xa1, 0x61, 0x31]));
    });
  },
});
Deno.test({
  name: "Rejects maps with non string or int keys keys",
  fn() {
    assertThrows(() => {
      decodeCBOR(new Uint8Array([0xa1, 0x61]));
    });
    assertThrows(() => {
      decodeCBOR(new Uint8Array([0xa1, 0x80, 1]));
    });
  },
});
Deno.test({
  name: "Rejects maps with duplicate keys",
  fn() {
    assertThrows(() => {
      decodeCBOR(new Uint8Array([0xa1, 0x61]));
    });
    assertThrows(() => {
      decodeCBOR(new Uint8Array([0xa2, 0x61, 0x31, 1, 0x61, 0x31, 1]));
    });
  },
});

Deno.test({
  name: "Can decode webauthn registration",
  fn() {
    // Apple MacBook
    assertEquals(
      decodeCBOR(APPLE_MACBOOK_WEBAUTHN_PAYLOAD),
      DECODED_APPLE_MACBOOK_WEBAUTHN_PAYLOAD,
    );
    // Yubikey 5
    assertEquals(
      decodeCBOR(YUBIKEY_WEBAUTHN_PAYLOAD),
      DECODED_YUBIKEY_WEBAUTHN_PAYLOAD,
    );
  },
});

Deno.test({
  name: "Can decode array buffers",
  fn() {
    // Apple MacBook
    assertEquals(
      decodeCBOR(APPLE_MACBOOK_WEBAUTHN_PAYLOAD.buffer),
      DECODED_APPLE_MACBOOK_WEBAUTHN_PAYLOAD,
    );
    // Yubikey 5
    assertEquals(
      decodeCBOR(YUBIKEY_WEBAUTHN_PAYLOAD.buffer),
      DECODED_YUBIKEY_WEBAUTHN_PAYLOAD,
    );
  },
});
Deno.test({
  name: "Can decode data views",
  fn() {
    // Apple MacBook
    const appleView = new DataView(APPLE_MACBOOK_WEBAUTHN_PAYLOAD.buffer);
    const yubikeyView = new DataView(YUBIKEY_WEBAUTHN_PAYLOAD.buffer);
    assertEquals(
      decodeCBOR(appleView),
      DECODED_APPLE_MACBOOK_WEBAUTHN_PAYLOAD,
    );
    // Yubikey 5
    assertEquals(
      decodeCBOR(yubikeyView),
      DECODED_YUBIKEY_WEBAUTHN_PAYLOAD,
    );
  },
});
Deno.test({
  name: "Can encode webauthn registration",
  fn() {
    // Apple MacBook
    assertEquals(
      encodeCBOR(DECODED_APPLE_MACBOOK_WEBAUTHN_PAYLOAD),
      APPLE_MACBOOK_WEBAUTHN_PAYLOAD,
    );
    // Yubikey 5
    assertEquals(
      encodeCBOR(DECODED_YUBIKEY_WEBAUTHN_PAYLOAD),
      YUBIKEY_WEBAUTHN_PAYLOAD,
    );
  },
});
Deno.test({
  name: "Can decode webauthn registration attested credential public key",
  fn() {
    assertEquals(
      decodeCBOR(WEBAUTHN_REGISTRATION_PAYLOAD),
      DECODED_WEBAUTHN_REGISTRATION_PAYLOAD,
    );
  },
});
Deno.test({
  name: "Can encode webauthn registration attested credential public key",
  fn() {
    assertEquals(
      encodeCBOR(DECODED_WEBAUTHN_REGISTRATION_PAYLOAD),
      WEBAUTHN_REGISTRATION_PAYLOAD,
    );
  },
});
Deno.test({
  name: "Decodes false",
  fn() {
    assertEquals(decodeCBOR(new Uint8Array([0b111_10100])), false);
  },
});
Deno.test({
  name: "Encodes false",
  fn() {
    assertEquals(encodeCBOR(false), new Uint8Array([0b111_10100]));
  },
});
Deno.test({
  name: "Decodes true",
  fn() {
    assertEquals(decodeCBOR(new Uint8Array([0b111_10101])), true);
  },
});
Deno.test({
  name: "Encodes true",
  fn() {
    assertEquals(encodeCBOR(true), new Uint8Array([0b111_10101]));
  },
});
Deno.test({
  name: "Decodes null",
  fn() {
    assertEquals(decodeCBOR(new Uint8Array([0b111_10110])), null);
  },
});
Deno.test({
  name: "Encodes null",
  fn() {
    assertEquals(encodeCBOR(null), new Uint8Array([0b111_10110]));
  },
});
Deno.test({
  name: "Decodes undefined",
  fn() {
    assertEquals(decodeCBOR(new Uint8Array([0b111_10111])), undefined);
  },
});
Deno.test({
  name: "Encodes undefined",
  fn() {
    assertEquals(encodeCBOR(undefined), new Uint8Array([0b111_10111]));
  },
});
Deno.test({
  name: "Decodes limited 16 bit floating point numbers",
  fn() {
    assertEquals(decodeCBOR(decodeHex("f97c00")), Infinity);
    assertEquals(decodeCBOR(decodeHex("f97e00")), NaN);
    assertEquals(decodeCBOR(decodeHex("f9fc00")), -Infinity);
  },
});
Deno.test({
  name: "Rejects incomplete 16 bit floating point numbers",
  fn() {
    assertThrows(() => {
      decodeCBOR(decodeHex("f97c"));
    });
  },
});
Deno.test({
  name: "Unsupported 16 bit floating point numbers",
  fn() {
    assertThrows(() => {
      decodeCBOR(decodeHex("f9c400")); // Should be -4.0
    });
  },
});
Deno.test({
  name: "Decodes 32 bit floating point number",
  fn() {
    assertEquals(decodeCBOR(decodeHex("fa47c35000")), 100000.0);
    assertEquals(decodeCBOR(decodeHex("fa7f800000")), Infinity);
    assertEquals(decodeCBOR(decodeHex("fa7fc00000")), NaN);
    assertEquals(decodeCBOR(decodeHex("faff800000")), -Infinity);
  },
});
Deno.test({
  name: "Encodes 32 bit floating point number",
  fn() {
    assertEquals(encodeCBOR(3.4028234663852886e+38), decodeHex("fa7f7fffff"));
  },
});
Deno.test({
  name: "Rejects incomplete 32 bit floating point number",
  fn() {
    assertThrows(() => {
      decodeCBOR(decodeHex("fa7f7fff"));
    });
  },
});
Deno.test({
  name: "Decodes 64 bit floating point number",
  fn() {
    assertEquals(decodeCBOR(decodeHex("fb7e37e43c8800759c")), 1.0e+300);
    assertEquals(decodeCBOR(decodeHex("fb7ff0000000000000")), Infinity);
    assertEquals(decodeCBOR(decodeHex("fb7ff8000000000000")), NaN);
    assertEquals(decodeCBOR(decodeHex("fbfff0000000000000")), -Infinity);
  },
});
Deno.test({
  name: "Encode 64 bit floating point number",
  fn() {
    assertEquals(encodeCBOR(-4.1), decodeHex("fbc010666666666666"));
  },
});
Deno.test({
  name: "Rejects incomplete 64 bit floating point number",
  fn() {
    assertThrows(() => {
      decodeCBOR(decodeHex("fb7e37e43c880075"));
    });
  },
});
Deno.test({
  name: "Decodes tagged items",
  fn() {
    assertEquals(
      decodeCBOR(decodeHex("c074323031332d30332d32315432303a30343a30305a")),
      new CBORTag(0, "2013-03-21T20:04:00Z"),
    );
    assertEquals(
      decodeCBOR(decodeHex("c11a514b67b0")),
      new CBORTag(1, 1363896240),
    );
  },
});
Deno.test({
  name: "Rejects incomplete tagged items",
  fn() {
    assertThrows(() => {
      decodeCBOR(decodeHex("c0"));
    });
    assertThrows(() => {
      decodeCBOR(decodeHex("c11a"));
    });
  },
});
Deno.test({
  name: "Encodes tagged items",
  fn() {
    assertEquals(
      encodeCBOR(new CBORTag(0, "2013-03-21T20:04:00Z")),
      decodeHex("c074323031332d30332d32315432303a30343a30305a"),
    );
    assertEquals(
      encodeCBOR(new CBORTag(1, 1363896240)),
      decodeHex("c11a514b67b0"),
    );
  },
});
Deno.test({
  name: "Rejects unsupported type",
  fn() {
    assertThrows(() => {
      encodeCBOR({ "hello": true } as any);
    });
  },
});
