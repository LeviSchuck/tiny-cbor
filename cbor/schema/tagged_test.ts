import { assertThrows } from "jsr:@std/assert";
import { type CBORTypedTag, tagged } from "./tagged.ts";
import { string } from "./string.ts";
import { CBORTag } from "../cbor.ts";
import { assertEquals } from "jsr:@std/assert";
import type { CBORType } from "../cbor.ts";
import type { CBORSchemaType } from "./type.ts";

// Type validation tests
Deno.test("Tagged types with invalid inputs - fromCBORType", () => {
  const dateSchema = tagged(0, string);

  // Tagged schema should reject non-tagged values
  assertThrows(
    () => dateSchema.fromCBORType("2024-03-03"),
    Error,
    "Expected CBORTag",
  );

  // Tagged schema should reject wrong tag number
  assertThrows(
    () => dateSchema.fromCBORType(new CBORTag(1, "2024-03-03")),
    Error,
    "Expected tag 0",
  );

  // Tagged schema should reject invalid inner value
  assertThrows(
    () => dateSchema.fromCBORType(new CBORTag(0, 42)),
    Error,
    "Expected string",
  );
});

Deno.test("Tagged types with invalid inputs - toCBORType", () => {
  const dateSchema = tagged(0, string);

  // Tagged schema should reject invalid inner value
  assertThrows(
    () => dateSchema.toCBORType({ tag: 0, value: 42 as unknown as string }),
    Error,
    "Expected string",
  );

  // Tagged schema should reject wrong tag number (lie to the type system so the test can execute)
  assertThrows(
    () =>
      dateSchema.toCBORType({ tag: 1 as unknown as 0, value: "2024-03-03" }),
    Error,
    "Expected tag 0",
  );
});

// Test with valid inputs
Deno.test("Tagged types with valid inputs", () => {
  // Test date schema (tag 0 with string)
  const dateSchema = tagged(0, string);
  const dateStr = "2024-03-03T12:00:00Z";
  const taggedDate: CBORTypedTag<0, string> = { tag: 0, value: dateStr };

  // Test encoding
  const encoded = dateSchema.toCBORType(taggedDate);
  assertEquals(encoded instanceof CBORTag, true);
  assertEquals((encoded as CBORTag).tag, 0);
  assertEquals((encoded as CBORTag).value, dateStr);

  // Test decoding
  const decoded = dateSchema.fromCBORType(new CBORTag(0, dateStr));
  assertEquals(decoded.tag, 0);
  assertEquals(decoded.value, dateStr);

  // Test round trip
  const roundTrip = dateSchema.fromCBORType(dateSchema.toCBORType(taggedDate));
  assertEquals(roundTrip.tag, 0);
  assertEquals(roundTrip.value, dateStr);
});

// Test basic tag validation
Deno.test("Test basic tag validation", () => {
  const dateSchema = tagged(0, string);

  // Should reject non-tagged values
  assertThrows(
    () => dateSchema.fromCBORType("not a tag"),
    Error,
    "Expected CBORTag, got string",
  );

  // Should reject wrong tag number
  assertThrows(
    () => dateSchema.fromCBORType(new CBORTag(1, "2024-01-01")),
    Error,
    "Expected tag 0, got 1",
  );
});

// Test custom type throwing Error in tagged values
Deno.test("Test custom type throwing Error in tagged values", () => {
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

  const taggedSchema = tagged(42, customErrorSchema);

  // Test with tagged value containing error-triggering value in fromCBORType
  assertThrows(
    () => taggedSchema.fromCBORType(new CBORTag(42, "trigger-error")),
    Error,
    "Error decoding tagged value: Custom error triggered in fromCBORType",
  );

  // Test with tagged value containing error-triggering value in toCBORType
  assertThrows(
    () => taggedSchema.toCBORType({ tag: 42, value: "trigger-error" }),
    Error,
    "Error encoding tagged value: Custom error triggered in toCBORType",
  );

  // Test with wrong tag number in toCBORType
  assertThrows(
    () => taggedSchema.toCBORType({ tag: 43 as unknown as 42, value: "ok" }),
    Error,
    "Expected tag 42, got 43",
  );
});

