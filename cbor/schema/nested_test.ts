import { assertThrows } from "jsr:@std/assert";
import { nested } from "./nested.ts";
import { field, map } from "./map.ts";
import { string } from "./string.ts";
import { integer } from "./integer.ts";
import { assertEquals } from "jsr:@std/assert";
import { encodeCBOR } from "../cbor.ts";
import type { ExtractFieldType } from "./type.ts";
import type { CBORType } from "../cbor.ts";
import type { CBORSchemaType } from "./type.ts";

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
    () =>
      nestedSchema.toCBORType(
        { version: "not a number" } as unknown as ExtractFieldType<
          typeof nestedSchema
        >,
      ),
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

// Test nested schema with non-Error throws
Deno.test("Test nested schema with non-Error throws", () => {
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

  const innerSchema = map([
    field("field1", nonErrorSchema),
    field("field2", string),
  ]);

  const nestedSchema = nested(innerSchema);

  // Test string throw in fromCBORType
  const stringThrowData = encodeCBOR(
    new Map([
      ["field1", "throw-string"],
      ["field2", "ok"],
    ]),
  );
  assertThrows(
    () => nestedSchema.fromCBORType(stringThrowData),
    Error,
    "Error decoding nested CBOR: Error decoding field field1: String error in fromCBORType",
  );

  // Test object throw in fromCBORType
  const objectThrowData = encodeCBOR(
    new Map([
      ["field1", "throw-object"],
      ["field2", "ok"],
    ]),
  );
  assertThrows(
    () => nestedSchema.fromCBORType(objectThrowData),
    Error,
    "Error decoding nested CBOR: Error decoding field field1: [object Object]",
  );

  // Test string throw in toCBORType
  assertThrows(
    () =>
      nestedSchema.toCBORType({
        field1: "throw-string-encode",
        field2: "ok",
      } as ExtractFieldType<typeof nestedSchema>),
    Error,
    "Error encoding nested CBOR: Error encoding field field1: String error in toCBORType",
  );

  // Test object throw in toCBORType
  assertThrows(
    () =>
      nestedSchema.toCBORType({
        field1: "throw-object-encode",
        field2: "ok",
      } as ExtractFieldType<typeof nestedSchema>),
    Error,
    "Error encoding nested CBOR: Error encoding field field1: [object Object]",
  );
});

// Test nested schema with direct child schema errors
Deno.test("Test nested schema with direct child schema errors", () => {
  // Create schemas that throw errors for testing
  const errorThrowingSchema: CBORSchemaType<unknown> = {
    fromCBORType: (_: unknown): never => {
      throw new Error("Custom error from schema");
    },
    toCBORType: (_: unknown): never => {
      throw new Error("Custom error during encoding");
    },
  };

  const nonErrorThrowingSchema: CBORSchemaType<unknown> = {
    fromCBORType: (_: unknown): never => {
      throw "String error message";
    },
    toCBORType: (_: unknown): never => {
      throw "String error during encoding";
    },
  };

  // Test Error object in fromCBORType
  const errorNestedSchema = nested(errorThrowingSchema);
  const validData = encodeCBOR("test-data");

  assertThrows(
    () => errorNestedSchema.fromCBORType(validData),
    Error,
    "Error decoding nested CBOR: Custom error from schema",
  );

  // Test non-Error object in fromCBORType
  const nonErrorNestedSchema = nested(nonErrorThrowingSchema);

  assertThrows(
    () => nonErrorNestedSchema.fromCBORType(validData),
    Error,
    "Error decoding nested CBOR: String error message",
  );

  // Test Error object in toCBORType
  assertThrows(
    () => errorNestedSchema.toCBORType("test-value"),
    Error,
    "Error encoding nested CBOR: Custom error during encoding",
  );

  // Test non-Error object in toCBORType
  assertThrows(
    () => nonErrorNestedSchema.toCBORType("test-value"),
    Error,
    "Error encoding nested CBOR: String error during encoding",
  );
});

// Test nested schema with multiple levels of error propagation
Deno.test("Test nested schema with multiple levels of error propagation", () => {
  // Create schemas that throw errors for testing
  const errorThrowingSchema: CBORSchemaType<unknown> = {
    fromCBORType: (_: unknown): never => {
      throw new Error("Inner schema error");
    },
    toCBORType: (_: unknown): never => {
      throw new Error("Inner schema encoding error");
    },
  };

  // Create a double-nested schema to test error propagation
  const innerNestedSchema = nested(errorThrowingSchema);
  const outerNestedSchema = nested(innerNestedSchema);

  const validData = encodeCBOR(encodeCBOR("test-data"));

  // Test error propagation in fromCBORType
  assertThrows(
    () => outerNestedSchema.fromCBORType(validData),
    Error,
    "Error decoding nested CBOR: Error decoding nested CBOR: Inner schema error",
  );

  // Test error propagation in toCBORType
  assertThrows(
    () => outerNestedSchema.toCBORType("test-value"),
    Error,
    "Error encoding nested CBOR: Error encoding nested CBOR: Inner schema encoding error",
  );
});
