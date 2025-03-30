import type { CBORSchemaType } from "./type.ts";
import type { CBORType } from "../cbor.ts";

/**
 * Schema for floating point numbers
 *
 * @example
 * ```typescript
 * import { cs } from "../cbor_schema.ts";
 * const schema = cs.float;
 * const encoded = cs.toCBOR(schema, 3.14);
 * const decoded = cs.fromCBOR(schema, encoded); // 3.14
 * ```
 */

function tryFromCBORType(data: CBORType): [true, number] | [false, string] {
  if (typeof data !== "number") {
    return [false, `Expected number, got ${typeof data}`];
  }
  return [true, data];
}

function tryToCBORType(value: number): [true, CBORType] | [false, string] {
  if (typeof value !== "number") {
    return [false, `Expected number, got ${typeof value}`];
  }
  return [true, value];
}

const floatSchema: CBORSchemaType<number> = {
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

export const float = floatSchema;
