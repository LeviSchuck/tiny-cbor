import { assertThrows } from "jsr:@std/assert";
import { assertEquals } from "jsr:@std/assert";
import { literal } from "./literal.ts";

// Test string literals
Deno.test("Test string literals", () => {
  const schema = literal("hello");

  // Test valid string
  assertEquals(schema.fromCBORType("hello"), "hello");
  assertEquals(schema.toCBORType("hello"), "hello");

  // Test invalid string
  assertThrows(
    () => schema.fromCBORType("world" as "hello"),
    Error,
    "Expected hello, got world",
  );
  assertThrows(
    () => schema.toCBORType("world" as "hello"),
    Error,
    "Expected hello, got world",
  );

  // Test wrong type
  assertThrows(
    () => schema.fromCBORType(42),
    Error,
    "Expected string, got number",
  );
  assertThrows(
    () => schema.toCBORType(42 as unknown as "hello"),
    Error,
    "Expected string, got number",
  );

  // Test Uint8Array when string expected
  assertThrows(
    () => schema.fromCBORType(new Uint8Array([1, 2, 3])),
    Error,
    "Expected string, got Uint8Array",
  );
  assertThrows(
    () => schema.toCBORType(new Uint8Array([1, 2, 3]) as unknown as "hello"),
    Error,
    "Expected string, got Uint8Array",
  );
});

// Test number literals
Deno.test("Test number literals", () => {
  const schema = literal(42);

  // Test valid number
  assertEquals(schema.fromCBORType(42), 42);
  assertEquals(schema.toCBORType(42), 42);

  // Test invalid number
  assertThrows(
    () => schema.fromCBORType(43 as 42),
    Error,
    "Expected 42, got 43",
  );
  assertThrows(
    () => schema.toCBORType(43 as 42),
    Error,
    "Expected 42, got 43",
  );

  // Test wrong type
  assertThrows(
    () => schema.fromCBORType("42"),
    Error,
    "Expected number, got string",
  );
  assertThrows(
    () => schema.toCBORType("42" as unknown as 42),
    Error,
    "Expected number, got string",
  );

  // Test Uint8Array when number expected
  assertThrows(
    () => schema.fromCBORType(new Uint8Array([1, 2, 3])),
    Error,
    "Expected number, got Uint8Array",
  );
  assertThrows(
    () => schema.toCBORType(new Uint8Array([1, 2, 3]) as unknown as 42),
    Error,
    "Expected number, got Uint8Array",
  );
});

// Test bigint literals
Deno.test("Test bigint literals", () => {
  const bigValue = 18446744073709551615n;
  const schema = literal(bigValue);

  // Test valid bigint
  assertEquals(schema.fromCBORType(bigValue), bigValue);
  assertEquals(schema.toCBORType(bigValue), bigValue);

  // Test invalid bigint
  assertThrows(
    () => schema.fromCBORType(18446744073709551614n as typeof bigValue),
    Error,
    "Expected 18446744073709551615, got 18446744073709551614",
  );
  assertThrows(
    () => schema.toCBORType(18446744073709551614n as typeof bigValue),
    Error,
    "Expected 18446744073709551615, got 18446744073709551614",
  );

  // Test wrong type
  assertThrows(
    () => schema.fromCBORType(42),
    Error,
    "Expected bigint, got number",
  );
  assertThrows(
    () => schema.toCBORType(42 as unknown as typeof bigValue),
    Error,
    "Expected bigint, got number",
  );

  // Test Uint8Array when bigint expected
  assertThrows(
    () => schema.fromCBORType(new Uint8Array([1, 2, 3])),
    Error,
    "Expected bigint, got Uint8Array",
  );
  assertThrows(
    () =>
      schema.toCBORType(
        new Uint8Array([1, 2, 3]) as unknown as typeof bigValue,
      ),
    Error,
    "Expected bigint, got Uint8Array",
  );
});

// Test boolean literals
Deno.test("Test boolean literals", () => {
  const schema = literal(true);

  // Test valid boolean
  assertEquals(schema.fromCBORType(true), true);
  assertEquals(schema.toCBORType(true), true);

  // Test invalid boolean
  assertThrows(
    () => schema.fromCBORType(false as true),
    Error,
    "Expected true, got false",
  );
  assertThrows(
    () => schema.toCBORType(false as true),
    Error,
    "Expected true, got false",
  );

  // Test wrong type
  assertThrows(
    () => schema.fromCBORType(1),
    Error,
    "Expected boolean, got number",
  );
  assertThrows(
    () => schema.toCBORType(1 as unknown as true),
    Error,
    "Expected boolean, got number",
  );

  // Test Uint8Array when boolean expected
  assertThrows(
    () => schema.fromCBORType(new Uint8Array([1, 2, 3])),
    Error,
    "Expected boolean, got Uint8Array",
  );
  assertThrows(
    () => schema.toCBORType(new Uint8Array([1, 2, 3]) as unknown as true),
    Error,
    "Expected boolean, got Uint8Array",
  );
});

