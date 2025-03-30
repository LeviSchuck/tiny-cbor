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
export const integer: CBORSchemaType<number> = {
  fromCBORType(data: CBORType): number {
    if (typeof data !== "number" || !Number.isInteger(data)) {
      throw new Error(`Expected integer, got ${data}`);
    }
    return data;
  },
  toCBORType(value: number): CBORType {
    if (!Number.isInteger(value)) {
      throw new Error(`Value ${value} is not a valid integer`);
    }
    return value;
  },
};
