import type { CBORSchemaType } from "./type.ts";
import type { CBORType } from "../cbor.ts";

/**
 * Schema for UTF-8 encoded strings
 *
 * @example
 * ```typescript
 * const schema = cs.string;
 * const encoded = cs.toCBOR(schema, "hello");
 * const decoded = cs.fromCBOR(schema, encoded); // "hello"
 * ```
 */
export const string: CBORSchemaType<string> = {
  fromCBORType(data: CBORType): string {
    if (typeof data !== "string") {
      throw new Error(`Expected string, got ${typeof data}`);
    }
    return data;
  },
  toCBORType(value: string): CBORType {
    if (typeof value !== "string") {
      throw new Error(`Expected string, got ${typeof value}`);
    }
    return value;
  },
};
