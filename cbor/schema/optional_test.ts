import { assertThrows } from "jsr:@std/assert";
import { optional } from "./optional.ts";
import { float } from "./float.ts";
import { string } from "./string.ts";
import { assertEquals } from "jsr:@std/assert";
import type { CBORType } from "../cbor.ts";
import type { CBORSchemaType } from "./type.ts";

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
    () =>
      optionalNumberSchema.toCBORType(
        "not a number" as unknown as number | undefined,
      ),
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
  assertEquals(
    optionalStringSchema.fromCBORType(encodedStrUndefined),
    undefined,
  );
});

// Test custom type throwing Error in optional values
Deno.test("Test custom type throwing Error in optional values", () => {
  // Create a schema that will throw a custom error for specific values
  const customErrorSchema: CBORSchemaType<string> = {
    fromCBORType(data: CBORType): string {
      if (data === "trigger-error") {
        throw new Error("Custom error triggered in fromCBORType");
      }
      if (typeof data !== "string") {
        throw new Error("Expected string");
      }
      return data;
    },
    toCBORType(value: string): CBORType {
      if (value === "trigger-error") {
        throw new Error("Custom error triggered in toCBORType");
      }
      return value;
    },
  };

  const optionalSchema = optional(customErrorSchema);

  // Test with error-triggering value in fromCBORType
  assertThrows(
    () => optionalSchema.fromCBORType("trigger-error"),
    Error,
    "Custom error triggered in fromCBORType",
  );

  // Test with error-triggering value in toCBORType
  assertThrows(
    () => optionalSchema.toCBORType("trigger-error"),
    Error,
    "Custom error triggered in toCBORType",
  );

  // Test with undefined in toCBORType (should not throw)
  const encodedUndefined = optionalSchema.toCBORType(undefined);
  assertEquals(optionalSchema.fromCBORType(encodedUndefined), undefined);
});

// Test custom type throwing non-Error in optional values
Deno.test("Test custom type throwing non-Error in optional values", () => {
  // Create a schema that throws non-Error objects
  const nonErrorSchema: CBORSchemaType<string> = {
    fromCBORType(data: CBORType): string {
      if (data === "throw-string") {
        throw "String error in fromCBORType";
      }
      if (data === "throw-object") {
        throw { reason: "Custom object error in fromCBORType" };
      }
      return String(data);
    },
    toCBORType(value: string): CBORType {
      if (value === "throw-string-encode") {
        throw "String error in toCBORType";
      }
      if (value === "throw-object-encode") {
        throw { reason: "Custom object error in toCBORType" };
      }
      return value;
    },
  };

  const optionalSchema = optional(nonErrorSchema);

  // Test string throw in fromCBORType
  assertThrows(
    () => optionalSchema.fromCBORType("throw-string"),
    Error,
    "String error in fromCBORType",
  );

  // Test object throw in fromCBORType
  assertThrows(
    () => optionalSchema.fromCBORType("throw-object"),
    Error,
    "[object Object]",
  );

  // Test string throw in toCBORType
  assertThrows(
    () => optionalSchema.toCBORType("throw-string-encode"),
    Error,
    "String error in toCBORType",
  );

  // Test object throw in toCBORType
  assertThrows(
    () => optionalSchema.toCBORType("throw-object-encode"),
    Error,
    "[object Object]",
  );

  // Test with undefined in toCBORType (should not throw)
  const encodedUndefined = optionalSchema.toCBORType(undefined);
  assertEquals(optionalSchema.fromCBORType(encodedUndefined), undefined);
});
