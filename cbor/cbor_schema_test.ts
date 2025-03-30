import { assertEquals, assertThrows } from "jsr:@std/assert";
import { cs } from "./cbor_schema.ts";
import type { CBORType } from "./cbor.ts";
import type { CBORSchemaType } from "./schema/type.ts";
import { CBORTag } from "./cbor.ts";
import type { CBORTypedTag } from "./schema/tagged.ts";

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
  const object = cs.fromCBOR(ObjectDefinition, cbor);
  assertEquals(object.name, "Joe");
  assertEquals(object.age, 45);
  assertEquals(object.isAdmin, true);
});

// Test complex union schema error handling
Deno.test("Test complex union schema error handling", () => {
  // Create a more complex union with nested types
  const complexSchema = cs.union([
    cs.array(cs.string),
    cs.map([
      cs.field("id", cs.integer),
      cs.field("name", cs.string),
    ]),
  ]);

  // Test with partially valid array but wrong element type
  assertThrows(
    () => complexSchema.fromCBORType([1, 2, 3]), // Numbers instead of strings
    Error,
    "Value doesn't match any schema in union",
  );

  // Test with partially valid map but wrong field type
  assertThrows(
    () =>
      complexSchema.fromCBORType(
        new Map([
          ["id", "not-a-number"], // String instead of integer
          ["name", "test"],
        ]),
      ),
    Error,
    "Value doesn't match any schema in union",
  );

  // Test with completely invalid type
  assertThrows(
    () => complexSchema.fromCBORType(42), // Neither array nor map
    Error,
    "Value doesn't match any schema in union",
  );

  // Test encoding with invalid data
  try {
    console.log(
      "result",
      complexSchema.toCBORType(
        {
          id: "invalid",
          name: "test",
        } as unknown as string[] | { id: number; name: string },
      ),
    );
  } catch (e) {
    console.log(e);
  }
  assertThrows(
    () =>
      complexSchema.toCBORType(
        {
          id: "invalid",
          name: "test",
        } as unknown as string[] | { id: number; name: string },
      ),
    Error,
    "Value doesn't match any schema in union for encoding",
  );
});

// Test cases for complex nested structures with maps
Deno.test("Test complex nested map schema with invalid data", () => {
  // Define a complex nested schema
  const addressSchema = cs.map([
    cs.field("street", cs.string),
    cs.field("city", cs.string),
    cs.field("zipCode", cs.string),
  ]);

  const contactSchema = cs.map([
    cs.field("email", cs.string),
    cs.field("phone", cs.string),
    cs.field("address", cs.nested(addressSchema)),
  ]);

  const userSchema = cs.map([
    cs.field("id", cs.string),
    cs.field("name", cs.string),
    cs.field("contact", cs.nested(contactSchema)),
    cs.field("tags", cs.array(cs.string)),
    cs.field("largeId", cs.bigint),
  ]);

  // Create an object with invalid nested data (missing required field in address)
  let errorThrown = false;
  try {
    cs.toCBOR(userSchema, {
      id: "user-123",
      name: "John Doe",
      contact: {
        email: "john@example.com",
        phone: "555-1234",
        address: {
          street: "123 Main St",
          // city is missing
          zipCode: "12345",
        } as unknown as { street: string; city: string; zipCode: string },
      },
      tags: ["customer", "premium"],
      largeId: BigInt("9007199254740992"),
    });
  } catch (error) {
    errorThrown = true;
    if (!(error instanceof Error)) {
      throw new Error("Expected an Error instance");
    }
    if (!error.message.includes("Error encoding field contact")) {
      throw new Error(
        `Expected error message to include "Error encoding field contact", but got "${error.message}"`,
      );
    }
  }
  if (!errorThrown) {
    throw new Error(
      "Expected an error to be thrown for missing required field in nested structure",
    );
  }
});

Deno.test("Test map schema with undefined output from nested type", () => {
  // Create a schema that outputs undefined for certain values
  const conditionalSchema: CBORSchemaType<string> = {
    fromCBORType(data: CBORType): string {
      if (typeof data !== "string") {
        throw new Error("Expected string");
      }
      return data;
    },
    toCBORType(value: string): CBORType {
      // Return undefined for a specific value
      if (value === "skip-this-value") {
        return undefined;
      }
      return value;
    },
  };

  // Create a map schema using the conditional schema
  const mapSchema = cs.map([
    cs.field("field1", conditionalSchema),
    cs.field("field2", conditionalSchema),
    cs.field("field3", conditionalSchema),
  ]);

  // Test object where one field will be skipped
  const testObject = {
    field1: "value1",
    field2: "skip-this-value", // This should be omitted from the output
    field3: "value3",
  };

  // Convert to CBOR type (should be a Map)
  const result = mapSchema.toCBORType(testObject);

  // Verify it's a Map
  assertEquals(result instanceof Map, true);

  // Verify only the non-undefined fields are present
  const resultMap = result as Map<string, string>;
  assertEquals(resultMap.size, 2);
  assertEquals(resultMap.has("field2"), false);
  assertEquals(resultMap.get("field1"), "value1");
  assertEquals(resultMap.get("field3"), "value3");

  // Test with all fields returning undefined
  const allUndefinedObject = {
    field1: "skip-this-value",
    field2: "skip-this-value",
    field3: "skip-this-value",
  };

  const emptyResult = mapSchema.toCBORType(allUndefinedObject);
  assertEquals(emptyResult instanceof Map, true);
  assertEquals((emptyResult as Map<string, string>).size, 0);
});

