import { assertEquals, assertThrows } from "jsr:@std/assert";
import { cs } from "../cbor_schema.ts";
import { lazy } from "./lazy.ts";
import type { CBORSchemaType } from "./type.ts";
import type { CBORType } from "../cbor.ts";
import { assertStringIncludes } from "jsr:@std/assert/string-includes";

Deno.test("Test basic lazy schema", () => {
  // Create a simple lazy schema
  const numberSchema = cs.integer;
  const lazyNumberSchema = lazy(() => numberSchema);

  // Test encoding and decoding
  const value = 42;
  const encoded = lazyNumberSchema.toCBORType(value);
  const decoded = lazyNumberSchema.fromCBORType(encoded);
  assertEquals(decoded, value);

  // Test error handling
  assertThrows(
    () => lazyNumberSchema.fromCBORType("not a number"),
    Error,
    "Expected integer",
  );
});

Deno.test("Test recursive lazy schema", () => {
  // Define a recursive tree structure
  type Tree = {
    value: string;
    children: Tree[];
  };

  // Define the schema with proper type annotation
  const treeSchema: CBORSchemaType<Tree> = cs.map([
    cs.field("value", cs.string),
    cs.field("children", cs.array(lazy(() => treeSchema))),
  ]);

  // Test with a simple tree
  const simpleTree: Tree = {
    value: "root",
    children: [
      {
        value: "child1",
        children: [],
      },
      {
        value: "child2",
        children: [
          {
            value: "grandchild",
            children: [],
          },
        ],
      },
    ],
  };

  // Test round trip
  const encoded = treeSchema.toCBORType(simpleTree);
  const decoded = treeSchema.fromCBORType(encoded);
  assertEquals(decoded, simpleTree);

  // Test with invalid data
  const invalidData = new Map<string, string | number | string[]>([
    ["value", 123],
    ["children", []],
  ]);

  assertThrows(
    () => treeSchema.fromCBORType(invalidData),
    Error,
    "Expected string",
  );
});

Deno.test("Test lazy schema fallback behavior for missing try functions", () => {
  // Create a schema without try functions
  const basicSchema = {
    fromCBORType(data: CBORType): number {
      if (typeof data !== "number") {
        throw new Error("Expected number");
      }
      return data;
    },
    toCBORType(value: number): CBORType {
      if (typeof value !== "number") {
        throw new Error("Expected number");
      }
      return value;
    },
  } as CBORSchemaType<number>;

  const lazyBasicSchema = lazy(() => basicSchema);

  // Test successful conversion should use fromCBORType/toCBORType
  const [success1, result1] = lazyBasicSchema.tryFromCBORType!(42);
  assertEquals(success1, true);
  assertEquals(result1, 42);

  const [success2, result2] = lazyBasicSchema.tryToCBORType!(42);
  assertEquals(success2, true);
  assertEquals(result2, 42);

  // Test error handling with Error object
  const [success3, error1] = lazyBasicSchema.tryFromCBORType!("not a number");
  assertEquals(success3, false);
  assertStringIncludes(error1 as string, "Expected number");

  const [success4, error2] = lazyBasicSchema.tryToCBORType!(
    "not a number" as unknown as number,
  );
  assertEquals(success4, false);
  assertStringIncludes(error2 as string, "Expected number");
});

Deno.test("Test lazy schema fallback with non-Error throws", () => {
  // Create a schema that throws non-Error objects
  const errorThrowingSchema = {
    fromCBORType(_data: CBORType): number {
      throw "Custom error string";
    },
    toCBORType(_value: number): CBORType {
      throw { custom: "error object" };
    },
  } as CBORSchemaType<number>;

  const lazyErrorSchema = lazy(() => errorThrowingSchema);

  // Test handling of string throw
  const [success1, error1] = lazyErrorSchema.tryFromCBORType!(42);
  assertEquals(success1, false);
  assertStringIncludes(error1 as string, "Custom error string");

  // Test handling of object throw
  const [success2, error2] = lazyErrorSchema.tryToCBORType!(42);
  assertEquals(success2, false);
  assertStringIncludes(error2 as string, "[object Object]");
});

Deno.test("Test lazy schema with implemented try functions", () => {
  // Create a schema that implements try functions
  const fullSchema = {
    fromCBORType(data: CBORType): number {
      if (typeof data !== "number") {
        throw new Error("Should not be called");
      }
      return data;
    },
    toCBORType(value: number): CBORType {
      if (typeof value !== "number") {
        throw new Error("Should not be called");
      }
      return value;
    },
    tryFromCBORType(data: CBORType): [true, number] | [false, string] {
      if (typeof data !== "number") {
        return [false, "Custom try error: Expected number"];
      }
      return [true, data];
    },
    tryToCBORType(value: number): [true, CBORType] | [false, string] {
      if (typeof value !== "number") {
        return [false, "Custom try error: Expected number"];
      }
      return [true, value];
    },
  };

  const lazyFullSchema = lazy(() => fullSchema);

  // Test that try functions are used directly
  const [success1, result1] = lazyFullSchema.tryFromCBORType!(42);
  assertEquals(success1, true);
  assertEquals(result1, 42);

  const [success2, result2] = lazyFullSchema.tryToCBORType!(42);
  assertEquals(success2, true);
  assertEquals(result2, 42);

  // Test error handling through try functions
  const [success3, error1] = lazyFullSchema.tryFromCBORType!("not a number");
  assertEquals(success3, false);
  assertStringIncludes(error1 as string, "Custom try error: Expected number");

  const [success4, error2] = lazyFullSchema.tryToCBORType!(
    "not a number" as unknown as number,
  );
  assertEquals(success4, false);
  assertEquals(error2, "Custom try error: Expected number");
});
