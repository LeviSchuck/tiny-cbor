import { assertEquals, assertThrows } from "jsr:@std/assert";
import { cs } from "./cbor_schema.ts";
import { decodeCBOR, type CBORType, CBORTag } from "./cbor.ts";
import type { CBORSchemaType } from "./cbor_schema.ts";

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

// Type validation tests
Deno.test("Test type validation - primitive types", () => {
  // String schema should reject numbers
  assertThrows(
    () => cs.string.fromCBORType(42),
    Error,
    "Expected string",
  );

  // Integer schema should reject strings
  assertThrows(
    () => cs.integer.fromCBORType("42"),
    Error,
    "Expected integer",
  );

  // Integer schema should reject floats
  assertThrows(
    () => cs.integer.fromCBORType(42.5),
    Error,
    "Expected integer",
  );

  // Boolean schema should reject strings
  assertThrows(
    () => cs.boolean.fromCBORType("true"),
    Error,
    "Expected boolean",
  );
});

// Test primitive type validation for toCBORType
Deno.test("Test type validation - primitive types toCBORType", () => {
  // String schema should reject numbers
  assertThrows(
    () => cs.string.toCBORType(42 as unknown as string),
    Error,
    "Expected string",
  );
  
  // String schema should reject objects
  assertThrows(
    () => cs.string.toCBORType({} as unknown as string),
    Error,
    "Expected string",
  );
  
  // String schema should reject arrays
  assertThrows(
    () => cs.string.toCBORType([] as unknown as string),
    Error,
    "Expected string",
  );
  
  // String schema should reject booleans
  assertThrows(
    () => cs.string.toCBORType(true as unknown as string),
    Error,
    "Expected string",
  );
  
  // Integer schema should reject strings
  assertThrows(
    () => cs.integer.toCBORType("42" as unknown as number),
    Error,
    "Value 42 is not a valid integer",
  );
  
  // Integer schema should reject floats
  assertThrows(
    () => cs.integer.toCBORType(42.5),
    Error,
    "Value 42.5 is not a valid integer",
  );
  
  // Integer schema should reject objects
  assertThrows(
    () => cs.integer.toCBORType({} as unknown as number),
    Error,
    "not a valid integer",
  );
  
  // Float schema should reject strings
  assertThrows(
    () => cs.float.toCBORType("3.14" as unknown as number),
    Error,
    "Expected number",
  );
  
  // Float schema should reject objects
  assertThrows(
    () => cs.float.toCBORType({} as unknown as number),
    Error,
    "Expected number",
  );
  
  // Boolean schema should reject strings
  assertThrows(
    () => cs.boolean.toCBORType("true" as unknown as boolean),
    Error,
    "Expected boolean",
  );
  
  // Boolean schema should reject numbers
  assertThrows(
    () => cs.boolean.toCBORType(1 as unknown as boolean),
    Error,
    "Expected boolean",
  );
  
  // Bytes schema should reject strings
  assertThrows(
    () => cs.bytes.toCBORType("bytes" as unknown as Uint8Array),
    Error,
    "Expected Uint8Array",
  );
  
  // Bytes schema should reject regular arrays
  assertThrows(
    () => cs.bytes.toCBORType([1, 2, 3] as unknown as Uint8Array),
    Error,
    "Expected Uint8Array",
  );
  
  // Bytes schema should reject objects
  assertThrows(
    () => cs.bytes.toCBORType({} as unknown as Uint8Array),
    Error,
    "Expected Uint8Array",
  );
});

// Test primitive types with valid inputs for toCBORType
Deno.test("Test primitive types with valid inputs - toCBORType", () => {
  // Test string
  const stringValue = "test string";
  assertEquals(cs.string.toCBORType(stringValue), stringValue);
  
  // Test integer
  const intValue = 42;
  assertEquals(cs.integer.toCBORType(intValue), intValue);
  
  // Test float
  const floatValue = 3.14;
  assertEquals(cs.float.toCBORType(floatValue), floatValue);
  
  // Test boolean
  const boolValue = true;
  assertEquals(cs.boolean.toCBORType(boolValue), boolValue);
  
  // Test bytes
  const bytesValue = new Uint8Array([1, 2, 3, 4, 5]);
  assertEquals(cs.bytes.toCBORType(bytesValue), bytesValue);
});

Deno.test("Test type validation - array schema", () => {
  const numberArraySchema = cs.array(cs.integer);

  // Should reject non-array
  assertThrows(
    () => numberArraySchema.fromCBORType("not an array"),
    Error,
    "Expected array",
  );

  // Should reject array with wrong element type
  assertThrows(
    () => numberArraySchema.fromCBORType([1, "two", 3]),
    Error,
    "Error decoding array item",
  );
});

