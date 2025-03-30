import { assertThrows } from "jsr:@std/assert";
import { field, map, numberField } from "./map.ts";
import { float } from "./float.ts";
import { string } from "./string.ts";
import { integer } from "./integer.ts";
import { optional } from "./optional.ts";
import { assertEquals } from "jsr:@std/assert";
import type { ExtractFieldType } from "./type.ts";
import type { CBORType } from "../cbor.ts";
import type { CBORSchemaType, CBORSchemaValue } from "./type.ts";

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

// Test map schema with non-Error throws
Deno.test("Test map schema with non-Error throws", () => {
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

  const mapSchema = map([
    field("field1", nonErrorSchema),
    field("field2", string),
  ]);

  // Test string throw in fromCBORType
  assertThrows(
    () =>
      mapSchema.fromCBORType(
        new Map([
          ["field1", "throw-string"],
          ["field2", "ok"],
        ]),
      ),
    Error,
    "Error decoding field field1: String error in fromCBORType",
  );

  // Test object throw in fromCBORType
  assertThrows(
    () =>
      mapSchema.fromCBORType(
        new Map([
          ["field1", "throw-object"],
          ["field2", "ok"],
        ]),
      ),
    Error,
    "Error decoding field field1: [object Object]",
  );

  // Test string throw in toCBORType
  assertThrows(
    () =>
      mapSchema.toCBORType({
        field1: "throw-string-encode",
        field2: "ok",
      } as ExtractFieldType<typeof mapSchema>),
    Error,
    "Error encoding field field1: String error in toCBORType",
  );

  // Test object throw in toCBORType
  assertThrows(
    () =>
      mapSchema.toCBORType({
        field1: "throw-object-encode",
        field2: "ok",
      } as ExtractFieldType<typeof mapSchema>),
    Error,
    "Error encoding field field1: [object Object]",
  );
});

// Test map schema with custom type throwing Error
Deno.test("Test map schema with custom type throwing Error", () => {
  // Create a schema that will throw a custom error for specific values
  const customErrorSchema: CBORSchemaType<string> = {
    fromCBORType(data: CBORType): string {
      if (data === "trigger-error") {
        throw new Error("Custom error triggered in fromCBORType");
      }
      if (typeof data !== "string") {
        throw new Error("Expected string");
      }
      return data;
    },
    toCBORType(value: string): CBORType {
      if (value === "trigger-error") {
        throw new Error("Custom error triggered in toCBORType");
      }
      return value;
    },
  };

  const mapSchema = map([
    field("field1", string),
    field("field2", customErrorSchema),
    field("field3", string),
  ]);

  // Test with map containing error-triggering value in fromCBORType
  assertThrows(
    () =>
      mapSchema.fromCBORType(
        new Map([
          ["field1", "ok"],
          ["field2", "trigger-error"],
          ["field3", "good"],
        ]),
      ),
    Error,
    "Error decoding field field2: Custom error triggered in fromCBORType",
  );

  // Test with map containing error-triggering value in toCBORType
  assertThrows(
    () =>
      mapSchema.toCBORType({
        field1: "ok",
        field2: "trigger-error",
        field3: "good",
      } as ExtractFieldType<typeof mapSchema>),
    Error,
    "Error encoding field field2: Custom error triggered in toCBORType",
  );
});

