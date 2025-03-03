import { assertThrows } from "jsr:@std/assert";
import { union } from "./union.ts";
import { float } from "./float.ts";
import { string } from "./string.ts";
import { integer } from "./integer.ts";
import { assertEquals } from "jsr:@std/assert";
import type { CBORType } from "../cbor.ts";
import type { CBORSchemaType } from "./type.ts";

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

// Test union schema with non-Error throws
Deno.test("Union types with non-Error throws - fromCBORType", () => {
  // Create a schema that throws a string instead of an Error
  const stringThrowSchema: CBORSchemaType<string> = {
    fromCBORType(data: CBORType): string {
      if (data === "throw-string") {
        throw "This is a string error";
      }
      if (typeof data === "string") {
        return data;
      }
      throw new Error("Expected string");
    },
    toCBORType(value: string): CBORType {
      return value;
    },
  };

  // Create a schema that throws an object in fromCBORType
  const objectThrowSchema: CBORSchemaType<number> = {
    fromCBORType(data: CBORType): number {
      if (data === 42) {
        throw { message: "Custom object error in fromCBORType" };
      }
      if (typeof data === "number") {
        return data;
      }
      throw new Error("Expected number");
    },
    toCBORType(value: number): CBORType {
      return value;
    },
  };

  // Create a union schema with both schemas
  const unionSchema = union([stringThrowSchema, objectThrowSchema]);

  // Test with a regular string (should work)
  const result = unionSchema.fromCBORType("regular-string");
  assertEquals(result, "regular-string");

  // Test with a regular number (should work)
  const result2 = unionSchema.fromCBORType(55);
  assertEquals(result2, 55);

  assertThrows(
    () => unionSchema.fromCBORType(true),
    Error,
    "Value doesn't match any schema in union",
  );

  assertThrows(
    () => unionSchema.fromCBORType([]),
    Error,
    "Value doesn't match any schema in union",
  );

  assertThrows(
    () => unionSchema.fromCBORType(42),
    Error,
    "Value doesn't match any schema in union",
  );

  assertThrows(
    () => unionSchema.fromCBORType("throw-string"),
    Error,
    "Value doesn't match any schema in union",
  );
});

// Test union schema with non-Error throws in toCBORType
Deno.test("Union types with non-Error throws - toCBORType", () => {
  // Create a schema that always throws for any value
  const alwaysThrowSchema: CBORSchemaType<unknown> = {
    fromCBORType(data: CBORType): unknown {
      return data;
    },
    toCBORType(_value: unknown): CBORType {
      throw new Error("Always throws");
    },
  };

  // Create a union with just this schema
  const unionSchema = union([alwaysThrowSchema]);

  // Test that the union schema throws for any value
  assertThrows(
    () => unionSchema.toCBORType("test"),
    Error,
    "Value doesn't match any schema in union for encoding: Always throws",
  );

  assertThrows(
    () => unionSchema.toCBORType(42),
    Error,
    "Value doesn't match any schema in union for encoding: Always throws",
  );

  assertThrows(
    () => unionSchema.toCBORType(true),
    Error,
    "Value doesn't match any schema in union for encoding: Always throws",
  );

  assertThrows(
    () => unionSchema.toCBORType([]),
    Error,
    "Value doesn't match any schema in union for encoding: Always throws",
  );
});

// Test union schema with string and object throws in toCBORType
Deno.test("Union types with string and object throws - toCBORType", () => {
  // Create a schema that throws a string
  const stringThrowSchema: CBORSchemaType<string> = {
    fromCBORType(data: CBORType): string {
      if (typeof data === "string") {
        return data;
      }
      throw new Error("Expected string");
    },
    toCBORType(value: string): CBORType {
      if (value === "throw-string") {
        throw "This is a string error";
      }
      return value;
    },
  };

  // Create a schema that throws an object
  const objectThrowSchema: CBORSchemaType<number> = {
    fromCBORType(data: CBORType): number {
      if (typeof data === "number") {
        return data;
      }
      throw new Error("Expected number");
    },
    toCBORType(value: number): CBORType {
      if (value === 42) {
        throw { message: "Custom object error" };
      }
      return value;
    },
  };

  // Test string throw
  const stringSchema = union([stringThrowSchema]);
  assertThrows(
    () => stringSchema.toCBORType("throw-string"),
    Error,
    "Value doesn't match any schema in union for encoding: This is a string error",
  );

  // Test object throw
  const objectSchema = union([objectThrowSchema]);
  assertThrows(
    () => objectSchema.toCBORType(42),
    Error,
    "Value doesn't match any schema in union for encoding: [object Object]",
  );
});

Deno.test("Empty union schema throws errors", () => {
  // Create an empty union schema
  const emptyUnionSchema = union([]);

  // Test fromCBORType with various inputs
  assertThrows(
    () => emptyUnionSchema.fromCBORType("string"),
    Error,
    "Failed to decode union value",
  );

  assertThrows(
    () => emptyUnionSchema.fromCBORType(42),
    Error,
    "Failed to decode union value",
  );

  assertThrows(
    () => emptyUnionSchema.fromCBORType(true),
    Error,
    "Failed to decode union value",
  );

  assertThrows(
    () => emptyUnionSchema.fromCBORType([]),
    Error,
    "Failed to decode union value",
  );

  // Test toCBORType with various inputs
  assertThrows(
    () => emptyUnionSchema.toCBORType("string" as unknown),
    Error,
    "Failed to encode union value",
  );

  assertThrows(
    () => emptyUnionSchema.toCBORType(42 as unknown),
    Error,
    "Failed to encode union value",
  );

  assertThrows(
    () => emptyUnionSchema.toCBORType(true as unknown),
    Error,
    "Failed to encode union value",
  );

  assertThrows(
    () => emptyUnionSchema.toCBORType([] as unknown),
    Error,
    "Failed to encode union value",
  );
});