// Test Uint8Array literals
Deno.test("Test Uint8Array literals", () => {
  const value = new Uint8Array([1, 2, 3]);
  const schema = literal(value);

  // Test valid Uint8Array
  assertEquals(schema.fromCBORType(value), value);
  assertEquals(schema.toCBORType(value), value);

  // Test invalid Uint8Array (different length)
  assertThrows(
    () => schema.fromCBORType(new Uint8Array([1, 2])),
    Error,
    "Expected Uint8Array of length 3, got 2",
  );
  assertThrows(
    () => schema.toCBORType(new Uint8Array([1, 2])),
    Error,
    "Expected Uint8Array of length 3, got 2",
  );

  // Test invalid Uint8Array (different values)
  assertThrows(
    () => schema.fromCBORType(new Uint8Array([1, 2, 4])),
    Error,
    "Uint8Array values do not match at index 2",
  );
  assertThrows(
    () => schema.toCBORType(new Uint8Array([1, 2, 4])),
    Error,
    "Uint8Array values do not match at index 2",
  );

  // Test wrong type (regular array)
  assertThrows(
    () => schema.fromCBORType([1, 2, 3]),
    Error,
    "Expected Uint8Array, got object",
  );
  assertThrows(
    () => schema.toCBORType([1, 2, 3] as unknown as typeof value),
    Error,
    "Expected Uint8Array, got object",
  );

  // Test wrong type (empty array)
  assertThrows(
    () => schema.fromCBORType([]),
    Error,
    "Expected Uint8Array, got object",
  );
  assertThrows(
    () => schema.toCBORType([] as unknown as typeof value),
    Error,
    "Expected Uint8Array, got object",
  );

  // Test wrong type (array with wrong values)
  assertThrows(
    () => schema.fromCBORType(["1", "2", "3"]),
    Error,
    "Expected Uint8Array, got object",
  );
  assertThrows(
    () => schema.toCBORType(["1", "2", "3"] as unknown as typeof value),
    Error,
    "Expected Uint8Array, got object",
  );
});

// Test null literals
Deno.test("Test null literals", () => {
  const schema = literal(null);

  // Test valid null
  assertEquals(schema.fromCBORType(null), null);
  assertEquals(schema.toCBORType(null), null);

  // Test undefined when null expected
  assertThrows(
    () => schema.fromCBORType(undefined as unknown as null),
    Error,
    "Expected null, got undefined",
  );
  assertThrows(
    () => schema.toCBORType(undefined as unknown as null),
    Error,
    "Expected null, got undefined",
  );

  // Test wrong type
  assertThrows(
    () => schema.fromCBORType("null"),
    Error,
    "Expected null, got string",
  );
  assertThrows(
    () => schema.toCBORType("null" as unknown as null),
    Error,
    "Expected null, got string",
  );

  // Test Uint8Array when null expected
  assertThrows(
    () => schema.fromCBORType(new Uint8Array([1, 2, 3])),
    Error,
    "Expected null, got Uint8Array",
  );
  assertThrows(
    () => schema.toCBORType(new Uint8Array([1, 2, 3]) as unknown as null),
    Error,
    "Expected null, got Uint8Array",
  );
});

// Test undefined literals
Deno.test("Test undefined literals", () => {
  const schema = literal(undefined);

  // Test valid undefined
  assertEquals(schema.fromCBORType(undefined), undefined);
  assertEquals(schema.toCBORType(undefined), undefined);

  // Test null when undefined expected
  assertThrows(
    () => schema.fromCBORType(null as unknown as undefined),
    Error,
    "Expected undefined, got null",
  );
  assertThrows(
    () => schema.toCBORType(null as unknown as undefined),
    Error,
    "Expected undefined, got null",
  );

  // Test wrong type
  assertThrows(
    () => schema.fromCBORType("undefined"),
    Error,
    "Expected undefined, got string",
  );
  assertThrows(
    () => schema.toCBORType("undefined" as unknown as undefined),
    Error,
    "Expected undefined, got string",
  );

  // Test Uint8Array when undefined expected
  assertThrows(
    () => schema.fromCBORType(new Uint8Array([1, 2, 3])),
    Error,
    "Expected undefined, got Uint8Array",
  );
  assertThrows(
    () => schema.toCBORType(new Uint8Array([1, 2, 3]) as unknown as undefined),
    Error,
    "Expected undefined, got Uint8Array",
  );
});
