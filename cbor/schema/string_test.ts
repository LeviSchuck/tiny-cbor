import { assertThrows } from "jsr:@std/assert";
import { string } from "./string.ts";
import { assertEquals } from "jsr:@std/assert";

// Type validation tests
Deno.test("String types with invalid inputs - fromCBORType", () => {
  // String schema should reject numbers
  assertThrows(
    () => string.fromCBORType(42),
    Error,
    "Expected string",
  );

  // String schema should reject booleans
  assertThrows(
    () => string.fromCBORType(true),
    Error,
    "Expected string",
  );

  // String schema should reject arrays
  assertThrows(
    () => string.fromCBORType([]),
    Error,
    "Expected string",
  );

  // String schema should reject objects
  assertThrows(
    () => string.fromCBORType({} as unknown as string),
    Error,
    "Expected string",
  );
});

Deno.test("String types with invalid inputs - toCBORType", () => {
  // String schema should reject numbers
  assertThrows(
    () => string.toCBORType(42 as unknown as string),
    Error,
    "Expected string",
  );

  // String schema should reject objects
  assertThrows(
    () => string.toCBORType({} as unknown as string),
    Error,
    "Expected string",
  );

  // String schema should reject arrays
  assertThrows(
    () => string.toCBORType([] as unknown as string),
    Error,
    "Expected string",
  );

  // String schema should reject booleans
  assertThrows(
    () => string.toCBORType(true as unknown as string),
    Error,
    "Expected string",
  );
});

// Test primitive types with valid inputs for toCBORType
Deno.test("String types with valid inputs - toCBORType", () => {
  // Test string
  const stringValue = "test string";
  assertEquals(string.toCBORType(stringValue), stringValue);
});

Deno.test("String types with valid inputs - fromCBORType", () => {
  // Test string
  const stringValue = "test string";
  assertEquals(string.fromCBORType(stringValue), stringValue);
});
