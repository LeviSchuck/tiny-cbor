import { assertThrows } from "jsr:@std/assert";
import { array } from "./array.ts";
import { integer } from "./integer.ts";
import { CBORType } from "../cbor.ts";
import { CBORSchemaType } from "./type.ts";

Deno.test("Test type validation - array schema", () => {
  const numberArraySchema = array(integer);

  // Should reject non-array
  assertThrows(
    () => numberArraySchema.fromCBORType("not an array"),
    Error,
    "Expected array",
  );

  // Should reject array with wrong element type
  assertThrows(
    () => numberArraySchema.fromCBORType([1, "two", 3]),
    Error,
    "Error decoding array item",
  );
});


Deno.test("Test array schema toCBORType exceptions", () => {
  const arraySchema = array(integer);

  // Test with array containing invalid items
  assertThrows(
    () => arraySchema.toCBORType([1, 2, "hello" as unknown as number, 4]),
    Error,
    "Error encoding array item at index 2",
  );
});

// Test array schema with element-specific exceptions
Deno.test("Test array schema element-specific exceptions - fromCBORType", () => {
  // Create a schema that will throw a custom error for a specific element
  const customErrorSchema: CBORSchemaType<string> = {
    fromCBORType(data: CBORType): string {
      if (data === "trigger-error") {
        throw new Error("Custom error triggered");
      }
      if (typeof data !== "string") {
        throw new Error("Expected string");
      }
      return data;
    },
    toCBORType(value: string): CBORType {
      return value;
    },
  };

  const arraySchema = array(customErrorSchema);

  // Test with array containing the error-triggering element
  assertThrows(
    () => arraySchema.fromCBORType(["ok", "fine", "trigger-error", "good"]),
    Error,
    "Error decoding array item at index 2: Custom error triggered",
  );

  // Test with array containing an element of wrong type
  assertThrows(
    () => arraySchema.fromCBORType(["ok", 123, "good"]),
    Error,
    "Error decoding array item at index 1: Expected string",
  );

  // Test with nested array containing error-triggering element
  const nestedArraySchema = array(array(customErrorSchema));
  assertThrows(
    () =>
      nestedArraySchema.fromCBORType([
        ["ok", "fine"],
        ["good", "trigger-error", "ok"],
        ["all", "good"],
      ]),
    Error,
    "Error decoding array item at index 1",
  );
});
