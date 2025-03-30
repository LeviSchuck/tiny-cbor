import type { CBORSchemaType } from "./type.ts";
import type { CBORType } from "../cbor.ts";

/**
 * Creates a schema for literal values (string, number, bigint, boolean, Uint8Array, null, or undefined)
 *
 * @template T The literal type (string, number, bigint, boolean, Uint8Array, null, or undefined)
 * @param value The literal value to match against
 *
 * @example
 * ```typescript
 * import { cs } from "../cbor_schema.ts";
 * const schema = cs.literal("hello");
 * const encoded = cs.toCBOR(schema, "hello");
 * const decoded = cs.fromCBOR(schema, encoded); // "hello"
 * ```
 */
export function literal<
  T extends string | number | bigint | boolean | Uint8Array | null | undefined,
>(
  value: T,
): CBORSchemaType<T> {
  function getTypeName(val: unknown): string {
    if (val instanceof Uint8Array) return "Uint8Array";
    if (val === null) return "null";
    if (val === undefined) return "undefined";
    return typeof val;
  }

  function tryFromCBORType(data: CBORType): [true, T] | [false, string] {
    // Handle null and undefined specially
    if (value === null) {
      if (data !== null) {
        return [false, `Expected null, got ${getTypeName(data)}`];
      }
      return [true, value];
    }

    if (value === undefined) {
      if (data !== undefined) {
        return [false, `Expected undefined, got ${getTypeName(data)}`];
      }
      return [true, value];
    }

    // Check for arrays first
    if (Array.isArray(data) && !(data instanceof Uint8Array)) {
      return [false, `Expected ${getTypeName(value)}, got object`];
    }

    if (data instanceof Uint8Array) {
      if (!(value instanceof Uint8Array)) {
        return [false, `Expected ${getTypeName(value)}, got Uint8Array`];
      }
      if (data.length !== value.length) {
        return [
          false,
          `Expected Uint8Array of length ${value.length}, got ${data.length}`,
        ];
      }
      for (let i = 0; i < data.length; i++) {
        if (data[i] !== value[i]) {
          return [false, `Uint8Array values do not match at index ${i}`];
        }
      }
      return [true, value];
    }

    if (typeof data !== typeof value) {
      return [
        false,
        `Expected ${getTypeName(value)}, got ${getTypeName(data)}`,
      ];
    }

    if (data !== value) {
      return [false, `Expected ${value}, got ${data}`];
    }

    return [true, value];
  }

  function tryToCBORType(inputValue: T): [true, CBORType] | [false, string] {
    // Handle null and undefined specially
    if (value === null) {
      if (inputValue !== null) {
        return [false, `Expected null, got ${getTypeName(inputValue)}`];
      }
      return [true, inputValue];
    }

    if (value === undefined) {
      if (inputValue !== undefined) {
        return [false, `Expected undefined, got ${getTypeName(inputValue)}`];
      }
      return [true, inputValue];
    }

    // Check for arrays first
    if (Array.isArray(inputValue) && !(inputValue instanceof Uint8Array)) {
      return [false, `Expected ${getTypeName(value)}, got object`];
    }

    if (inputValue instanceof Uint8Array) {
      if (!(value instanceof Uint8Array)) {
        return [false, `Expected ${getTypeName(value)}, got Uint8Array`];
      }
      if (inputValue.length !== value.length) {
        return [
          false,
          `Expected Uint8Array of length ${value.length}, got ${inputValue.length}`,
        ];
      }
      for (let i = 0; i < inputValue.length; i++) {
        if (inputValue[i] !== value[i]) {
          return [false, `Uint8Array values do not match at index ${i}`];
        }
      }
      return [true, inputValue];
    }

    if (typeof inputValue !== typeof value) {
      return [
        false,
        `Expected ${getTypeName(value)}, got ${getTypeName(inputValue)}`,
      ];
    }

    if (inputValue !== value) {
      return [false, `Expected ${value}, got ${inputValue}`];
    }

    return [true, inputValue];
  }

  return {
    fromCBORType(data: CBORType): T {
      const result = tryFromCBORType(data);
      if (!result[0]) {
        throw new Error(result[1]);
      }
      return result[1];
    },
    toCBORType(inputValue: T): CBORType {
      const result = tryToCBORType(inputValue);
      if (!result[0]) {
        throw new Error(result[1]);
      }
      return result[1];
    },
    tryFromCBORType,
    tryToCBORType,
  };
}
