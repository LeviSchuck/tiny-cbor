import { assertThrows } from "jsr:@std/assert";
import { tagged } from "./tagged.ts";
import { string } from "./string.ts";
import { CBORTag } from "../cbor.ts";
import { assertEquals } from "jsr:@std/assert";

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
    () => dateSchema.toCBORType(42 as unknown as string),
    Error,
    "Expected string",
  );
});

// Test with valid inputs
Deno.test("Tagged types with valid inputs", () => {
  // Test date schema (tag 0 with string)
  const dateSchema = tagged(0, string);
  const dateStr = "2024-03-03T12:00:00Z";

  // Test encoding
  const encoded = dateSchema.toCBORType(dateStr);
  assertEquals(encoded instanceof CBORTag, true);
  assertEquals((encoded as CBORTag).tag, 0);
  assertEquals((encoded as CBORTag).value, dateStr);

  // Test decoding
  const decoded = dateSchema.fromCBORType(new CBORTag(0, dateStr));
  assertEquals(decoded, dateStr);

  // Test round trip
  assertEquals(dateSchema.fromCBORType(dateSchema.toCBORType(dateStr)), dateStr);
}); 