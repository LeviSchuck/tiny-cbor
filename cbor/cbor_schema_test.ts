import { assertEquals, assertThrows } from "jsr:@std/assert";
import { cs } from "./cbor_schema.ts";
import { decodeCBOR } from "./cbor.ts";

// Basic object test
const ObjectDefinition = cs.map([
  cs.field("name", cs.string),
  cs.field("age", cs.integer),
  cs.numberField(3, "isAdmin", cs.boolean),
]);

Deno.test("Test basic object schema", () => {
  const cbor = new Uint8Array([
    0xA3,
    0x64,
    0x6E,
    0x61,
    0x6D,
    0x65,
    0x63,
    0x4A,
    0x6F,
    0x65,
    0x63,
    0x61,
    0x67,
    0x65,
    0x18,
    0x2D,
    0x03,
    0xF5,
  ]);
  const object = cs.decode(ObjectDefinition, cbor);
  assertEquals(object.name, "Joe");
  assertEquals(object.age, 45);
  assertEquals(object.isAdmin, true);
});

// Type validation tests
Deno.test("Test type validation - primitive types", () => {
  // String schema should reject numbers
  assertThrows(
    () => cs.string.decode(42),
    Error,
    "Expected string",
  );

  // Integer schema should reject strings
  assertThrows(
    () => cs.integer.decode("42"),
    Error,
    "Expected uint8",
  );

  // Integer schema should reject floats
  assertThrows(
    () => cs.integer.decode(42.5),
    Error,
    "Expected uint8",
  );

  // Boolean schema should reject strings
  assertThrows(
    () => cs.boolean.decode("true"),
    Error,
    "Expected boolean",
  );
});

Deno.test("Test type validation - array schema", () => {
  const numberArraySchema = cs.array(cs.integer);

  // Should reject non-array
  assertThrows(
    () => numberArraySchema.decode("not an array"),
    Error,
    "Expected array",
  );

  // Should reject array with wrong element type
  assertThrows(
    () => numberArraySchema.decode([1, "two", 3]),
    Error,
    "Error decoding array item",
  );
});

Deno.test("Test type validation - tuple schema", () => {
  const personTupleSchema = cs.tuple([cs.string, cs.integer, cs.boolean]);

  // Should reject non-array
  assertThrows(
    () => personTupleSchema.decode("not a tuple"),
    Error,
    "Expected array for tuple",
  );

  // Should reject tuple with wrong length
  assertThrows(
    () => personTupleSchema.decode(["John", 30]),
    Error,
    "Expected tuple of length 3",
  );

  // Should reject tuple with wrong types
  assertThrows(
    () => personTupleSchema.decode(["John", "30", true]),
    Error,
    "Error decoding tuple item",
  );
});

Deno.test("Test type validation - union schema", () => {
  const stringOrNumberSchema = cs.union([cs.string, cs.float]);

  // Should reject values not in union
  assertThrows(
    () => stringOrNumberSchema.decode(true),
    Error,
    "Value doesn't match any schema in union",
  );

  assertThrows(
    () => stringOrNumberSchema.decode(new Map()),
    Error,
    "Value doesn't match any schema in union",
  );
});

Deno.test("Test type validation - map schema", () => {
  const userSchema = cs.map([
    cs.field("name", cs.string),
    cs.field("age", cs.integer),
  ]);

  // Should reject non-map values
  assertThrows(
    () => userSchema.decode([]),
    Error,
    "Expected Map",
  );

  // Should reject missing required fields
  assertThrows(
    () => userSchema.decode(new Map([["name", "John"]])), // missing age
    Error,
    "Missing required field",
  );

  // Should reject wrong field types
  assertThrows(
    () =>
      userSchema.decode(
        new Map([
          ["name", "John"],
          ["age", "30"], // age should be number
        ]),
      ),
    Error,
    "Error decoding field age",
  );
});

// Array test
Deno.test("Test array schema", () => {
  const stringArraySchema = cs.array(cs.string);
  const testArray = ["hello", "world", "test"];
  const encoded = cs.encode(stringArraySchema, testArray);
  const decoded = cs.decode(stringArraySchema, encoded);
  assertEquals(decoded, testArray);
});

// Tuple test
Deno.test("Test tuple schema", () => {
  const personTupleSchema = cs.tuple([cs.string, cs.integer, cs.boolean]);
  const testTuple = ["John", 30, true];
  const encoded = cs.encode(personTupleSchema, testTuple);
  const decoded = cs.decode(personTupleSchema, encoded);
  assertEquals(decoded, testTuple);
});

// Union test
Deno.test("Test union schema", () => {
  const stringOrNumberSchema = cs.union([cs.string, cs.float]);

  // Test string case
  const stringValue = "hello";
  const encodedString = cs.encode(stringOrNumberSchema, stringValue);
  const decodedString = cs.decode(stringOrNumberSchema, encodedString);
  assertEquals(decodedString, stringValue);

  // Test number case
  const numberValue = 42.5;
  const encodedNumber = cs.encode(stringOrNumberSchema, numberValue);
  const decodedNumber = cs.decode(stringOrNumberSchema, encodedNumber);
  assertEquals(decodedNumber, numberValue);
});

// Tagged value test
Deno.test("Test tagged schema", () => {
  const timestampSchema = cs.tagged(123, cs.string);
  const timestamp = "2023-01-01T00:00:00Z";
  const encoded = cs.encode(timestampSchema, timestamp);
  const decoded = cs.decode(timestampSchema, encoded);
  assertEquals(decoded, timestamp);
});

