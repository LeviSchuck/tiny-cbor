import { assertThrows } from "jsr:@std/assert";
import { union } from "./union.ts";
import { float } from "./float.ts";
import { string } from "./string.ts";
import { integer } from "./integer.ts";
import { assertEquals } from "jsr:@std/assert";

// Type validation tests
Deno.test("Union types with invalid inputs - fromCBORType", () => {
  const numberOrStringSchema = union([float, string]);

  // Union schema should reject values that don't match any schema
  assertThrows(
    () => numberOrStringSchema.fromCBORType(true),
    Error,
    "Value doesn't match any schema in union",
  );

  // Union schema should reject values that don't match any schema
  assertThrows(
    () => numberOrStringSchema.fromCBORType([]),
    Error,
    "Value doesn't match any schema in union",
  );
});

Deno.test("Union types with invalid inputs - toCBORType", () => {
  const numberOrStringSchema = union([float, string]);

  // Union schema should reject values that don't match any schema
  assertThrows(
    () => numberOrStringSchema.toCBORType(true as unknown as string | number),
    Error,
    "Value doesn't match any schema in union for encoding",
  );

  // Union schema should reject values that don't match any schema
  assertThrows(
    () => numberOrStringSchema.toCBORType([] as unknown as string | number),
    Error,
    "Value doesn't match any schema in union for encoding",
  );
});

// Test with valid inputs
Deno.test("Union types with valid inputs", () => {
  // Test number or string schema
  const numberOrStringSchema = union([float, string]);

  // Test with number
  const num = 42.5;
  const encodedNum = numberOrStringSchema.toCBORType(num);
  assertEquals(numberOrStringSchema.fromCBORType(encodedNum), num);

  // Test with string
  const str = "test";
  const encodedStr = numberOrStringSchema.toCBORType(str);
  assertEquals(numberOrStringSchema.fromCBORType(encodedStr), str);

  // Test with integer and float union
  const numberSchema = union([integer, float]);

  // Test with integer
  const int = 42;
  const encodedInt = numberSchema.toCBORType(int);
  assertEquals(numberSchema.fromCBORType(encodedInt), int);

  // Test with float
  const flt = 42.5;
  const encodedFlt = numberSchema.toCBORType(flt);
  assertEquals(numberSchema.fromCBORType(encodedFlt), flt);
}); 