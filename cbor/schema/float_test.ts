import { assertThrows } from "jsr:@std/assert";
import { float } from "./float.ts";
import { assertEquals } from "jsr:@std/assert";

// Type validation tests
Deno.test("Float types with invalid inputs - fromCBORType", () => {
  // Float schema should reject strings
  assertThrows(
    () => float.fromCBORType("3.14"),
    Error,
    "Expected number",
  );

  // Float schema should reject booleans
  assertThrows(
    () => float.fromCBORType(true),
    Error,
    "Expected number",
  );

  // Float schema should reject arrays
  assertThrows(
    () => float.fromCBORType([]),
    Error,
    "Expected number",
  );

  // Float schema should reject objects
  assertThrows(
    () => float.fromCBORType(null),
    Error,
    "Expected number",
  );
});

Deno.test("Float types with invalid inputs - toCBORType", () => {
  // Float schema should reject strings
  assertThrows(
    () => float.toCBORType("3.14" as unknown as number),
    Error,
    "Expected number",
  );

  // Float schema should reject objects
  assertThrows(
    () => float.toCBORType({} as unknown as number),
    Error,
    "Expected number",
  );

  // Float schema should reject arrays
  assertThrows(
    () => float.toCBORType([] as unknown as number),
    Error,
    "Expected number",
  );

  // Float schema should reject booleans
  assertThrows(
    () => float.toCBORType(true as unknown as number),
    Error,
    "Expected number",
  );
});

// Test primitive types with valid inputs for toCBORType
Deno.test("Float types with valid inputs - toCBORType", () => {
  // Test integer
  assertEquals(float.toCBORType(42), 42);
  // Test float
  assertEquals(float.toCBORType(3.14), 3.14);
  // Test negative
  assertEquals(float.toCBORType(-1.5), -1.5);
});

Deno.test("Float types with valid inputs - fromCBORType", () => {
  // Test integer
  assertEquals(float.fromCBORType(42), 42);
  // Test float
  assertEquals(float.fromCBORType(3.14), 3.14);
  // Test negative
  assertEquals(float.fromCBORType(-1.5), -1.5);
});
