import type { CBORSchemaType } from "./type.ts";
import type { CBORType } from "../cbor.ts";

/**
 * Schema for boolean values
 *
 * @example
 * ```typescript
 * import { cs } from "../cbor_schema.ts";
 * const schema = cs.boolean;
 * const encoded = cs.toCBOR(schema, true);
 * const decoded = cs.fromCBOR(schema, encoded); // true
 * ```
 */

function tryFromCBORType(data: CBORType): [true, boolean] | [false, string] {
  if (typeof data !== "boolean") {
    return [false, `Expected boolean, got ${typeof data}`];
  }
  return [true, data];
}

function tryToCBORType(value: boolean): [true, CBORType] | [false, string] {
  if (typeof value !== "boolean") {
    return [false, `Expected boolean, got ${typeof value}`];
  }
  return [true, value];
}

const booleanSchema: CBORSchemaType<boolean> = {
  fromCBORType(data: CBORType): boolean {
    const result = tryFromCBORType(data);
    if (!result[0]) {
      throw new Error(result[1]);
    }
    return result[1];
  },
  toCBORType(value: boolean): CBORType {
    const result = tryToCBORType(value);
    if (!result[0]) {
      throw new Error(result[1]);
    }
    return result[1];
  },
  tryFromCBORType,
  tryToCBORType,
};

export const boolean = booleanSchema;