Deno.test("Test type validation - tuple schema", () => {
  const personTupleSchema = cs.tuple([cs.string, cs.integer, cs.boolean]);

  // Should reject non-array
  assertThrows(
    () => personTupleSchema.fromCBORType("not a tuple"),
    Error,
    "Expected array for tuple",
  );

  // Should reject tuple with wrong length
  assertThrows(
    () => personTupleSchema.fromCBORType(["John", 30]),
    Error,
    "Expected tuple of length 3",
  );

  // Should reject tuple with wrong types
  assertThrows(
    () => personTupleSchema.fromCBORType(["John", "30", true]),
    Error,
    "Error decoding tuple item",
  );
});

// Test tuple schema toCBORType validation
Deno.test("Test type validation - tuple schema toCBORType", () => {
  const personTupleSchema = cs.tuple([cs.string, cs.integer, cs.boolean]);
  
  // Should reject non-array
  assertThrows(
    () => personTupleSchema.toCBORType("not a tuple" as unknown as [string, number, boolean]),
    Error,
    "Expected tuple of length 3",
  );
  
  // Should reject tuple with wrong length (too short)
  assertThrows(
    () => personTupleSchema.toCBORType(["John", 30] as unknown as [string, number, boolean]),
    Error,
    "Expected tuple of length 3",
  );
  
  // Should reject tuple with wrong length (too long)
  assertThrows(
    () => personTupleSchema.toCBORType(["John", 30, true, "extra"] as unknown as [string, number, boolean]),
    Error,
    "Expected tuple of length 3",
  );
  
  // Should reject tuple with wrong types at index 0
  assertThrows(
    () => personTupleSchema.toCBORType([42, 30, true] as unknown as [string, number, boolean]),
    Error,
    "Error encoding tuple item at index 0",
  );
  
  // Should reject tuple with wrong types at index 1
  assertThrows(
    () => personTupleSchema.toCBORType(["John", "30", true] as unknown as [string, number, boolean]),
    Error,
    "Error encoding tuple item at index 1",
  );
  
  // Should reject tuple with wrong types at index 2
  assertThrows(
    () => personTupleSchema.toCBORType(["John", 30, "true"] as unknown as [string, number, boolean]),
    Error,
    "Error encoding tuple item at index 2",
  );
  
  // Should reject tuple with multiple wrong types
  assertThrows(
    () => personTupleSchema.toCBORType([42, "30", "true"] as unknown as [string, number, boolean]),
    Error,
    "Error encoding tuple item at index 0",
  );
  
  // Should reject tuple with null values
  assertThrows(
    () => personTupleSchema.toCBORType(["John", null, true] as unknown as [string, number, boolean]),
    Error,
    "Error encoding tuple item at index 1",
  );
  
  // Should reject tuple with undefined values
  assertThrows(
    () => personTupleSchema.toCBORType(["John", 30, undefined] as unknown as [string, number, boolean]),
    Error,
    "Error encoding tuple item at index 2",
  );
});

// Test tuple schema with complex types
Deno.test("Test tuple schema toCBORType with complex types", () => {
  // Create a tuple schema with nested types
  const complexTupleSchema = cs.tuple([
    cs.string,
    cs.array(cs.integer),
    cs.map([
      cs.field("name", cs.string),
      cs.field("value", cs.integer),
    ]),
  ]);
  
  // Test with valid complex tuple
  const validTuple = [
    "test",
    [1, 2, 3],
    { name: "item", value: 42 },
  ] as [string, number[], { name: string; value: number }];
  
  // This should not throw
  const encoded = complexTupleSchema.toCBORType(validTuple);
  
  // Test with invalid array element
  assertThrows(
    () => complexTupleSchema.toCBORType([
      "test",
      [1, "2", 3], // Invalid array element
      { name: "item", value: 42 },
    ] as unknown as [string, number[], { name: string; value: number }]),
    Error,
    "Error encoding tuple item at index 1",
  );
  
  // Test with invalid map element
  assertThrows(
    () => complexTupleSchema.toCBORType([
      "test",
      [1, 2, 3],
      { name: "item", value: "42" }, // Invalid map value
    ] as unknown as [string, number[], { name: string; value: number }]),
    Error,
    "Error encoding tuple item at index 2",
  );
  
  // Test with missing required field in map
  assertThrows(
    () => complexTupleSchema.toCBORType([
      "test",
      [1, 2, 3],
      { value: 42 }, // Missing 'name' field
    ] as unknown as [string, number[], { name: string; value: number }]),
    Error,
    "Error encoding tuple item at index 2",
  );
});

