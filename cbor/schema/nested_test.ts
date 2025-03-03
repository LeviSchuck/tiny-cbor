import { assertThrows } from "jsr:@std/assert";
import { nested } from "./nested.ts";
import { map, field } from "./map.ts";
import { string } from "./string.ts";
import { integer } from "./integer.ts";
import { assertEquals } from "jsr:@std/assert";
import { encodeCBOR } from "../cbor.ts";

// Type validation tests
Deno.test("Nested types with invalid inputs - fromCBORType", () => {
  const metadataSchema = map([
    field("version", integer),
  ]);
  const nestedSchema = nested(metadataSchema);

  // Nested schema should reject non-Uint8Array values
  assertThrows(
    () => nestedSchema.fromCBORType("not a Uint8Array"),
    Error,
    "Expected Uint8Array for nested CBOR",
  );

  // Nested schema should reject invalid CBOR data
  assertThrows(
    () => nestedSchema.fromCBORType(new Uint8Array([0xFF, 0xFF, 0xFF])),
    Error,
    "Error decoding nested CBOR",
  );

  // Nested schema should reject CBOR data that doesn't match inner schema
  const invalidData = encodeCBOR("not a map");
  assertThrows(
    () => nestedSchema.fromCBORType(invalidData),
    Error,
    "Error decoding nested CBOR",
  );
});

Deno.test("Nested types with invalid inputs - toCBORType", () => {
  const metadataSchema = map([
    field("version", integer),
  ]);
  const nestedSchema = nested(metadataSchema);

  // Nested schema should reject values that don't match inner schema
  assertThrows(
    () => nestedSchema.toCBORType({ version: "not a number" } as any),
    Error,
    "Error encoding nested CBOR",
  );
});

// Test with valid inputs
Deno.test("Nested types with valid inputs", () => {
  // Test metadata schema
  const metadataSchema = map([
    field("version", integer),
  ]);

  // Test document schema with nested metadata
  const documentSchema = map([
    field("content", string),
    field("metadata", nested(metadataSchema)),
  ]);

  const doc = {
    content: "Hello",
    metadata: { version: 1 },
  };

  const encodedDoc = documentSchema.toCBORType(doc);
  assertEquals(documentSchema.fromCBORType(encodedDoc), doc);

  // Test deeply nested schema
  const nestedDoc = {
    content: "Nested",
    metadata: {
      version: 2,
    },
  };

  const outerSchema = map([
    field("inner", nested(documentSchema)),
  ]);

  const outer = {
    inner: nestedDoc,
  };

  const encodedOuter = outerSchema.toCBORType(outer);
  assertEquals(outerSchema.fromCBORType(encodedOuter), outer);
}); 