import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.194.0/testing/asserts.ts";
import { MAJOR_TYPE_NEGATIVE_INTEGER, MAJOR_TYPE_UNSIGNED_INTEGER, decodeLength, encodeLength } from "./cbor_internal.ts";

Deno.test({
  name: "Decodes lengths properly",
  fn() {
    assertEquals(decodeLength(new Uint8Array([0x00]), 0, 0), [0, 1]);
    assertEquals(decodeLength(new Uint8Array([0x0a]), 10, 0), [10, 1]);
    assertEquals(decodeLength(new Uint8Array([0x18, 0x18]), 24, 0), [24, 2]);
    assertEquals(decodeLength(new Uint8Array([0x18, 0x19]), 24, 0), [25, 2]);
    assertEquals(decodeLength(new Uint8Array([0x19, 0x10, 0]), 25, 0), [
      4096,
      3,
    ]);
  },
});

Deno.test({
  name: "Encodes lengths properly",
  fn() {
    assertEquals(encodeLength(MAJOR_TYPE_UNSIGNED_INTEGER, 0), [0x00], "Zero");
    assertEquals(encodeLength(MAJOR_TYPE_UNSIGNED_INTEGER, 1), [0x01], "Positive 1");
    assertEquals(encodeLength(MAJOR_TYPE_NEGATIVE_INTEGER, 1), [0x20], "Negative 1");
    assertEquals(encodeLength(MAJOR_TYPE_UNSIGNED_INTEGER, 10), [0x0a], "Positive 10");
    assertEquals(encodeLength(MAJOR_TYPE_NEGATIVE_INTEGER, 10), [0x29]), "Negative 10";
    assertEquals(encodeLength(MAJOR_TYPE_UNSIGNED_INTEGER, 100), [0x18, 0x64], "Positive 100");
    assertEquals(encodeLength(MAJOR_TYPE_NEGATIVE_INTEGER, 100), [0x38, 0x63], "Negative 100");
    assertEquals(encodeLength(MAJOR_TYPE_UNSIGNED_INTEGER, 1000), [0x19, 0x03, 0xe8], "Positive 1000");
    assertEquals(encodeLength(MAJOR_TYPE_NEGATIVE_INTEGER, 1000), [0x39, 0x03, 0xe7], "Negative 1000");
    assertEquals(encodeLength(MAJOR_TYPE_UNSIGNED_INTEGER, 1000000), [0x1a, 0x00, 0x0f, 0x42, 0x40], "Positive 1000000");
    assertEquals(encodeLength(MAJOR_TYPE_UNSIGNED_INTEGER, 1000000000000), [0x1b, 0x00, 0x00, 0x00, 0xe8, 0xd4, 0xa5, 0x10, 0x00], "Positive 1000000000000");
  },
});

Deno.test({
  name: "Rejects improper lengths lengths properly",
  fn() {
    assertThrows(() => {
      decodeLength(new Uint8Array([0x18]), 24, 0);
    });
    assertThrows(() => {
      decodeLength(new Uint8Array([0x18, 0]), 24, 0);
    });
    assertThrows(() => {
      decodeLength(new Uint8Array([0x19]), 25, 0);
    });
    assertThrows(() => {
      decodeLength(new Uint8Array([0x19, 0]), 25, 0);
    });
    assertThrows(() => {
      decodeLength(new Uint8Array([0x19, 0, 0]), 25, 0);
    });
  },
});
