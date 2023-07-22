import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.194.0/testing/asserts.ts";
import { decodeLength } from "./cbor_internal.ts";

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
