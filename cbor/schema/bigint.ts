import type { CBORSchemaType } from "./type.ts";
import type { CBORType } from "../cbor.ts";

/**
 * Schema for BigInt values to handle integers larger than Number.MAX_SAFE_INTEGER
 *
 * @example
 * ```typescript
 * const schema = cs.bigint;
 * const encoded = cs.toCBOR(schema, BigInt("9007199254740992"));
 * const decoded = cs.fromCBOR(schema, encoded); // BigInt("9007199254740992")
 * ```
 */
export const bigint: CBORSchemaType<bigint> = {
  fromCBORType(data: CBORType): bigint {
    if (typeof data !== "bigint") {
      throw new Error(`Expected bigint, got ${data}`);
    }
    return data;
  },
  toCBORType(value: bigint): CBORType {
    if (typeof value !== "bigint") {
      throw new Error(`Value ${value} is not a valid bigint`);
    }
    return value;
  },
}; 