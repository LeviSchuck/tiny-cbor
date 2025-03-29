import { cs, type CBORTypedTag } from "./cbor_schema.ts";
import {
  DECODED_APPLE_MACBOOK_WEBAUTHN_PAYLOAD,
  DECODED_WEBAUTHN_REGISTRATION_PAYLOAD,
  HELLO_WORLD_AS_BYTES,
  LONG_ARRAY,
} from "./test_data.ts";

// ==================== Schema Definitions ====================

// String Schema
const StringSchema = cs.string;
const stringValue = "hello world";
const encodedString = StringSchema.toCBORType(stringValue);

// Boolean Schema
const BooleanSchema = cs.boolean;
const boolValue = true;
const encodedBool = BooleanSchema.toCBORType(boolValue);

// Integer Schema
const IntegerSchema = cs.integer;
const intValue = 42;
const encodedInt = IntegerSchema.toCBORType(intValue);

// Float Schema
const FloatSchema = cs.float;
const floatValue = 3.14159;
const encodedFloat = FloatSchema.toCBORType(floatValue);

// Bytes Schema
const BytesSchema = cs.bytes;
const bytesValue = HELLO_WORLD_AS_BYTES;
const encodedBytes = BytesSchema.toCBORType(bytesValue);

// Array Schema
const ArraySchema = cs.array(cs.integer);
const arrayValue = [1, 2, 3, 4, 5];
const encodedArray = ArraySchema.toCBORType(arrayValue);

// Long Array Schema
const LongArraySchema = cs.array(cs.integer);
const longArrayValue = LONG_ARRAY;
const encodedLongArray = LongArraySchema.toCBORType(longArrayValue);

// Tuple Schema
const TupleSchema = cs.tuple([cs.string, cs.integer, cs.boolean]);
const tupleValue = ["hello", 42, true] as [string, number, boolean];
const encodedTuple = TupleSchema.toCBORType(tupleValue);

// Union Schema
const UnionSchema = cs.union([cs.string, cs.integer, cs.boolean]);
const unionStringValue = "hello";
const unionIntValue = 42;
const unionBoolValue = true;
const encodedUnionString = UnionSchema.toCBORType(unionStringValue);
const encodedUnionInt = UnionSchema.toCBORType(unionIntValue);
const encodedUnionBool = UnionSchema.toCBORType(unionBoolValue);

// Tagged Schema
const TaggedSchema = cs.tagged(0, cs.string); // Tag 0 is for date-time strings
const taggedValue: CBORTypedTag<0, string> = { tag: 0, value: new Date().toISOString() };
const encodedTagged = TaggedSchema.toCBORType(taggedValue);

// Optional Schema
const OptionalSchema = cs.optional(cs.string);
const optionalValue = "hello";
const optionalUndefinedValue = undefined;
const encodedOptional = OptionalSchema.toCBORType(optionalValue);
const encodedOptionalUndefined = OptionalSchema.toCBORType(
  optionalUndefinedValue,
);

// Simple Map Schema
const SimpleMapSchema = cs.map([
  cs.field("name", cs.string),
  cs.field("age", cs.integer),
  cs.field("active", cs.boolean),
]);
const simpleMapValue = {
  name: "John Doe",
  age: 30,
  active: true,
};
const encodedSimpleMap = SimpleMapSchema.toCBORType(simpleMapValue);

// Nested Map Schema
const NestedMapSchema = cs.map([
  cs.field("name", cs.string),
  cs.field("age", cs.integer),
  cs.field(
    "address",
    cs.map([
      cs.field("street", cs.string),
      cs.field("city", cs.string),
      cs.field("zip", cs.integer),
    ]),
  ),
]);
const nestedMapValue = {
  name: "John Doe",
  age: 30,
  address: {
    street: "123 Main St",
    city: "Anytown",
    zip: 12345,
  },
};
const encodedNestedMap = NestedMapSchema.toCBORType(nestedMapValue);

// Complex Schema (WebAuthn)
const WebAuthnSchema = cs.map([
  cs.field("fmt", cs.string),
  cs.field(
    "attStmt",
    cs.map([
      cs.field("alg", cs.integer),
      cs.field("sig", cs.bytes),
      cs.field("x5c", cs.optional(cs.array(cs.bytes))),
    ]),
  ),
  cs.field("authData", cs.bytes),
]);

