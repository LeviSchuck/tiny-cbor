import { assertThrows } from "jsr:@std/assert";
import { tuple } from "./tuple.ts";
import { float } from "./float.ts";
import { string } from "./string.ts";
import { assertEquals } from "jsr:@std/assert";
import { integer } from "./integer.ts";
import { boolean } from "./boolean.ts";

// Type validation tests
Deno.test("Tuple types with invalid inputs - fromCBORType", () => {
  const pointSchema = tuple([float, float]);

  // Tuple schema should reject non-arrays
  assertThrows(
    () => pointSchema.fromCBORType("not an array"),
    Error,
    "Expected array for tuple",
  );

  // Tuple schema should reject arrays of wrong length
  assertThrows(
    () => pointSchema.fromCBORType([1]),
    Error,
    "Expected tuple of length 2",
  );

  // Tuple schema should reject arrays with wrong types
  assertThrows(
    () => pointSchema.fromCBORType([1, "2"]),
    Error,
    "Error decoding tuple item at index 1",
  );
});

Deno.test("Tuple types with invalid inputs - toCBORType", () => {
  const pointSchema = tuple([float, float]);

  // Tuple schema should reject non-arrays
  assertThrows(
    () => pointSchema.toCBORType("not an array" as unknown as [number, number]),
    Error,
    "Expected tuple of length 2",
  );

  // Tuple schema should reject arrays of wrong length
  assertThrows(
    () => pointSchema.toCBORType([1] as unknown as [number, number]),
    Error,
    "Expected tuple of length 2",
  );

  // Tuple schema should reject arrays with wrong types
  assertThrows(
    () => pointSchema.toCBORType([1, "2"] as unknown as [number, number]),
    Error,
    "Error encoding tuple item at index 1",
  );
});

// Test with valid inputs
Deno.test("Tuple types with valid inputs", () => {
  // Test point schema (two floats)
  const pointSchema = tuple([float, float]);
  const point: [number, number] = [10.5, 20.7];
  const encodedPoint = pointSchema.toCBORType(point);
  assertEquals(pointSchema.fromCBORType(encodedPoint), point);

  // Test mixed schema (string and float)
  const mixedSchema = tuple([string, float]);
  const mixed: [string, number] = ["test", 42.5];
  const encodedMixed = mixedSchema.toCBORType(mixed);
  assertEquals(mixedSchema.fromCBORType(encodedMixed), mixed);

  // Test empty tuple schema
  const emptySchema = tuple([]);
  const empty: [] = [];
  const encodedEmpty = emptySchema.toCBORType(empty);
  assertEquals(emptySchema.fromCBORType(encodedEmpty), empty);
});

type AssertEqual<T, Expected> = T extends Expected ? Expected extends T ? T
  : never
  : never;

// Tuple test
Deno.test("Test tuple schema", () => {
  const personTupleSchema = tuple([string, integer, boolean]);
  const testTuple = ["John", 30, true] as [string, number, boolean];
  const encoded = personTupleSchema.toCBORType(testTuple);
  const decoded = personTupleSchema.fromCBORType(encoded);
  assertEquals(decoded, testTuple);
  const tsCheckOnly: AssertEqual<[string, number, boolean], typeof decoded> =
    decoded;
  assertEquals(tsCheckOnly, testTuple);
});
