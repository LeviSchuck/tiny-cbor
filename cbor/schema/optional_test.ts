import { assertThrows } from "jsr:@std/assert";
import { optional } from "./optional.ts";
import { float } from "./float.ts";
import { string } from "./string.ts";
import { assertEquals } from "jsr:@std/assert";

// Type validation tests
Deno.test("Optional types with invalid inputs - fromCBORType", () => {
  const optionalNumberSchema = optional(float);

  // Optional schema should reject invalid values for inner schema
  assertThrows(
    () => optionalNumberSchema.fromCBORType("not a number"),
    Error,
    "Expected number",
  );
});

Deno.test("Optional types with invalid inputs - toCBORType", () => {
  const optionalNumberSchema = optional(float);

  // Optional schema should reject invalid values for inner schema
  assertThrows(
    () => optionalNumberSchema.toCBORType("not a number" as unknown as number | undefined),
    Error,
    "Expected number",
  );
});

// Test with valid inputs
Deno.test("Optional types with valid inputs", () => {
  // Test optional number schema
  const optionalNumberSchema = optional(float);

  // Test with value present
  const num = 42.5;
  const encodedNum = optionalNumberSchema.toCBORType(num);
  assertEquals(optionalNumberSchema.fromCBORType(encodedNum), num);

  // Test with undefined
  const encodedUndefined = optionalNumberSchema.toCBORType(undefined);
  assertEquals(optionalNumberSchema.fromCBORType(encodedUndefined), undefined);

  // Test with null (should decode to undefined)
  assertEquals(optionalNumberSchema.fromCBORType(null), undefined);

  // Test optional string schema
  const optionalStringSchema = optional(string);

  // Test with value present
  const str = "test";
  const encodedStr = optionalStringSchema.toCBORType(str);
  assertEquals(optionalStringSchema.fromCBORType(encodedStr), str);

  // Test with undefined
  const encodedStrUndefined = optionalStringSchema.toCBORType(undefined);
  assertEquals(optionalStringSchema.fromCBORType(encodedStrUndefined), undefined);
}); 