Deno.test("Test type validation - union schema", () => {
  const stringOrNumberSchema = cs.union([cs.string, cs.float]);

  // Should reject values not in union
  assertThrows(
    () => stringOrNumberSchema.fromCBORType(true),
    Error,
    "Value doesn't match any schema in union",
  );

  assertThrows(
    () => stringOrNumberSchema.fromCBORType(new Map()),
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
    () => userSchema.fromCBORType([]),
    Error,
    "Expected Map",
  );

  // Should reject missing required fields
  assertThrows(
    () => userSchema.fromCBORType(new Map([["name", "John"]])), // missing age
    Error,
    "Missing required field",
  );

  // Should reject wrong field types
  assertThrows(
    () =>
      userSchema.fromCBORType(
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
  const encoded = cs.toCBOR(stringArraySchema, testArray);
  const decoded = cs.fromCBOR(stringArraySchema, encoded);
  assertEquals(decoded, testArray);
});

// Bytes schema test
Deno.test("Test bytes schema fromCBORType", () => {
  // Test with valid Uint8Array input
  const validBytes = new Uint8Array([1, 2, 3, 4, 5]);
  const result = cs.bytes.fromCBORType(validBytes);
  assertEquals(result, validBytes);
  
  // Test with non-Uint8Array input (should throw error)
  assertThrows(
    () => cs.bytes.fromCBORType("not a byte array"),
    Error,
    "Expected Uint8Array",
  );
  
  // Test with number input (should throw error)
  assertThrows(
    () => cs.bytes.fromCBORType(42),
    Error,
    "Expected Uint8Array",
  );
  
  // Test with array input (should throw error)
  assertThrows(
    () => cs.bytes.fromCBORType([1, 2, 3]),
    Error,
    "Expected Uint8Array",
  );
});

// Array schema exception tests
Deno.test("Test array schema fromCBORType exceptions", () => {
  // Create a schema for an array of objects with a required 'name' field
  const objectSchema = cs.map([
    cs.field("name", cs.string),
    cs.field("value", cs.integer),
  ]);
  const arrayOfObjectsSchema = cs.array(objectSchema);
  
  // Test with non-array input
  assertThrows(
    () => arrayOfObjectsSchema.fromCBORType("not an array"),
    Error,
    "Expected array",
  );
  
  // Test with array containing invalid items (missing required field)
  assertThrows(
    () => arrayOfObjectsSchema.fromCBORType([
      new Map<string, any>([["name", "item1"], ["value", 10]]), // valid
      new Map<string, any>([["value", 20]]), // missing 'name' field
      new Map<string, any>([["name", "item3"], ["value", 30]]), // valid
    ]),
    Error,
    "Error decoding array item at index 1",
  );
  
  // Test with array containing items of wrong type
  assertThrows(
    () => arrayOfObjectsSchema.fromCBORType([
      new Map<string, any>([["name", "item1"], ["value", 10]]), // valid
      new Map<string, any>([["name", "item2"], ["value", "20"]]), // value should be integer
      new Map<string, any>([["name", "item3"], ["value", 30]]), // valid
    ]),
    Error,
    "Error decoding array item at index 1",
  );
  
  // Test with nested array errors (deeper error propagation)
  const nestedArraySchema = cs.array(cs.array(cs.integer));
  assertThrows(
    () => nestedArraySchema.fromCBORType([
      [1, 2, 3], // valid
      [4, "5", 6], // invalid - contains string instead of integer
      [7, 8, 9], // valid
    ]),
    Error,
    "Error decoding array item at index 1",
  );
});

Deno.test("Test array schema toCBORType exceptions", () => {
  const arraySchema = cs.array(cs.integer);
  
  // Test with array containing invalid items
  assertThrows(
    () => arraySchema.toCBORType([1, 2, "hello" as unknown as number, 4]),
    Error,
    "Error encoding array item at index 2",
  );
});

// Test array schema with element-specific exceptions
Deno.test("Test array schema element-specific exceptions - fromCBORType", () => {
  // Create a schema that will throw a custom error for a specific element
  const customErrorSchema: CBORSchemaType<string> = {
    fromCBORType(data: CBORType): string {
      if (data === "trigger-error") {
        throw new Error("Custom error triggered");
      }
      if (typeof data !== "string") {
        throw new Error("Expected string");
      }
      return data;
    },
    toCBORType(value: string): CBORType {
      return value;
    }
  };
  
  const arraySchema = cs.array(customErrorSchema);
  
  // Test with array containing the error-triggering element
  assertThrows(
    () => arraySchema.fromCBORType(["ok", "fine", "trigger-error", "good"]),
    Error,
    "Error decoding array item at index 2: Custom error triggered",
  );
  
  // Test with array containing an element of wrong type
  assertThrows(
    () => arraySchema.fromCBORType(["ok", 123, "good"]),
    Error,
    "Error decoding array item at index 1: Expected string",
  );
  
  // Test with nested array containing error-triggering element
  const nestedArraySchema = cs.array(cs.array(customErrorSchema));
  assertThrows(
    () => nestedArraySchema.fromCBORType([
      ["ok", "fine"],
      ["good", "trigger-error", "ok"],
      ["all", "good"]
    ]),
    Error,
    "Error decoding array item at index 1",
  );
});

Deno.test("Test array schema element-specific exceptions - toCBORType", () => {
  // Create a schema that will throw a custom error for a specific element during encoding
  const customErrorSchema: CBORSchemaType<string> = {
    fromCBORType(data: CBORType): string {
      if (typeof data !== "string") {
        throw new Error("Expected string");
      }
      return data;
    },
    toCBORType(value: string): CBORType {
      if (value === "trigger-error") {
        throw new Error("Custom encoding error triggered");
      }
      return value;
    }
  };
  
  const arraySchema = cs.array(customErrorSchema);
  
  // Test with array containing the error-triggering element
  assertThrows(
    () => arraySchema.toCBORType(["ok", "fine", "trigger-error", "good"]),
    Error,
    "Error encoding array item at index 2: Custom encoding error triggered",
  );
  
  // Test with nested array containing error-triggering element
  const nestedArraySchema = cs.array(cs.array(customErrorSchema));
  assertThrows(
    () => nestedArraySchema.toCBORType([
      ["ok", "fine"],
      ["good", "trigger-error", "ok"],
      ["all", "good"]
    ]),
    Error,
    "Error encoding array item at index 1",
  );
  
  // Test with complex schema that validates during encoding
  const complexSchema = cs.map([
    cs.field("id", cs.string),
    cs.field("value", cs.integer),
  ]);
  
  // Create a wrapper that throws during encoding for a specific value
  const validatingComplexSchema: CBORSchemaType<{id: string, value: number}> = {
    fromCBORType(data: CBORType): {id: string, value: number} {
      return complexSchema.fromCBORType(data);
    },
    toCBORType(value: {id: string, value: number}): CBORType {
      if (value.id === "invalid-id") {
        throw new Error("Invalid ID format");
      }
      return complexSchema.toCBORType(value);
    }
  };
  
  const complexArraySchema = cs.array(validatingComplexSchema);
  
  // Test with array containing an object that fails validation during encoding
  assertThrows(
    () => complexArraySchema.toCBORType([
      {id: "valid-1", value: 10},
      {id: "invalid-id", value: 20},
      {id: "valid-3", value: 30}
    ]),
    Error,
    "Error encoding array item at index 1: Invalid ID format",
  );
});

type AssertEqual<T, Expected> = T extends Expected ? Expected extends T ? T
  : never
  : never;

// Tuple test
Deno.test("Test tuple schema", () => {
  const personTupleSchema = cs.tuple([cs.string, cs.integer, cs.boolean]);
  const testTuple = ["John", 30, true] as [string, number, boolean];
  const encoded = cs.toCBOR(personTupleSchema, testTuple);
  const decoded = cs.fromCBOR(personTupleSchema, encoded);
  assertEquals(decoded, testTuple);
  const tsCheckOnly: AssertEqual<[string, number, boolean], typeof decoded> =
    decoded;
  assertEquals(tsCheckOnly, testTuple);
});

// Union test
Deno.test("Test union schema", () => {
  const stringOrNumberSchema = cs.union([cs.string, cs.float]);

  // Test string case
  const stringValue = "hello";
  const encodedString = cs.toCBOR(stringOrNumberSchema, stringValue);
  const decodedString = cs.fromCBOR(stringOrNumberSchema, encodedString);
  assertEquals(decodedString, stringValue);

  // Test number case
  const numberValue = 42.5;
  const encodedNumber = cs.toCBOR(stringOrNumberSchema, numberValue);
  const decodedNumber = cs.fromCBOR(stringOrNumberSchema, encodedNumber);
  assertEquals(decodedNumber, numberValue);
});

// New test cases for union schema error handling
Deno.test("Test union schema error handling - fromCBORType", () => {
  const stringOrNumberSchema = cs.union([cs.string, cs.integer]);

  // Test with boolean (not in union)
  assertThrows(
    () => stringOrNumberSchema.fromCBORType(true),
    Error,
    "Value doesn't match any schema in union",
  );

  // Test with array (not in union)
  assertThrows(
    () => stringOrNumberSchema.fromCBORType([1, 2, 3]),
    Error,
    "Value doesn't match any schema in union",
  );

  // Test with float when only integer is allowed
  assertThrows(
    () => stringOrNumberSchema.fromCBORType(42.5),
    Error,
    "Value doesn't match any schema in union",
  );

  // Test with Map (not in union)
  assertThrows(
    () => stringOrNumberSchema.fromCBORType(new Map()),
    Error,
    "Value doesn't match any schema in union",
  );
});

Deno.test("Test union schema error handling - toCBORType", () => {
  const stringOrNumberSchema = cs.union([cs.string, cs.integer]);

  // Test with boolean (not in union)
  assertThrows(
    () => stringOrNumberSchema.toCBORType(true as unknown as number),
    Error,
    "Value doesn't match any schema in union",
  ); 
});

Deno.test("Test union schema error handling - toCBORType", () => {
  // Create a union schema with very specific types
  const schema = cs.union([
    cs.map([
      cs.field("type", cs.string),
      cs.field("value", cs.string),
    ]),
    cs.map([
      cs.field("id", cs.integer),
      cs.field("name", cs.string),
    ]),
  ]);

  // Create a test function that directly calls toCBORType with an invalid value
  function testInvalidValue() {
    // This object doesn't match either schema in the union
    const invalidValue = {
      type: 123, // Should be string
      id: "not-a-number", // Should be integer
    };
    
    // Cast to expected type to bypass TypeScript checks
    const castedValue = invalidValue as any;
    
    // This should throw because the value doesn't match any schema in the union
    schema.toCBORType(castedValue);
  }

  // Assert that the function throws the expected error
  assertThrows(
    testInvalidValue,
    Error,
    "Value doesn't match any schema in union for encoding",
  );
});

// Comprehensive test for cs.union.toCBORType with various error scenarios
Deno.test("Test union schema toCBORType comprehensive", () => {
  // Create custom schemas with specific validation rules
  const positiveIntegerSchema: CBORSchemaType<number> = {
    fromCBORType(data: CBORType): number {
      if (typeof data !== "number" || !Number.isInteger(data)) {
        throw new Error("Expected integer");
      }
      return data;
    },
    toCBORType(value: number): CBORType {
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error("Expected positive integer");
      }
      return value;
    }
  };
  
  const emailSchema: CBORSchemaType<string> = {
    fromCBORType(data: CBORType): string {
      if (typeof data !== "string") {
        throw new Error("Expected string");
      }
      return data;
    },
    toCBORType(value: string): CBORType {
      // Simple email validation
      if (!value.includes("@")) {
        throw new Error("Invalid email format");
      }
      return value;
    }
  };
  
  // Create a union of these schemas
  const unionSchema = cs.union([positiveIntegerSchema, emailSchema]);
  
  // Test 1: Value that doesn't match any schema (negative number)
  assertThrows(
    () => unionSchema.toCBORType(-5 as any),
    Error,
    "Value doesn't match any schema in union for encoding",
  );
  
  // Test 2: Value that doesn't match any schema (string without @)
  assertThrows(
    () => unionSchema.toCBORType("not-an-email" as any),
    Error,
    "Value doesn't match any schema in union for encoding",
  );
  
  // Test 3: Value that doesn't match any schema (object)
  assertThrows(
    () => unionSchema.toCBORType({key: "value"} as any),
    Error,
    "Value doesn't match any schema in union for encoding",
  );
  
  // Test 4: Value that doesn't match any schema (array)
  assertThrows(
    () => unionSchema.toCBORType([1, 2, 3] as any),
    Error,
    "Value doesn't match any schema in union for encoding",
  );
  
  // Test 5: Value that doesn't match any schema (boolean)
  assertThrows(
    () => unionSchema.toCBORType(true as any),
    Error,
    "Value doesn't match any schema in union for encoding",
  );
  
  // Test 6: Value that doesn't match any schema (null)
  assertThrows(
    () => unionSchema.toCBORType(null as any),
    Error,
    "Value doesn't match any schema in union for encoding",
  );
  
  // Test 7: Value that doesn't match any schema (undefined)
  assertThrows(
    () => unionSchema.toCBORType(undefined as any),
    Error,
    "Value doesn't match any schema in union for encoding",
  );
  
  // Test with valid values to ensure they work
  const validEmail = "test@example.com";
  const validNumber = 42;
  
  // These should not throw
  const encodedEmail = unionSchema.toCBORType(validEmail as any);
  const encodedNumber = unionSchema.toCBORType(validNumber as any);
  
  // Verify the encoded values are correct
  assertEquals(encodedEmail, validEmail);
  assertEquals(encodedNumber, validNumber);
});

// Test union schema with empty schema array
Deno.test("Test union schema with empty schema array", () => {
  // Create a union with no schemas
  const emptyUnionSchema = cs.union([]);
  
  // Test fromCBORType with various inputs - all should fail
  const testInputs: CBORType[] = [
    "string value",
    42,
    true,
    [1, 2, 3],
    new Map([["key", "value"]]),
    null,
    undefined,
    new Uint8Array([1, 2, 3]),
  ];
  
  // All inputs should fail with fromCBORType
  for (const input of testInputs) {
    assertThrows(
      () => emptyUnionSchema.fromCBORType(input),
      Error,
      "Failed to decode union value",
    );
  }
  
  // All inputs should fail with toCBORType
  for (const input of testInputs) {
    assertThrows(
      () => emptyUnionSchema.toCBORType(input as any),
      Error,
      "Failed to encode union value",
    );
  }
});

// Test union schema with single schema
Deno.test("Test union schema with single schema", () => {
  // Create a union with just one schema
  const singleUnionSchema = cs.union([cs.string]);
  
  // Test with valid input
  const validInput = "test string";
  assertEquals(singleUnionSchema.fromCBORType(validInput), validInput);
  assertEquals(singleUnionSchema.toCBORType(validInput), validInput);
  
  // Test with invalid input
  assertThrows(
    () => singleUnionSchema.fromCBORType(42),
    Error,
    "Value doesn't match any schema in union",
  );
  
  assertThrows(
    () => singleUnionSchema.toCBORType(42 as unknown as string),
    Error,
    "Value doesn't match any schema in union for encoding",
  );
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
    () => complexSchema.fromCBORType(new Map([
      ["id", "not-a-number"], // String instead of integer
      ["name", "test"],
    ])),
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
    () => complexSchema.toCBORType({
      id: "invalid",
      name: "test",
    } as unknown as string[] | { id: number; name: string }),
    Error,
    "Value doesn't match any schema in union for encoding",
  );
});

