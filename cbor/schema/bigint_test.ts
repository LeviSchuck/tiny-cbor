import { assertThrows } from "https://deno.land/std@0.224.0/assert/assert_throws.ts";
import { bigint } from "./bigint.ts";
import { assertEquals } from "jsr:@std/assert";

// Type validation tests
Deno.test("BigInt types with invalid inputs - fromCBORType", () => {
  // BigInt schema should reject strings
  assertThrows(
    () => bigint.fromCBORType("42"),
    Error,
    "Expected bigint",
  );

  // BigInt schema should reject numbers
  assertThrows(
    () => bigint.fromCBORType(42),
    Error,
    "Expected bigint",
  );
});

Deno.test("BigInt types with invalid inputs - toCBORType", () => {
  // BigInt schema should reject strings
  assertThrows(
    () => bigint.toCBORType("42" as unknown as bigint),
    Error,
    "Value 42 is not a valid bigint",
  );

  // BigInt schema should reject numbers
  assertThrows(
    () => bigint.toCBORType(42 as unknown as bigint),
    Error,
    "not a valid bigint",
  );
});

// Test primitive types with valid inputs for toCBORType
Deno.test("BigInt types with valid inputs - toCBORType", () => {
  // Test BigInt larger than Number.MAX_SAFE_INTEGER
  const bigIntValue = BigInt("9007199254740992");
  assertEquals(bigint.toCBORType(bigIntValue), bigIntValue);

  // Test another large BigInt
  const anotherBigInt = BigInt("18446744073709551615");
  assertEquals(bigint.toCBORType(anotherBigInt), anotherBigInt);
});

Deno.test("BigInt types with valid inputs - fromCBORType", () => {
  // Test BigInt larger than Number.MAX_SAFE_INTEGER
  const bigIntValue = BigInt("9007199254740992");
  assertEquals(bigint.fromCBORType(bigIntValue), bigIntValue);

  // Test another large BigInt
  const anotherBigInt = BigInt("18446744073709551615");
  assertEquals(bigint.fromCBORType(anotherBigInt), anotherBigInt);
}); 