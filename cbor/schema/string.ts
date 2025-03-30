import type { CBORSchemaType } from "./type.ts";
import type { CBORType } from "../cbor.ts";

/**
 * Schema for UTF-8 encoded strings
 *
 * @example
 * ```typescript
 * import { cs } from "../cbor_schema.ts";
 * const schema = cs.string;
 * const encoded = cs.toCBOR(schema, "hello");
 * const decoded = cs.fromCBOR(schema, encoded); // "hello"
 * ```
 */
function tryFromCBORType(data: CBORType): [true, string] | [false, string] {
  if (typeof data !== "string") {
    return [false, `Expected string, got ${typeof data}`];
  }
  return [true, data];
}

function tryToCBORType(value: string): [true, CBORType] | [false, string] {
  if (typeof value !== "string") {
    return [false, `Expected string, got ${typeof value}`];
  }
  return [true, value];
}

const stringSchema: CBORSchemaType<string> = {
  fromCBORType(data: CBORType): string {
    const result = tryFromCBORType(data);
    if (!result[0]) {
      throw new Error(result[1]);
    }
    return result[1];
  },
  toCBORType(value: string): CBORType {
    const result = tryToCBORType(value);
    if (!result[0]) {
      throw new Error(result[1]);
    }
    return result[1];
  },
  tryFromCBORType,
  tryToCBORType,
};

export const string = stringSchema;