// Convert Map to object for WebAuthn
const webAuthnValue = {
  fmt: DECODED_APPLE_MACBOOK_WEBAUTHN_PAYLOAD.get("fmt") as string,
  attStmt: {
    alg: (DECODED_APPLE_MACBOOK_WEBAUTHN_PAYLOAD.get("attStmt") as Map<
      string,
      number
    >).get("alg") as number,
    sig: (DECODED_APPLE_MACBOOK_WEBAUTHN_PAYLOAD.get("attStmt") as Map<
      string,
      Uint8Array
    >).get("sig") as Uint8Array,
    x5c: (DECODED_APPLE_MACBOOK_WEBAUTHN_PAYLOAD.get("attStmt") as Map<
      string,
      Uint8Array[]
    >).get("x5c") as Uint8Array[] | undefined,
  },
  authData: DECODED_APPLE_MACBOOK_WEBAUTHN_PAYLOAD.get(
    "authData",
  ) as Uint8Array,
};
const encodedWebAuthn = WebAuthnSchema.toCBORType(webAuthnValue);

// WebAuthn Registration Schema
const WebAuthnRegistrationSchema = cs.map([
  cs.numberField(1, "kty", cs.integer),
  cs.numberField(3, "alg", cs.integer),
  cs.numberField(-1, "crv", cs.integer),
  cs.numberField(-2, "x", cs.bytes),
  cs.numberField(-3, "y", cs.bytes),
]);

// Convert Map to object for WebAuthn Registration
const webAuthnRegistrationValue = {
  kty: DECODED_WEBAUTHN_REGISTRATION_PAYLOAD.get(1) as number,
  alg: DECODED_WEBAUTHN_REGISTRATION_PAYLOAD.get(3) as number,
  crv: DECODED_WEBAUTHN_REGISTRATION_PAYLOAD.get(-1) as number,
  x: DECODED_WEBAUTHN_REGISTRATION_PAYLOAD.get(-2) as Uint8Array,
  y: DECODED_WEBAUTHN_REGISTRATION_PAYLOAD.get(-3) as Uint8Array,
};
const encodedWebAuthnRegistration = WebAuthnRegistrationSchema.toCBORType(
  webAuthnRegistrationValue,
);

// ==================== Benchmarks ====================

// String Benchmarks
Deno.bench({
  name: "String - From CBORType",
  fn() {
    const _value = StringSchema.fromCBORType(encodedString);
  },
});

Deno.bench({
  name: "String - To CBORType",
  fn() {
    const _encoded = StringSchema.toCBORType(stringValue);
  },
});

// Boolean Benchmarks
Deno.bench({
  name: "Boolean - From CBORType",
  fn() {
    const _value = BooleanSchema.fromCBORType(encodedBool);
  },
});

Deno.bench({
  name: "Boolean - To CBORType",
  fn() {
    const _encoded = BooleanSchema.toCBORType(boolValue);
  },
});

// Integer Benchmarks
Deno.bench({
  name: "Integer - From CBORType",
  fn() {
    const _value = IntegerSchema.fromCBORType(encodedInt);
  },
});

Deno.bench({
  name: "Integer - To CBORType",
  fn() {
    const _encoded = IntegerSchema.toCBORType(intValue);
  },
});

// Float Benchmarks
Deno.bench({
  name: "Float - From CBORType",
  fn() {
    const _value = FloatSchema.fromCBORType(encodedFloat);
  },
});

Deno.bench({
  name: "Float - To CBORType",
  fn() {
    const _encoded = FloatSchema.toCBORType(floatValue);
  },
});

// Bytes Benchmarks
Deno.bench({
  name: "Bytes - From CBORType",
  fn() {
    const _value = BytesSchema.fromCBORType(encodedBytes);
  },
});

Deno.bench({
  name: "Bytes - To CBORType",
  fn() {
    const _encoded = BytesSchema.toCBORType(bytesValue);
  },
});

// Array Benchmarks
Deno.bench({
  name: "Array - From CBORType",
  fn() {
    const _value = ArraySchema.fromCBORType(encodedArray);
  },
});

Deno.bench({
  name: "Array - To CBORType",
  fn() {
    const _encoded = ArraySchema.toCBORType(arrayValue);
  },
});

