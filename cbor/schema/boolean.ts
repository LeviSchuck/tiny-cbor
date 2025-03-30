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
export const boolean: CBORSchemaType<boolean> = {
  fromCBORType(data: CBORType): boolean {
    if (typeof data !== "boolean") {
      throw new Error(`Expected boolean, got ${typeof data}`);
    }
    return data;
  },
  toCBORType(value: boolean): CBORType {
    if (typeof value !== "boolean") {
      throw new Error(`Expected boolean, got ${typeof value}`);
    }
    return value;
  },
};