// Test union of tagged values
Deno.test("Test union of tagged values", () => {
  // Create schemas for different tagged values
  const dateSchema = cs.tagged(0, cs.string); // Tag 0 for date strings
  const timestampSchema = cs.tagged(1, cs.integer); // Tag 1 for timestamps
  const flagSchema = cs.tagged(2, cs.boolean); // Tag 2 for boolean flags

  // Create a union of the tagged schemas
  const taggedUnionSchema = cs.union([
    dateSchema,
    timestampSchema,
    flagSchema,
  ]);

  // Test valid cases
  const dateValue: CBORTypedTag<0, string> = {
    tag: 0,
    value: "2024-03-03T12:00:00Z",
  };
  const timestampValue: CBORTypedTag<1, number> = {
    tag: 1,
    value: 1709481600,
  };
  const flagValue: CBORTypedTag<2, boolean> = {
    tag: 2,
    value: true,
  };

  // Test encoding and decoding each type
  assertEquals(
    taggedUnionSchema.fromCBORType(taggedUnionSchema.toCBORType(dateValue)),
    dateValue,
  );
  assertEquals(
    taggedUnionSchema.fromCBORType(
      taggedUnionSchema.toCBORType(timestampValue),
    ),
    timestampValue,
  );
  assertEquals(
    taggedUnionSchema.fromCBORType(taggedUnionSchema.toCBORType(flagValue)),
    flagValue,
  );

  // Test invalid cases
  assertThrows(
    () => taggedUnionSchema.fromCBORType(new CBORTag(3, "invalid")),
    Error,
    "Value doesn't match any schema in union",
  );

  // Test with wrong value type for a tag
  assertThrows(
    () => taggedUnionSchema.fromCBORType(new CBORTag(0, 42)),
    Error,
    "Value doesn't match any schema in union",
  );
});

// Test list of union of tagged values
Deno.test("Test list of union of tagged values", () => {
  // Create schemas for different tagged values
  const dateSchema = cs.tagged(0, cs.string); // Tag 0 for date strings
  const timestampSchema = cs.tagged(1, cs.integer); // Tag 1 for timestamps
  const flagSchema = cs.tagged(2, cs.boolean); // Tag 2 for boolean flags

  // Create a union of the tagged schemas
  const taggedUnionSchema = cs.union([
    dateSchema,
    timestampSchema,
    flagSchema,
  ]);

  // Create a list schema of the union
  const taggedListSchema = cs.array(taggedUnionSchema);

  // Test valid list with mixed tagged values
  const mixedListValue = [
    { tag: 0, value: "2024-03-03T12:00:00Z" } as CBORTypedTag<0, string>,
    { tag: 1, value: 1709481600 } as CBORTypedTag<1, number>,
    { tag: 2, value: true } as CBORTypedTag<2, boolean>,
  ];

  // Test round trip
  const encoded = taggedListSchema.toCBORType(mixedListValue);
  const decoded = taggedListSchema.fromCBORType(encoded);
  assertEquals(decoded, mixedListValue);

  // Test invalid list with wrong tag
  const invalidListValue = [
    { tag: 0, value: "2024-03-03T12:00:00Z" } as CBORTypedTag<0, string>,
    { tag: 3, value: "invalid" } as unknown as CBORTypedTag<1, number>,
  ];

  assertThrows(
    () => taggedListSchema.toCBORType(invalidListValue),
    Error,
    "Value doesn't match any schema in union for encoding",
  );

  // Test invalid list with wrong value type
  const invalidValueList = [
    { tag: 0, value: "2024-03-03T12:00:00Z" } as CBORTypedTag<0, string>,
    { tag: 0, value: 42 } as unknown as CBORTypedTag<0, string>,
  ];

  assertThrows(
    () => taggedListSchema.toCBORType(invalidValueList),
    Error,
    "Value doesn't match any schema in union",
  );
});
