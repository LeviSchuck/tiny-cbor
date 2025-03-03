import { assertThrows } from "jsr:@std/assert";
import { array } from "./array.ts";
import { integer } from "./integer.ts";
import type { CBORType } from "../cbor.ts";
import type { CBORSchemaType } from "./type.ts";

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

// Test array schema with non-Error throws
Deno.test("Test array schema with non-Error throws", () => {
  // Create a schema that throws a string instead of an Error
  const stringThrowSchema: CBORSchemaType<string> = {
    fromCBORType(data: CBORType): string {
      if (data === "throw-string") {
        throw "This is a string error";
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

  const arraySchema = array(stringThrowSchema);

  // Test with array containing an element that triggers a string throw
  assertThrows(
    () => arraySchema.fromCBORType(["ok", "throw-string", "good"]),
    Error,
    "Error decoding array item at index 1: This is a string error",
  );

  // Test throwing a non-Error object in toCBORType
  const objectThrowSchema: CBORSchemaType<string> = {
    fromCBORType(data: CBORType): string {
      return String(data);
    },
    toCBORType(value: string): CBORType {
      if (value === "throw-object") {
        throw { message: "Custom object error" };
      }
      return value;
    },
  };

  const arraySchema2 = array(objectThrowSchema);

  // Test with array containing an element that triggers an object throw in toCBORType
  assertThrows(
    () => arraySchema2.toCBORType(["ok", "throw-object", "good"]),
    Error,
    "Error encoding array item at index 1: [object Object]",
  );
});
