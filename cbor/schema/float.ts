import { CBORSchemaType } from "./type.ts";
import { type CBORType } from "../cbor.ts";

/**
 * Schema for floating point numbers
 *
 * @example
 * ```typescript
 * const schema = cs.float;
 * const encoded = cs.toCBOR(schema, 3.14);
 * const decoded = cs.fromCBOR(schema, encoded); // 3.14
 * ```
 */
export const float: CBORSchemaType<number> = {
  fromCBORType(data: CBORType): number {
    if (typeof data !== "number") {
      throw new Error(`Expected number, got ${typeof data}`);
    }
    return data;
  },
  toCBORType(value: number): CBORType {
    if (typeof value !== "number") {
      throw new Error(`Expected number, got ${typeof value}`);
    }
    return value;
  },
}; 