// Tagged value test
Deno.test("Test tagged schema", () => {
  const timestampSchema = cs.tagged(123, cs.string);
  const timestamp = "2023-01-01T00:00:00Z";
  const encoded = cs.toCBOR(timestampSchema, timestamp);
  const decoded = cs.fromCBOR(timestampSchema, encoded);
  assertEquals(decoded, timestamp);
});

// Test tagged schema error handling
Deno.test("Test tagged schema error handling - tag mismatch", () => {
  // Create a schema with tag number 123
  const schema = cs.tagged(123, cs.string);
  
  // Create a CBORTag with a different tag number (456)
  const wrongTag = new CBORTag(456, "test-value");
  
  // Test that it throws when the tag number doesn't match
  assertThrows(
    () => schema.fromCBORType(wrongTag),
    Error,
    "Expected tag 123, got 456"
  );
});

Deno.test("Test tagged schema error handling - not a tag", () => {
  // Create a tagged schema
  const schema = cs.tagged(123, cs.string);
  
  // Test with various non-tag inputs
  const testCases = [
    "string value",
    42,
    true,
    [1, 2, 3],
    new Map([["key", "value"]]),
    null,
  ];
  
  for (const input of testCases) {
    assertThrows(
      () => schema.fromCBORType(input),
      Error,
      "Expected CBORTag"
    );
  }
});

