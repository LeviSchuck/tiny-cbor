import { assertThrows } from "jsr:@std/assert";
import { field, map, numberField } from "./map.ts";
import { float } from "./float.ts";
import { string } from "./string.ts";
import { integer } from "./integer.ts";
import { optional } from "./optional.ts";
import { assertEquals } from "jsr:@std/assert";
import type { ExtractFieldType } from "./type.ts";

// Type validation tests
Deno.test("Map types with invalid inputs - fromCBORType", () => {
  const personSchema = map([
    field("name", string),
    field("age", integer),
  ]);

  // Map schema should reject non-maps
  assertThrows(
    () => personSchema.fromCBORType("not a map"),
    Error,
    "Expected Map",
  );

  // Map schema should reject missing required fields
  assertThrows(
    () => personSchema.fromCBORType(new Map([["name", "Alice"]])),
    Error,
    "Missing required field: age",
  );

  // Map schema should reject invalid field types
  assertThrows(
    () =>
      personSchema.fromCBORType(
        new Map([
          ["name", 42],
          ["age", 30],
        ]),
      ),
    Error,
    "Error decoding field name",
  );
});

Deno.test("Map types with invalid inputs - toCBORType", () => {
  const personSchema = map([
    field("name", string),
    field("age", integer),
  ]);

  // Map schema should reject missing required fields
  assertThrows(
    () =>
      personSchema.toCBORType(
        { name: "Alice" } as unknown as ExtractFieldType<typeof personSchema>,
      ),
    Error,
    "Missing required field: age",
  );

  // Map schema should reject invalid field types
  assertThrows(
    () =>
      personSchema.toCBORType(
        { name: 42, age: 30 } as unknown as ExtractFieldType<
          typeof personSchema
        >,
      ),
    Error,
    "Error encoding field name",
  );
});

// Test with valid inputs
Deno.test("Map types with valid inputs", () => {
  // Test basic map schema
  const personSchema = map([
    field("name", string),
    field("age", integer),
  ]);

  const person = {
    name: "Alice",
    age: 30,
  };

  const encodedPerson = personSchema.toCBORType(person);
  assertEquals(personSchema.fromCBORType(encodedPerson), person);

  // Test map schema with optional fields
  const extendedPersonSchema = map([
    field("name", string),
    field("age", integer),
    field("email", optional(string)),
  ]);

  const personWithEmail = {
    name: "Bob",
    age: 25,
    email: "bob@example.com",
  };

  const personWithoutEmail = {
    name: "Charlie",
    age: 35,
  };

  const encodedWithEmail = extendedPersonSchema.toCBORType(personWithEmail);
  const encodedWithoutEmail = extendedPersonSchema.toCBORType(
    personWithoutEmail as unknown as typeof personWithEmail,
  );

  assertEquals(
    extendedPersonSchema.fromCBORType(encodedWithEmail),
    personWithEmail,
  );
  assertEquals(
    extendedPersonSchema.fromCBORType(encodedWithoutEmail),
    personWithoutEmail,
  );

  // Test map schema with number fields
  const scoreSchema = map([
    numberField(1, "math", float),
    numberField(2, "science", float),
  ]);

  const scores = {
    math: 95.5,
    science: 88.0,
  };

  const encodedScores = scoreSchema.toCBORType(scores);
  assertEquals(scoreSchema.fromCBORType(encodedScores), scores);
});