// Long Array Benchmarks
Deno.bench({
  name: "Long Array - From CBORType",
  fn() {
    const _value = LongArraySchema.fromCBORType(encodedLongArray);
  },
});

Deno.bench({
  name: "Long Array - To CBORType",
  fn() {
    const _encoded = LongArraySchema.toCBORType(longArrayValue);
  },
});

// Tuple Benchmarks
Deno.bench({
  name: "Tuple - From CBORType",
  fn() {
    const _value = TupleSchema.fromCBORType(encodedTuple);
  },
});

Deno.bench({
  name: "Tuple - To CBORType",
  fn() {
    const _encoded = TupleSchema.toCBORType(tupleValue);
  },
});

// Union Benchmarks
Deno.bench({
  name: "Union (String) - From CBORType",
  fn() {
    const _value = UnionSchema.fromCBORType(encodedUnionString);
  },
});

Deno.bench({
  name: "Union (String) - To CBORType",
  fn() {
    const _encoded = UnionSchema.toCBORType(unionStringValue);
  },
});

Deno.bench({
  name: "Union (Integer) - From CBORType",
  fn() {
    const _value = UnionSchema.fromCBORType(encodedUnionInt);
  },
});

Deno.bench({
  name: "Union (Integer) - To CBORType",
  fn() {
    const _encoded = UnionSchema.toCBORType(unionIntValue);
  },
});

Deno.bench({
  name: "Union (Boolean) - From CBORType",
  fn() {
    const _value = UnionSchema.fromCBORType(encodedUnionBool);
  },
});

Deno.bench({
  name: "Union (Boolean) - To CBORType",
  fn() {
    const _encoded = UnionSchema.toCBORType(unionBoolValue);
  },
});

// Tagged Benchmarks
Deno.bench({
  name: "Tagged - From CBORType",
  fn() {
    const _value = TaggedSchema.fromCBORType(encodedTagged);
  },
});

Deno.bench({
  name: "Tagged - To CBORType",
  fn() {
    const _encoded = TaggedSchema.toCBORType(taggedValue);
  },
});

// Optional Benchmarks
Deno.bench({
  name: "Optional (Value) - From CBORType",
  fn() {
    const _value = OptionalSchema.fromCBORType(encodedOptional);
  },
});

Deno.bench({
  name: "Optional (Value) - To CBORType",
  fn() {
    const _encoded = OptionalSchema.toCBORType(optionalValue);
  },
});

Deno.bench({
  name: "Optional (Undefined) - From CBORType",
  fn() {
    const _value = OptionalSchema.fromCBORType(encodedOptionalUndefined);
  },
});

Deno.bench({
  name: "Optional (Undefined) - To CBORType",
  fn() {
    const _encoded = OptionalSchema.toCBORType(optionalUndefinedValue);
  },
});

// Simple Map Benchmarks
Deno.bench({
  name: "Simple Map - From CBORType",
  fn() {
    const _value = SimpleMapSchema.fromCBORType(encodedSimpleMap);
  },
});

Deno.bench({
  name: "Simple Map - To CBORType",
  fn() {
    const _encoded = SimpleMapSchema.toCBORType(simpleMapValue);
  },
});

// Nested Map Benchmarks
Deno.bench({
  name: "Nested Map - From CBORType",
  fn() {
    const _value = NestedMapSchema.fromCBORType(encodedNestedMap);
  },
});

Deno.bench({
  name: "Nested Map - To CBORType",
  fn() {
    const _encoded = NestedMapSchema.toCBORType(nestedMapValue);
  },
});

// WebAuthn Benchmarks
Deno.bench({
  name: "WebAuthn - From CBORType",
  fn() {
    const _value = WebAuthnSchema.fromCBORType(encodedWebAuthn);
  },
});

Deno.bench({
  name: "WebAuthn - To CBORType",
  fn() {
    const _encoded = WebAuthnSchema.toCBORType(webAuthnValue);
  },
});

// WebAuthn Registration Benchmarks
Deno.bench({
  name: "WebAuthn Registration - From CBORType",
  fn() {
    const _value = WebAuthnRegistrationSchema.fromCBORType(
      encodedWebAuthnRegistration,
    );
  },
});

Deno.bench({
  name: "WebAuthn Registration - To CBORType",
  fn() {
    const _encoded = WebAuthnRegistrationSchema.toCBORType(
      webAuthnRegistrationValue,
    );
  },
});