Deno.test("Test tagged schema error handling - inner schema validation", () => {
  // Create a tagged schema with a string schema inside
  const schema = cs.tagged(123, cs.string);
  
  // Create a valid tag but with an invalid value type (number instead of string)
  const tagWithWrongValueType = new CBORTag(123, 42);
  
  // Test that it propagates errors from the inner schema
  assertThrows(
    () => schema.fromCBORType(tagWithWrongValueType),
    Error,
    "Expected string"
  );
});

// Test optional schema with undefined input
Deno.test("Test optional schema with undefined input", () => {
  // Create an optional schema
  const optionalStringSchema = cs.optional(cs.string);
  
  // Test with undefined value
  const result = optionalStringSchema.toCBORType(undefined);
  
  // Verify that the result is undefined
  assertEquals(result, undefined);
  
  // Test round-trip encoding/decoding with undefined
  const encoded = cs.toCBOR(optionalStringSchema, undefined);
  const decoded = cs.fromCBOR(optionalStringSchema, encoded);
  assertEquals(decoded, undefined);
  
  // Test with actual value
  const stringValue = "test string";
  const encodedString = cs.toCBOR(optionalStringSchema, stringValue);
  const decodedString = cs.fromCBOR(optionalStringSchema, encodedString);
  assertEquals(decodedString, stringValue);
});

