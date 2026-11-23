import { assertEquals, assertThrows } from "@std/assert";
import { decodeHex } from "@levischuck/tiny-encodings";
import { decodeCBOR, decodePartialCBOR } from "../index.ts";
import {
  APPLE_MACBOOK_WEBAUTHN_PAYLOAD,
  DECODED_APPLE_MACBOOK_WEBAUTHN_PAYLOAD,
  DECODED_WEBAUTHN_REGISTRATION_PAYLOAD,
  DECODED_YUBIKEY_WEBAUTHN_PAYLOAD,
  WEBAUTHN_REGISTRATION_PAYLOAD,
  YUBIKEY_WEBAUTHN_PAYLOAD,
} from "./test_data.ts";

const strict = { ctap2Canonical: true };

Deno.test("Non-preferred encodings decode by default and fail in CTAP2 mode", () => {
  for (const [argument, width] of [[24, 1], [25, 2], [26, 4], [27, 8]]) {
    for (const major of [0, 1, 2, 3, 4, 5]) {
      for (const value of [0, 1]) {
        const payload = value === 0 || major < 2
          ? []
          : major === 4
          ? [0]
          : major === 5
          ? [1, 2]
          : [0x61];
        const canonical = new Uint8Array([(major << 5) | value, ...payload]);
        const head = new Uint8Array(1 + width);
        head[0] = (major << 5) | argument;
        head[width] = value;
        const extended = new Uint8Array([...head, ...payload]);
        const expected = decodeCBOR(canonical, strict);

        assertEquals(decodeCBOR(extended), expected);
        assertEquals(decodeCBOR(extended, { ctap2Canonical: false }), expected);
        assertEquals(decodePartialCBOR(extended, 0), [
          expected,
          extended.length,
        ]);
        assertThrows(() => decodeCBOR(extended, strict), Error, "shortest");
        assertThrows(
          () => decodePartialCBOR(extended, 0, strict),
          Error,
          "shortest",
        );

        const nested = new Uint8Array([0x81, ...extended]);
        assertEquals(decodeCBOR(nested), [expected]);
        assertThrows(() => decodeCBOR(nested, strict), Error, "shortest");
      }
    }
  }
});

Deno.test("CTAP2 accepts canonical integer boundaries", () => {
  for (
    const [hex, expected] of [
      ["00", 0],
      ["17", 23],
      ["1818", 24],
      ["18ff", 255],
      ["190100", 256],
      ["19ffff", 65535],
      ["1a00010000", 65536],
      ["1affffffff", 4294967295],
      ["1b0000000100000000", 4294967296],
      ["1b001fffffffffffff", Number.MAX_SAFE_INTEGER],
      ["1b0020000000000000", 9007199254740992n],
      ["20", -1],
      ["37", -24],
      ["3818", -25],
      ["390100", -257],
    ] as const
  ) {
    assertEquals(decodeCBOR(decodeHex(hex), strict), expected, hex);
  }
});

Deno.test("CTAP2 rejects oversized integer and length encodings at every width", () => {
  for (const major of [0, 1, 2, 3, 4, 5]) {
    for (
      const [argument, tail] of [
        [24, "00"],
        [24, "05"],
        [25, "0005"],
        [25, "0018"],
        [26, "00000005"],
        [26, "00000100"],
        [27, "0000000000000005"],
        [27, "0000000000010000"],
      ] as const
    ) {
      const bytes = decodeHex(((major << 5) | argument).toString(16) + tail);
      assertThrows(() => decodeCBOR(bytes, strict));
    }
  }
  // These all succeed in the existing default decoder.
  for (const hex of ["190018", "1a00000100", "1b0000000000010000"]) {
    decodeCBOR(decodeHex(hex));
    assertThrows(() => decodeCBOR(decodeHex(hex), strict), Error, "shortest");
  }
});

Deno.test("CTAP2 orders map keys by major type before encoded length", () => {
  assertEquals(
    decodeCBOR(decodeHex("a21818002000"), strict),
    new Map([[24, 0], [-1, 0]]),
  );
  assertThrows(() => decodeCBOR(decodeHex("a22000181800"), strict));
  // Within a major type, length comes before lexical order.
  decodeCBOR(decodeHex("a261620062616100"), strict);
  assertThrows(() => decodeCBOR(decodeHex("a262616100616200"), strict));
  decodeCBOR(decodeHex("a2616100616200"), strict);
  assertThrows(() => decodeCBOR(decodeHex("a2616200616100"), strict));
  // The ordering requirement also applies inside nested maps.
  assertThrows(() => decodeCBOR(decodeHex("81a202000100"), strict));
});

