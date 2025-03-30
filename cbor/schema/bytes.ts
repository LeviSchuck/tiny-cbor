import type { CBORSchemaType } from "./type.ts";
import type { CBORType } from "../cbor.ts";

/**
 * Schema for byte strings (Uint8Array)
 *
 * @example
 * ```typescript
 * import { cs } from "../cbor_schema.ts";
 * const schema = cs.bytes;
 * const data = new Uint8Array([1, 2, 3]);
 * const encoded = cs.toCBOR(schema, data);
 * const decoded = cs.fromCBOR(schema, encoded); // Uint8Array [1, 2, 3]
 * ```
 */

function tryFromCBORType(data: CBORType): [true, Uint8Array] | [false, string] {
  if (!(data instanceof Uint8Array)) {
    return [false, `Expected Uint8Array, got ${typeof data}`];
  }
  return [true, data];
}

function tryToCBORType(value: Uint8Array): [true, CBORType] | [false, string] {
  if (!(value instanceof Uint8Array)) {
    return [false, `Expected Uint8Array, got ${typeof value}`];
  }
  return [true, value];
}

const bytesSchema: CBORSchemaType<Uint8Array> = {
  fromCBORType(data: CBORType): Uint8Array {
    const result = tryFromCBORType(data);
    if (!result[0]) {
      throw new Error(result[1]);
    }
    return result[1];
  },
  toCBORType(value: Uint8Array): CBORType {
    const result = tryToCBORType(value);
    if (!result[0]) {
      throw new Error(result[1]);
    }
    return result[1];
  },
  tryFromCBORType,
  tryToCBORType,
};

export const bytes = bytesSchema;
