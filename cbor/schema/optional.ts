import type { CBORSchemaType } from "./type.ts";
import type { CBORType } from "../cbor.ts";

/**
 * Creates a schema for optional values that might be undefined
 *
 * @template T The type when the value is present
 * @param schema Schema for the value when present
 *
 * @example
 * ```typescript
 * import { cs } from "../cbor_schema.ts";
 * const optionalNumberSchema = cs.optional(cs.float);
 * const encoded1 = cs.toCBOR(optionalNumberSchema, 42);
 * const encoded2 = cs.toCBOR(optionalNumberSchema, undefined);
 * const decoded1 = cs.fromCBOR(optionalNumberSchema, encoded1); // 42
 * const decoded2 = cs.fromCBOR(optionalNumberSchema, encoded2); // undefined
 * ```
 */
export function optional<T>(
  schema: CBORSchemaType<T>,
): CBORSchemaType<T | undefined> {
  function tryFromCBORType(
    data: CBORType,
  ): [true, T | undefined] | [false, string] {
    if (data === undefined || data === null) {
      return [true, undefined];
    }

    const result = schema.tryFromCBORType?.(data);
    if (result) {
      if (!result[0]) {
        return [false, `Error decoding optional value: ${result[1]}`];
      }
      return [true, result[1]];
    }

    try {
      return [true, schema.fromCBORType(data)];
    } catch (error) {
      if (error instanceof Error) {
        return [false, `Error decoding optional value: ${error.message}`];
      }
      return [false, `Error decoding optional value: ${error}`];
    }
  }

  function tryToCBORType(
    value: T | undefined,
  ): [true, CBORType] | [false, string] {
    if (value === undefined) {
      return [true, undefined];
    }

    const result = schema.tryToCBORType?.(value);
    if (result) {
      if (!result[0]) {
        return [false, `Error encoding optional value: ${result[1]}`];
      }
      return [true, result[1]];
    }

    try {
      return [true, schema.toCBORType(value)];
    } catch (error) {
      if (error instanceof Error) {
        return [false, `Error encoding optional value: ${error.message}`];
      }
      return [false, `Error encoding optional value: ${error}`];
    }
  }

  return {
    fromCBORType(data: CBORType): T | undefined {
      const result = tryFromCBORType(data);
      if (!result[0]) {
        throw new Error(result[1]);
      }
      return result[1];
    },
    toCBORType(value: T | undefined): CBORType {
      const result = tryToCBORType(value);
      if (!result[0]) {
        throw new Error(result[1]);
      }
      return result[1];
    },
    isOptional: true,
    tryFromCBORType,
    tryToCBORType,
  };
}