// Test custom type throwing non-Error in tagged values
Deno.test("Test custom type throwing non-Error in tagged values", () => {
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

  const taggedSchema = tagged(42, nonErrorSchema);

  // Test string throw in fromCBORType
  assertThrows(
    () => taggedSchema.fromCBORType(new CBORTag(42, "throw-string")),
    Error,
    "Error decoding tagged value: String error in fromCBORType",
  );

  // Test object throw in fromCBORType
  assertThrows(
    () => taggedSchema.fromCBORType(new CBORTag(42, "throw-object")),
    Error,
    "Error decoding tagged value: [object Object]",
  );

  // Test string throw in toCBORType
  assertThrows(
    () => taggedSchema.toCBORType({ tag: 42, value: "throw-string-encode" }),
    Error,
    "Error encoding tagged value: String error in toCBORType",
  );

  // Test object throw in toCBORType
  assertThrows(
    () => taggedSchema.toCBORType({ tag: 42, value: "throw-object-encode" }),
    Error,
    "Error encoding tagged value: [object Object]",
  );
});

Deno.test("tagged schema with number tag", () => {
  const schema = tagged(0, string);
  const value: CBORTypedTag<0, string> = {
    tag: 0,
    value: "2024-01-01T00:00:00Z",
  };

  const encoded = schema.toCBORType(value);
  assertEquals(encoded instanceof CBORTag, true);
  if (encoded instanceof CBORTag) {
    assertEquals(encoded.tag, 0);
    assertEquals(encoded.value, "2024-01-01T00:00:00Z");
  }

  const decoded = schema.fromCBORType(encoded);
  assertEquals(decoded, value);
});

Deno.test("tagged schema with bigint tag", () => {
  const bigTag = 18446744073709551615n;
  const schema = tagged(bigTag, string);
  const value: CBORTypedTag<typeof bigTag, string> = {
    tag: bigTag,
    value: "test",
  };

  const encoded = schema.toCBORType(value);
  assertEquals(encoded instanceof CBORTag, true);
  if (encoded instanceof CBORTag) {
    assertEquals(encoded.tag, bigTag);
    assertEquals(encoded.value, "test");
  }

  const decoded = schema.fromCBORType(encoded);
  assertEquals(decoded, value);
});

Deno.test("tagged schema validation", () => {
  const schema = tagged(0, string);

  // Test wrong tag number
  assertThrows(() => {
    schema.toCBORType(
      { tag: 1, value: "test" } as unknown as CBORTypedTag<0, string>,
    );
  }, "Expected tag 0, got 1");

  // Test wrong tag type
  assertThrows(() => {
    schema.toCBORType(
      { tag: "0", value: "test" } as unknown as CBORTypedTag<0, string>,
    );
  });

  // Test wrong value type
  assertThrows(() => {
    schema.toCBORType(
      { tag: 0, value: 123 } as unknown as CBORTypedTag<0, string>,
    );
  });
});

Deno.test("tagged schema with bigint tag validation", () => {
  const bigTag = 18446744073709551615n;
  const schema = tagged(bigTag, string);

  // Test wrong tag number
  assertThrows(() => {
    schema.toCBORType(
      { tag: 18446744073709551614n, value: "test" } as unknown as CBORTypedTag<
        typeof bigTag,
        string
      >,
    );
  }, "Expected tag 18446744073709551615, got 18446744073709551614");

  // Test wrong tag type
  assertThrows(() => {
    schema.toCBORType(
      { tag: 0, value: "test" } as unknown as CBORTypedTag<
        typeof bigTag,
        string
      >,
    );
  }, "Expected tag 18446744073709551615, got 0");

  // Test wrong value type
  assertThrows(() => {
    schema.toCBORType(
      { tag: bigTag, value: 123 } as unknown as CBORTypedTag<
        typeof bigTag,
        string
      >,
    );
  });
});
