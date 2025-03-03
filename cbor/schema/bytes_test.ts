import { assertThrows } from "jsr:@std/assert";
import { bytes } from "./bytes.ts";
import { assertEquals } from "jsr:@std/assert";

// Type validation tests
Deno.test("Bytes types with invalid inputs - fromCBORType", () => {
  // Bytes schema should reject numbers
  assertThrows(
    () => bytes.fromCBORType(42),
    Error,
    "Expected Uint8Array",
  );

  // Bytes schema should reject strings
  assertThrows(
    () => bytes.fromCBORType("bytes"),
    Error,
    "Expected Uint8Array",
  );

  // Bytes schema should reject regular arrays
  assertThrows(
    () => bytes.fromCBORType([1, 2, 3]),
    Error,
    "Expected Uint8Array",
  );

  // Bytes schema should reject objects
  assertThrows(
    () => bytes.fromCBORType({} as unknown as Uint8Array),
    Error,
    "Expected Uint8Array",
  );
});

Deno.test("Bytes types with invalid inputs - toCBORType", () => {
  // Bytes schema should reject numbers
  assertThrows(
    () => bytes.toCBORType(42 as unknown as Uint8Array),
    Error,
    "Expected Uint8Array",
  );

  // Bytes schema should reject strings
  assertThrows(
    () => bytes.toCBORType("bytes" as unknown as Uint8Array),
    Error,
    "Expected Uint8Array",
  );

  // Bytes schema should reject regular arrays
  assertThrows(
    () => bytes.toCBORType([1, 2, 3] as unknown as Uint8Array),
    Error,
    "Expected Uint8Array",
  );

  // Bytes schema should reject objects
  assertThrows(
    () => bytes.toCBORType({} as unknown as Uint8Array),
    Error,
    "Expected Uint8Array",
  );
});

// Test primitive types with valid inputs for toCBORType
Deno.test("Bytes types with valid inputs - toCBORType", () => {
  // Test empty bytes
  const emptyBytes = new Uint8Array();
  assertEquals(bytes.toCBORType(emptyBytes), emptyBytes);

  // Test bytes with data
  const dataBytes = new Uint8Array([1, 2, 3, 4, 5]);
  assertEquals(bytes.toCBORType(dataBytes), dataBytes);
});

Deno.test("Bytes types with valid inputs - fromCBORType", () => {
  // Test empty bytes
  const emptyBytes = new Uint8Array();
  assertEquals(bytes.fromCBORType(emptyBytes), emptyBytes);

  // Test bytes with data
  const dataBytes = new Uint8Array([1, 2, 3, 4, 5]);
  assertEquals(bytes.fromCBORType(dataBytes), dataBytes);
});
