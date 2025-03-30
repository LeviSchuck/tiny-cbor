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
export const bytes: CBORSchemaType<Uint8Array> = {
  fromCBORType(data: CBORType): Uint8Array {
    if (!(data instanceof Uint8Array)) {
      throw new Error(`Expected Uint8Array, got ${typeof data}`);
    }
    return data;
  },
  toCBORType(value: Uint8Array): CBORType {
    if (!(value instanceof Uint8Array)) {
      throw new Error(`Expected Uint8Array, got ${typeof value}`);
    }
    return value;
  },
};