// Test map schema extension functionality
Deno.test("Map schema extension", () => {
  // Base schema
  const personSchema = map([
    field("name", string),
    field("age", integer),
    field("optional", optional(string)),
  ]);

  // Extended schema with additional fields
  const employeeSchema = personSchema.extend([
    field("department", string),
    field("salary", float),
  ]);

  // Test that both base and extended schemas work correctly
  const person = {
    name: "Alice",
    age: 30,
  } as CBORSchemaValue<typeof personSchema>;

  const employee = {
    name: "Bob",
    age: 35,
    department: "Engineering",
    salary: 100000.50,
  } as CBORSchemaValue<typeof employeeSchema>;

  // Test base schema still works
  const encodedPerson = personSchema.toCBORType(person);
  const decodedPerson = personSchema.fromCBORType(encodedPerson);
  assertEquals(decodedPerson, person);

  // Test extended schema with all fields
  const encodedEmployee = employeeSchema.toCBORType(employee);
  const decodedEmployee = employeeSchema.fromCBORType(encodedEmployee);
  assertEquals(decodedEmployee, employee);

  // Test that extended schema validates all fields
  assertThrows(
    () =>
      employeeSchema.toCBORType({
        name: "Charlie",
        age: 40,
        // Missing department and salary
      } as ExtractFieldType<typeof employeeSchema>),
    Error,
    "Missing required field: department",
  );

  // Test multiple extensions
  const contractorSchema = employeeSchema.extend([
    field("contractEndDate", string),
    field("hourlyRate", float),
  ]);

  const contractor = {
    name: "Dave",
    age: 45,
    department: "IT",
    salary: 120000.75,
    contractEndDate: "2024-12-31",
    hourlyRate: 75.50,
  } as CBORSchemaValue<typeof contractorSchema>;

  const encodedContractor = contractorSchema.toCBORType(contractor);
  const decodedContractor = contractorSchema.fromCBORType(encodedContractor);
  assertEquals(decodedContractor, contractor);

  // Test that original schemas are not affected
  assertEquals(personSchema.fromCBORType(encodedPerson), person);
  assertEquals(employeeSchema.fromCBORType(encodedEmployee), employee);

  // Test extending with optional fields
  const extendedWithOptional = personSchema.extend([
    field("email", optional(string)),
    field("phone", optional(string)),
  ]);

  // Test with some optional fields
  const personWithEmail = {
    name: "Eve",
    age: 28,
    email: "eve@example.com",
  };

  const encodedWithEmail = extendedWithOptional.toCBORType(personWithEmail);
  assertEquals(
    extendedWithOptional.fromCBORType(encodedWithEmail),
    personWithEmail,
  );

  // Test with all optional fields
  const personWithAllOptional = {
    name: "Grace",
    age: 32,
    email: "grace@example.com",
    phone: "+1234567890",
    optional: "optional",
  } as CBORSchemaValue<typeof extendedWithOptional>;

  const encodedWithAllOptional = extendedWithOptional.toCBORType(
    personWithAllOptional,
  );
  assertEquals(
    extendedWithOptional.fromCBORType(encodedWithAllOptional),
    personWithAllOptional,
  );

  // Test with no optional fields
  const personWithoutOptional = {
    name: "Frank",
    age: 32,
  } as CBORSchemaValue<typeof extendedWithOptional>;

  const encodedWithoutOptional = extendedWithOptional.toCBORType(
    personWithoutOptional,
  );
  assertEquals(
    extendedWithOptional.fromCBORType(encodedWithoutOptional),
    personWithoutOptional,
  );
});

// Test map schema field value assignment conditions
Deno.test("Map schema field value assignment conditions", () => {
  // Create a schema that can return undefined or a value
  const conditionalSchema: CBORSchemaType<string | undefined> = {
    fromCBORType(data: CBORType): string | undefined {
      if (data === "return-undefined") return undefined;
      return String(data);
    },
    toCBORType(value: string | undefined): CBORType {
      return value ?? "return-undefined";
    },
  };

  // Test case 1: Optional field with undefined value (both conditions false)
  const optionalUndefinedSchema = map([
    field("test", optional(conditionalSchema)),
  ]);
  const optionalUndefinedResult = optionalUndefinedSchema.fromCBORType(
    new Map([["test", "return-undefined"]]),
  );
  assertEquals(optionalUndefinedResult, {});

  // Test case 2: Optional field with defined value (first condition true, second false)
  const optionalDefinedSchema = map([
    field("test", optional(conditionalSchema)),
  ]);
  const optionalDefinedResult = optionalDefinedSchema.fromCBORType(
    new Map([["test", "value"]]),
  );
  assertEquals(optionalDefinedResult, { test: "value" });

  // Test case 3: Required field with undefined value (first condition false, second true)
  const requiredUndefinedSchema = map([
    field("test", conditionalSchema),
  ]);
  const requiredUndefinedResult = requiredUndefinedSchema.fromCBORType(
    new Map([["test", "return-undefined"]]),
  );
  assertEquals(requiredUndefinedResult, { test: undefined });

  // Test case 4: Required field with defined value (both conditions true)
  const requiredDefinedSchema = map([
    field("test", conditionalSchema),
  ]);
  const requiredDefinedResult = requiredDefinedSchema.fromCBORType(
    new Map([["test", "value"]]),
  );
  assertEquals(requiredDefinedResult, { test: "value" });
});
