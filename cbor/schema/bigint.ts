import type { CBORSchemaType } from "./type.ts";
import type { CBORType } from "../cbor.ts";

/**
 * Schema for BigInt values to handle integers larger than Number.MAX_SAFE_INTEGER
 *
 * @example
 * ```typescript
 * import { cs } from "../cbor_schema.ts";
 * const schema = cs.bigint;
 * const encoded = cs.toCBOR(schema, BigInt("9007199254740992"));
 * const decoded = cs.fromCBOR(schema, encoded); // BigInt("9007199254740992")
 * ```
 */

function tryFromCBORType(data: CBORType): [true, bigint] | [false, string] {
  if (typeof data !== "bigint") {
    return [false, `Expected bigint, got ${data}`];
  }
  return [true, data];
}

function tryToCBORType(value: bigint): [true, CBORType] | [false, string] {
  if (typeof value !== "bigint") {
    return [false, `Value ${value} is not a valid bigint`];
  }
  return [true, value];
}

const bigintSchema: CBORSchemaType<bigint> = {
  fromCBORType(data: CBORType): bigint {
    const result = tryFromCBORType(data);
    if (!result[0]) {
      throw new Error(result[1]);
    }
    return result[1];
  },
  toCBORType(value: bigint): CBORType {
    const result = tryToCBORType(value);
    if (!result[0]) {
      throw new Error(result[1]);
    }
    return result[1];
  },
  tryFromCBORType,
  tryToCBORType,
};

export const bigint = bigintSchema;