Deno.test("CTAP2 rejects duplicate keys, including alternate encodings", () => {
  for (
    const hex of [
      "a201000101",
      "a20100180101",
      "a201001b000000000000000101",
      "a2616100616101",
    ]
  ) {
    assertThrows(() => decodeCBOR(decodeHex(hex), strict));
  }
});

Deno.test("CTAP2 rejects tags and indefinite-length items recursively", () => {
  for (
    const hex of ["c000", "81c000", "a101c000", "9fff", "bfff", "5fff", "7fff"]
  ) {
    assertThrows(() => decodeCBOR(decodeHex(hex), strict));
  }
});

Deno.test("CTAP2 permits four container levels and rejects a fifth", () => {
  decodeCBOR(decodeHex("81818180"), strict);
  decodeCBOR(decodeHex("a10181a10180"), strict);
  assertThrows(
    () => decodeCBOR(decodeHex("8181818180"), strict),
    Error,
    "four",
  );
  assertThrows(
    () => decodeCBOR(decodeHex("a10181a1018180"), strict),
    Error,
    "four",
  );
  // The option does not change default decoding.
  decodeCBOR(decodeHex("8181818180"));
});

Deno.test("CTAP2 preserves float widths instead of requiring shortest floats", () => {
  assertEquals(decodeCBOR(decodeHex("fa3fc00000"), strict), 1.5);
  assertEquals(decodeCBOR(decodeHex("fb3ff8000000000000"), strict), 1.5);
  assertEquals(decodeCBOR(decodeHex("f97c00"), strict), Infinity);
});

Deno.test("CTAP2 rejects invalid UTF-8 and preserves a leading BOM", () => {
  for (const hex of ["61ff", "62c0af", "63eda080"]) {
    assertThrows(() => decodeCBOR(decodeHex(hex), strict));
  }
  assertEquals(decodeCBOR(decodeHex("63efbbbf"), strict), "\uFEFF");
  assertEquals(
    decodeCBOR(decodeHex("a2600063efbbbf01"), strict),
    new Map([["", 0], ["\uFEFF", 1]]),
  );
});

Deno.test("CTAP2 rejects truncated strings even inside arrays and partial decoding", () => {
  for (const hex of ["42ff", "62ff", "8142ff", "8162ff", "a10142ff"]) {
    assertThrows(() => decodePartialCBOR(decodeHex(hex), 0, strict));
  }
  const backing = decodeHex("0042aabb00");
  assertThrows(() => decodePartialCBOR(backing.subarray(1, 3), 0, strict));
  assertThrows(() =>
    decodePartialCBOR(new DataView(backing.buffer, 1, 2), 0, strict)
  );
  assertEquals(decodePartialCBOR(backing.subarray(1), 0, strict), [
    decodeHex("aabb"),
    3,
  ]);
});

Deno.test("CTAP2 checks apply to partial decoding and all input views", () => {
  const backing = decodeHex("ff19001800");
  assertThrows(() => decodePartialCBOR(backing, 1, strict));
  assertThrows(() => decodeCBOR(backing.subarray(1, 4), strict));
  assertThrows(() => decodeCBOR(new DataView(backing.buffer, 1, 3), strict));
  assertThrows(() => decodeCBOR(backing.buffer.slice(1, 4), strict));
  assertEquals(decodePartialCBOR(decodeHex("ff181800"), 1, strict), [24, 2]);
  assertThrows(() => decodeCBOR(decodeHex("181800"), strict));
  for (const index of [NaN, Infinity, -1, 0.5]) {
    assertThrows(() => decodePartialCBOR(decodeHex("00"), index, strict));
  }
});

Deno.test("CTAP2 accepts existing WebAuthn attestation and COSE key fixtures", () => {
  assertEquals(
    decodeCBOR(APPLE_MACBOOK_WEBAUTHN_PAYLOAD, strict),
    DECODED_APPLE_MACBOOK_WEBAUTHN_PAYLOAD,
  );
  assertEquals(
    decodeCBOR(YUBIKEY_WEBAUTHN_PAYLOAD, strict),
    DECODED_YUBIKEY_WEBAUTHN_PAYLOAD,
  );
  assertEquals(
    decodeCBOR(WEBAUTHN_REGISTRATION_PAYLOAD, strict),
    DECODED_WEBAUTHN_REGISTRATION_PAYLOAD,
  );
});