// Complex object with optional fields test
Deno.test("Test complex object schema", () => {
  const userSchema = cs.map([
    cs.field("name", cs.string),
    cs.field("age", cs.integer),
    cs.field("tags", cs.array(cs.string)),
    cs.field(
      "metadata",
      cs.optional(cs.map([
        cs.field("createdAt", cs.string),
        cs.field("updatedAt", cs.string),
      ])),
    ),
  ]);

  const testUser = {
    name: "John",
    age: 30,
    tags: ["developer", "typescript"],
    metadata: {
      createdAt: "2023-01-01",
      updatedAt: "2023-01-02",
    },
  };

  const encoded = cs.encode(userSchema, testUser);
  const decoded = cs.decode(userSchema, encoded);
  assertEquals(decoded, testUser);

  // Test with optional field omitted
  const testUserNoMetadata = {
    name: "Jane",
    age: 25,
    tags: ["designer", "ui"],
    metadata: undefined,
  };

  const encodedNoMeta = cs.encode(userSchema, testUserNoMetadata);
  const decodedNoMeta = cs.decode(userSchema, encodedNoMeta);
  assertEquals(decodedNoMeta, testUserNoMetadata);
});

// Nested CBOR test
Deno.test("Test nested CBOR schema", () => {
  // Define an inner object schema
  const innerSchema = cs.map([
    cs.field("x", cs.integer),
    cs.field("y", cs.integer),
  ]);

  // Create a schema that nests the inner object
  const outerSchema = cs.map([
    cs.field("name", cs.string),
    cs.field("coordinates", cs.nested(innerSchema)),
  ]);

  // Test data
  const testData = {
    name: "Point A",
    coordinates: {
      x: 10,
      y: 20,
    },
  };

  // Test encoding and decoding
  const encoded = cs.encode(outerSchema, testData);
  const decoded = cs.decode(outerSchema, encoded);
  assertEquals(decoded, testData);
});

Deno.test("Test nested CBOR schema validation", () => {
  const innerSchema = cs.map([
    cs.field("value", cs.integer),
  ]);
  const nestedSchema = cs.nested(innerSchema);

  // Should reject non-bytes values
  assertThrows(
    () => nestedSchema.decode("not bytes"),
    Error,
    "Expected Uint8Array for nested CBOR",
  );

  // Should reject invalid CBOR bytes
  assertThrows(
    () => nestedSchema.decode(new Uint8Array([0xFF, 0xFF])), // Invalid CBOR bytes
    Error,
    "Error decoding nested CBOR",
  );

  // Should reject inner content that doesn't match schema
  const invalidInner = {
    value: "not a number", // Should be integer
  };
  assertThrows(
    () => {
      const encoded = cs.encode(
        cs.map([
          cs.field("value", cs.string),
        ]),
        invalidInner,
      );
      nestedSchema.decode(encoded);
    },
    Error,
    "Error decoding nested CBOR",
  );
});

// Complex nested CBOR test
Deno.test("Test complex nested CBOR schema", () => {
  // Define schemas for different parts of the structure
  const locationSchema = cs.map([
    cs.field("latitude", cs.float),
    cs.field("longitude", cs.float),
  ]);

  const metadataSchema = cs.map([
    cs.field("created", cs.string),
    cs.field("tags", cs.array(cs.string)),
  ]);

  // Create a complex schema with multiple levels of nesting
  const complexSchema = cs.map([
    cs.field("id", cs.string),
    cs.field("location", cs.nested(locationSchema)),
    cs.field("metadata", cs.nested(metadataSchema)),
    cs.field("nested_array", cs.array(cs.nested(locationSchema))),
  ]);

  // Test data with multiple nested structures
  const testData = {
    id: "test-123",
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
    metadata: {
      created: "2024-01-01",
      tags: ["test", "example"],
    },
    nested_array: [
      { latitude: 40.7128, longitude: -74.0060 },
      { latitude: 51.5074, longitude: -0.1278 },
    ],
  };

  // Test encoding and decoding of complex nested structure
  const encoded = cs.encode(complexSchema, testData);
  const decoded = cs.decode(complexSchema, encoded);
  assertEquals(decoded, testData);
});

// Tagged nested document test
Deno.test("Test tagged nested document schema", () => {
  // Define the inner document schema
  const documentSchema = cs.map([
    cs.field("a", cs.integer),
    cs.field("b", cs.integer),
  ]);

  // Create the outer schema with version and tagged nested document
  const containerSchema = cs.map([
    cs.field("version", cs.integer),
    cs.field("document", cs.tagged(888, cs.nested(documentSchema))),
  ]);

  // Test data
  const testData = {
    version: 1,
    document: {
      a: 1,
      b: 2,
    },
  };

  // Test encoding and decoding
  const encoded = cs.encode(containerSchema, testData);
  const decoded = cs.decode(containerSchema, encoded);
  assertEquals(decoded, testData);

  // Test that the encoded form contains a tag 888 followed by bytes
  const decodedRaw = decodeCBOR(encoded);
  if (!(decodedRaw instanceof Map)) {
    throw new Error("Expected decoded value to be a Map");
  }
  const documentValue = decodedRaw.get("document");
  if (!documentValue || typeof documentValue !== "object") {
    throw new Error("Expected document value to be an object");
  }
  assertEquals("tag" in documentValue, true);
  const taggedValue = documentValue as { tag: number; value: Uint8Array };
  assertEquals(taggedValue.tag, 888);
  assertEquals(taggedValue.value instanceof Uint8Array, true);
});
