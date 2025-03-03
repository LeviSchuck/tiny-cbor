import { assertEquals, assertThrows } from "jsr:@std/assert";
import { cs } from "./cbor_schema.ts";
import { CBORTag, type CBORType, decodeCBOR } from "./cbor.ts";
import type { CBORSchemaType } from "./schema/type.ts";

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