// Test optional schema in complex objects
Deno.test("Test optional schema in complex objects", () => {
  // Create a schema with optional fields
  const userSchema = cs.map([
    cs.field("name", cs.string),
    cs.field("email", cs.optional(cs.string)),
    cs.field("age", cs.optional(cs.integer)),
  ]);
  
  // Test with all fields present
  const fullUser = {
    name: "John Doe",
    email: "john@example.com",
    age: 30,
  };
  const encodedFull = cs.toCBOR(userSchema, fullUser);
  const decodedFull = cs.fromCBOR(userSchema, encodedFull);
  assertEquals(decodedFull, fullUser);
  
  // Test with some optional fields undefined
  const partialUser = {
    name: "Jane Doe",
    email: undefined,
    age: 25,
  };
  const encodedPartial = cs.toCBOR(userSchema, partialUser);
  const decodedPartial = cs.fromCBOR(userSchema, encodedPartial);
  assertEquals(decodedPartial.name, "Jane Doe");
  assertEquals(decodedPartial.email, undefined);
  assertEquals(decodedPartial.age, 25);
  
  // Test with all optional fields undefined
  const minimalUser = {
    name: "Bob Smith",
    email: undefined,
    age: undefined,
  };
  const encodedMinimal = cs.toCBOR(userSchema, minimalUser);
  const decodedMinimal = cs.fromCBOR(userSchema, encodedMinimal);
  assertEquals(decodedMinimal.name, "Bob Smith");
  assertEquals(decodedMinimal.email, undefined);
  assertEquals(decodedMinimal.age, undefined);
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

  const encoded = cs.toCBOR(userSchema, testUser);
  const decoded = cs.fromCBOR(userSchema, encoded);
  assertEquals(decoded, testUser);

  // Test with optional field omitted
  const testUserNoMetadata = {
    name: "Jane",
    age: 25,
    tags: ["designer", "ui"],
    metadata: undefined,
  };

  const encodedNoMeta = cs.toCBOR(userSchema, testUserNoMetadata);
  const decodedNoMeta = cs.fromCBOR(userSchema, encodedNoMeta);
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
  const encoded = cs.toCBOR(outerSchema, testData);
  const decoded = cs.fromCBOR(outerSchema, encoded);
  assertEquals(decoded, testData);
});

