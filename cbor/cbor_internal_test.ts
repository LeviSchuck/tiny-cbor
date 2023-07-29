import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.194.0/testing/asserts.ts";
import {
  decodeLength,
  encodeLength,
  MAJOR_TYPE_NEGATIVE_INTEGER,
  MAJOR_TYPE_UNSIGNED_INTEGER,
} from "./cbor_internal.ts";
import { decodeHex } from "https://deno.land/x/tiny_encodings@0.1.0/encoding.ts";

function toView(data: Uint8Array): DataView {
  return new DataView(data.buffer);
}

Deno.test({
  name: "Decodes lengths properly",
  fn() {
    assertEquals(decodeLength(toView(new Uint8Array([0x00])), 0, 0), [0, 1]);
    assertEquals(decodeLength(toView(new Uint8Array([0x0a])), 10, 0), [10, 1]);
    assertEquals(decodeLength(toView(new Uint8Array([0x18, 0x18])), 24, 0), [
      24,
      2,
    ]);
    assertEquals(decodeLength(toView(new Uint8Array([0x18, 0x19])), 24, 0), [
      25,
      2,
    ]);
    assertEquals(decodeLength(toView(new Uint8Array([0x19, 0x10, 0])), 25, 0), [
      4096,
      3,
    ]);
    assertEquals(decodeLength(toView(decodeHex("1a000f4240")), 26, 0), [
      1000000,
      5,
    ]);
    assertEquals(decodeLength(toView(decodeHex("1b000000e8d4a51000")), 27, 0), [
      1000000000000,
      9,
    ]);
  },
});

Deno.test({
  name: "Encodes lengths properly",
  fn() {
    assertEquals(encodeLength(MAJOR_TYPE_UNSIGNED_INTEGER, 0), [0x00], "Zero");
    assertEquals(
      encodeLength(MAJOR_TYPE_UNSIGNED_INTEGER, 1),
      [0x01],
      "Positive 1",
    );
    assertEquals(
      encodeLength(MAJOR_TYPE_NEGATIVE_INTEGER, 1),
      [0x20],
      "Negative 1",
    );
    assertEquals(
      encodeLength(MAJOR_TYPE_UNSIGNED_INTEGER, 10),
      [0x0a],
      "Positive 10",
    );
    assertEquals(encodeLength(MAJOR_TYPE_NEGATIVE_INTEGER, 10), [0x29]),
      "Negative 10";
    assertEquals(
      encodeLength(MAJOR_TYPE_UNSIGNED_INTEGER, 100),
      [0x18, 0x64],
      "Positive 100",
    );
    assertEquals(
      encodeLength(MAJOR_TYPE_NEGATIVE_INTEGER, 100),
      [0x38, 0x63],
      "Negative 100",
    );
    assertEquals(
      encodeLength(MAJOR_TYPE_UNSIGNED_INTEGER, 255),
      [0x18, 0xff],
      "Positive 255",
    );
    assertEquals(
      encodeLength(MAJOR_TYPE_NEGATIVE_INTEGER, 255),
      [0x38, 0xfe],
      "Negative 255",
    );
    assertEquals(
      encodeLength(MAJOR_TYPE_NEGATIVE_INTEGER, 256),
      [0x38, 0xff],
      "Negative 256",
    );
    assertEquals(encodeLength(MAJOR_TYPE_UNSIGNED_INTEGER, 1000), [
      0x19,
      0x03,
      0xe8,
    ], "Positive 1000");
    assertEquals(encodeLength(MAJOR_TYPE_NEGATIVE_INTEGER, 1000), [
      0x39,
      0x03,
      0xe7,
    ], "Negative 1000");
    assertEquals(encodeLength(MAJOR_TYPE_UNSIGNED_INTEGER, 1000000), [
      0x1a,
      0x00,
      0x0f,
      0x42,
      0x40,
    ], "Positive 1000000");
    assertEquals(encodeLength(MAJOR_TYPE_UNSIGNED_INTEGER, 1000000000000), [
      0x1b,
      0x00,
      0x00,
      0x00,
      0xe8,
      0xd4,
      0xa5,
      0x10,
      0x00,
    ], "Positive 1000000000000");
    assertEquals(
      encodeLength(MAJOR_TYPE_UNSIGNED_INTEGER, 18446744073709551615n),
      [
        0x1b,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
      ],
      "Positive 18446744073709551615",
    );
    assertEquals(
      encodeLength(MAJOR_TYPE_NEGATIVE_INTEGER, 18446744073709551615n),
      [
        0x3b,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        0xfe,
      ],
      "Negative 18446744073709551615",
    );
    assertEquals(
      encodeLength(MAJOR_TYPE_NEGATIVE_INTEGER, 18446744073709551616n),
      [
        0x3b,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
      ],
      "Negative 18446744073709551616",
    );
  },
});

Deno.test({
  name: "Rejects lengths that do not decode",
  fn() {
    assertThrows(() => {
      decodeLength(toView(new Uint8Array([0x18])), 24, 0);
    }, "Requires one more byte");
    assertThrows(() => {
      decodeLength(toView(new Uint8Array([0x18, 0])), 24, 0);
    }, "Requires one more byte, number must be > 23");
    assertThrows(() => {
      decodeLength(toView(new Uint8Array([0x19])), 25, 0);
    }, "Requires two more bytes, two missing");
    assertThrows(() => {
      decodeLength(toView(new Uint8Array([0x19, 0])), 25, 0);
    }, "Requires two more bytes, one missing");
    assertThrows(() => {
      decodeLength(toView(new Uint8Array([0x19, 0, 0])), 25, 0);
    }, "Requires two more bytes, number must be > 23");
    assertThrows(() => {
      decodeLength(toView(decodeHex("1a000f42")), 26, 0);
    }, "Requires four more bytes, missing a byte");
    assertThrows(() => {
      decodeLength(toView(decodeHex("1a00000017")), 26, 0);
    }, "Requires four more bytes, must be > 23");
    assertThrows(() => {
      decodeLength(toView(decodeHex("1b000000e8d4a510")), 27, 0);
    }, "Requires eight more bytes, missing a byte");
    assertThrows(() => {
      decodeLength(toView(decodeHex("1b0000000000000017")), 27, 0);
    }, "Requires eight more bytes, must be > 23");
  },
});

Deno.test({
  name: "Rejects that do not encode",
  fn() {
    assertThrows(() => {
      encodeLength(MAJOR_TYPE_UNSIGNED_INTEGER, -1);
    }, "No negative numbers");
    assertThrows(() => {
      encodeLength(MAJOR_TYPE_NEGATIVE_INTEGER, 0);
    }, "No negative zero");
    assertThrows(() => {
      encodeLength(MAJOR_TYPE_UNSIGNED_INTEGER, 1.5);
    }, "No fractional numbers");
    assertThrows(() => {
      encodeLength(MAJOR_TYPE_UNSIGNED_INTEGER, 18446744073709551616n);
    }, "Maximum supported number");
  },
});
