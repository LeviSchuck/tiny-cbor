import { assertThrows } from "jsr:@std/assert";
import { boolean } from "./boolean.ts";
import { assertEquals } from "jsr:@std/assert";

// Type validation tests
Deno.test("Boolean types with invalid inputs - fromCBORType", () => {
  // Boolean schema should reject numbers
  assertThrows(
    () => boolean.fromCBORType(42),
    Error,
    "Expected boolean",
  );

  // Boolean schema should reject strings
  assertThrows(
    () => boolean.fromCBORType("true"),
    Error,
    "Expected boolean",
  );

  // Boolean schema should reject arrays
  assertThrows(
    () => boolean.fromCBORType([]),
    Error,
    "Expected boolean",
  );

  // Boolean schema should reject objects
  assertThrows(
    () => boolean.fromCBORType(null),
    Error,
    "Expected boolean",
  );
});

Deno.test("Boolean types with invalid inputs - toCBORType", () => {
  // Boolean schema should reject numbers
  assertThrows(
    () => boolean.toCBORType(42 as unknown as boolean),
    Error,
    "Expected boolean",
  );

  // Boolean schema should reject strings
  assertThrows(
    () => boolean.toCBORType("true" as unknown as boolean),
    Error,
    "Expected boolean",
  );

  // Boolean schema should reject arrays
  assertThrows(
    () => boolean.toCBORType([] as unknown as boolean),
    Error,
    "Expected boolean",
  );

  // Boolean schema should reject objects
  assertThrows(
    () => boolean.toCBORType(null as unknown as boolean),
    Error,
    "Expected boolean",
  );
});

// Test primitive types with valid inputs for toCBORType
Deno.test("Boolean types with valid inputs - toCBORType", () => {
  // Test true
  assertEquals(boolean.toCBORType(true), true);
  // Test false
  assertEquals(boolean.toCBORType(false), false);
});

Deno.test("Boolean types with valid inputs - fromCBORType", () => {
  // Test true
  assertEquals(boolean.fromCBORType(true), true);
  // Test false
  assertEquals(boolean.fromCBORType(false), false);
}); 