Deno.test("Test nested CBOR schema validation", () => {
  const innerSchema = cs.map([
    cs.field("value", cs.integer),
  ]);
  const nestedSchema = cs.nested(innerSchema);

  // Should reject non-bytes values
  assertThrows(
    () => nestedSchema.fromCBORType("not bytes"),
    Error,
    "Expected Uint8Array for nested CBOR",
  );

  // Should reject invalid CBOR bytes
  assertThrows(
    () => nestedSchema.fromCBORType(new Uint8Array([0xFF, 0xFF])), // Invalid CBOR bytes
    Error,
    "Error decoding nested CBOR",
  );

  // Should reject inner content that doesn't match schema
  const invalidInner = {
    value: "not a number", // Should be integer
  };
  assertThrows(
    () => {
      const encoded = cs.toCBOR(
        cs.map([
          cs.field("value", cs.string),
        ]),
        invalidInner,
      );
      nestedSchema.fromCBORType(encoded);
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
  const encoded = cs.toCBOR(complexSchema, testData);
  const decoded = cs.fromCBOR(complexSchema, encoded);
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
  const encoded = cs.toCBOR(containerSchema, testData);
  const decoded = cs.fromCBOR(containerSchema, encoded);
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

// Test cases for invalid nested CBOR types
Deno.test("Test nested CBOR schema with invalid input", () => {
  const innerSchema = cs.map([
    cs.field("name", cs.string),
    cs.field("value", cs.integer),
  ]);
  const nestedSchema = cs.nested(innerSchema);

  // Test with invalid CBOR binary input
  assertThrows(
    () => cs.fromCBOR(nestedSchema, new Uint8Array([0x85])), // Invalid CBOR input
    Error,
    "array is not supported or well formed", // Exact error message
  );

  // Test with completely malformed CBOR
  assertThrows(
    () => cs.fromCBOR(nestedSchema, new Uint8Array([0xFF, 0xFF, 0xFF])),
    Error,
  );
});

Deno.test("Test nested CBOR schema with type mismatch in inner schema", () => {
  const innerSchema = cs.map([
    cs.field("name", cs.string),
    cs.field("value", cs.integer),
  ]);
  const nestedSchema = cs.nested(innerSchema);

  // Create valid CBOR but with wrong inner type (string instead of integer)
  const invalidInnerObject = {
    name: "test",
    value: "not-a-number", // Should be an integer
  };

  // First encode the invalid object
  const invalidInnerCBOR = cs.toCBOR(
    cs.map([
      cs.field("name", cs.string),
      cs.field("value", cs.string), // Using string schema to allow encoding
    ]),
    invalidInnerObject,
  );

  // Then try to decode it with the correct schema
  assertThrows(
    () => {
      // We need to wrap this in nested schema since we're testing nested schema
      const wrappedCBOR = cs.toCBOR(cs.bytes, invalidInnerCBOR);
      cs.fromCBOR(nestedSchema, wrappedCBOR);
    },
    Error,
    "Error decoding nested CBOR",
  );
});

Deno.test("Test nested CBOR schema with invalid output type", () => {
  const innerSchema = cs.map([
    cs.field("name", cs.string),
    cs.field("value", cs.integer),
  ]);
  const nestedSchema = cs.nested(innerSchema);

  // Create an object with wrong type for encoding
  const invalidObject = {
    name: "test",
    value: true, // Should be a number, but using boolean
  } as unknown as { name: string; value: number };

  // Try to encode with the wrong type
  assertThrows(
    () => cs.toCBOR(nestedSchema, invalidObject),
    Error,
    "Error encoding nested CBOR",
  );
});

// Test cases for maps with missing required fields
Deno.test("Test map schema with missing required fields during encoding", () => {
  const userSchema = cs.map([
    cs.field("name", cs.string),
    cs.field("age", cs.integer),
    cs.field("email", cs.string),
    cs.field("metadata", cs.optional(cs.string)), // This one is optional
  ]);

  // Missing required field 'email'
  const incompleteUser = {
    name: "John",
    age: 30,
    // email is missing
    metadata: "some data",
  } as unknown as { name: string; age: number; email: string; metadata?: string };

  assertThrows(
    () => cs.toCBOR(userSchema, incompleteUser),
    Error,
    "Missing required field: email",
  );

  // Missing multiple required fields
  const veryIncompleteUser = {
    name: "John",
    // age is missing
    // email is missing
    metadata: "some data",
  } as unknown as { name: string; age: number; email: string; metadata?: string };

  assertThrows(
    () => cs.toCBOR(userSchema, veryIncompleteUser),
    Error,
    "Missing required field",
  );
});

Deno.test("Test map schema with type mismatches during encoding", () => {
  const userSchema = cs.map([
    cs.field("name", cs.string),
    cs.field("age", cs.integer),
    cs.field("isAdmin", cs.boolean),
  ]);

  // Wrong type for 'age' field - using a more direct approach
  let errorThrown = false;
  try {
    cs.toCBOR(userSchema, {
      name: "John",
      age: "thirty" as unknown as number, // Should be a number
      isAdmin: true,
    });
  } catch (error) {
    errorThrown = true;
    if (!(error instanceof Error)) {
      throw new Error("Expected an Error instance");
    }
    if (!error.message.includes("Error encoding field age")) {
      throw new Error(`Expected error message to include "Error encoding field age", but got "${error.message}"`);
    }
  }
  if (!errorThrown) {
    throw new Error("Expected an error to be thrown for invalid age type");
  }
});

Deno.test("Test map schema with invalid CBOR input", () => {
  const userSchema = cs.map([
    cs.field("name", cs.string),
    cs.field("age", cs.integer),
  ]);

  // Test with invalid CBOR binary input
  assertThrows(
    () => cs.fromCBOR(userSchema, new Uint8Array([0x85])), // Invalid CBOR input
    Error,
    "array is not supported or well formed", // Exact error message
  );

  // Test with completely malformed CBOR
  assertThrows(
    () => cs.fromCBOR(userSchema, new Uint8Array([0xFF, 0xFF, 0xFF])),
    Error,
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
      throw new Error(`Expected error message to include "Error encoding field contact", but got "${error.message}"`);
    }
  }
  if (!errorThrown) {
    throw new Error("Expected an error to be thrown for missing required field in nested structure");
  }
});
