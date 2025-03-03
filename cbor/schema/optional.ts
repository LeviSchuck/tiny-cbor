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
  return {
    fromCBORType(data: CBORType): T | undefined {
      if (data === undefined || data === null) {
        return undefined;
      }
      return schema.fromCBORType(data);
    },
    toCBORType(value: T | undefined): CBORType {
      if (value === undefined) {
        return undefined;
      }
      return schema.toCBORType(value);
    },
    isOptional: true,
  };
}
