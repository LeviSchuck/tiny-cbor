import type { CBORSchemaType } from "./type.ts";
import type { CBORType } from "../cbor.ts";

/**
 * Schema for integer values
 *
 * @example
 * ```typescript
 * import { cs } from "../cbor_schema.ts";
 * const schema = cs.integer;
 * const encoded = cs.toCBOR(schema, 42);
 * const decoded = cs.fromCBOR(schema, encoded); // 42
 * ```
 */

function tryFromCBORType(data: CBORType): [true, number] | [false, string] {
  if (typeof data !== "number" || !Number.isInteger(data)) {
    return [false, `Expected integer, got ${data}`];
  }
  return [true, data];
}

function tryToCBORType(value: number): [true, CBORType] | [false, string] {
  if (!Number.isInteger(value)) {
    return [false, `Value ${value} is not a valid integer`];
  }
  return [true, value];
}

const integerSchema: CBORSchemaType<number> = {
  fromCBORType(data: CBORType): number {
    const result = tryFromCBORType(data);
    if (!result[0]) {
      throw new Error(result[1]);
    }
    return result[1];
  },
  toCBORType(value: number): CBORType {
    const result = tryToCBORType(value);
    if (!result[0]) {
      throw new Error(result[1]);
    }
    return result[1];
  },
  tryFromCBORType,
  tryToCBORType,
};

export const integer = integerSchema;
