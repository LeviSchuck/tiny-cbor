import { assertThrows } from "https://deno.land/std@0.224.0/assert/assert_throws.ts";
import { integer } from "./integer.ts";
import { assertEquals } from "jsr:@std/assert";

// Type validation tests
Deno.test("Integer types with invalid inputs - fromCBORType", () => {
  // Integer schema should reject strings
  assertThrows(
    () => integer.fromCBORType("42"),
    Error,
    "Expected integer",
  );

  // Integer schema should reject floats
  assertThrows(
    () => integer.fromCBORType(42.5),
    Error,
    "Expected integer",
  );
});

Deno.test("Integer types with invalid inputs - toCBORType", () => {
    // Integer schema should reject strings
    assertThrows(
      () => integer.toCBORType("42" as unknown as number),
      Error,
      "Value 42 is not a valid integer",
    );
  
    // Integer schema should reject objects
    assertThrows(
      () => integer.toCBORType({} as unknown as number),
      Error,
      "not a valid integer",
    );
})

// Test primitive types with valid inputs for toCBORType
Deno.test("Integer types with valid inputs - toCBORType", () => {
  // Test integer
  const intValue = 42;
  assertEquals(integer.toCBORType(intValue), intValue);
});

Deno.test("Integer types with valid inputs - fromCBORType", () => {
  // Test integer
  const intValue = 42;
  assertEquals(integer.fromCBORType(intValue), intValue);
});

