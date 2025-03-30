import type { CBORSchemaType } from "./type.ts";
import type { CBORType } from "../cbor.ts";
import { decodeCBOR, encodeCBOR } from "../cbor.ts";

/**
 * Creates a schema for nested CBOR data (CBOR within CBOR)
 *
 * @template T The type of the nested data
 * @param innerSchema Schema for the nested data
 *
 * @example
 * ```typescript
 * import { cs } from "../cbor_schema.ts";
 * const metadataSchema = cs.map([
 *   cs.field("version", cs.integer)
 * ]);
 *
 * const documentSchema = cs.map([
 *   cs.field("content", cs.string),
 *   cs.field("metadata", cs.nested(metadataSchema))
 * ]);
 *
 * const doc = {
 *   content: "Hello",
 *   metadata: { version: 1 }
 * };
 *
 * const encoded = cs.toCBOR(documentSchema, doc);
 * const decoded = cs.fromCBOR(documentSchema, encoded);
 * ```
 */
export function nested<T>(innerSchema: CBORSchemaType<T>): CBORSchemaType<T> {
  function tryFromCBORType(data: CBORType): [true, T] | [false, string] {
    if (!(data instanceof Uint8Array)) {
      return [false, `Expected Uint8Array for nested CBOR, got ${typeof data}`];
    }

    try {
      const innerData = decodeCBOR(data);
      const result = innerSchema.tryFromCBORType?.(innerData);
      if (result) {
        if (!result[0]) {
          return [false, `Error decoding nested CBOR: ${result[1]}`];
        }
        return [true, result[1]];
      }
      return [true, innerSchema.fromCBORType(innerData)];
    } catch (error) {
      if (error instanceof Error) {
        return [false, `Error decoding nested CBOR: ${error.message}`];
      }
      return [false, `Error decoding nested CBOR: ${error}`];
    }
  }

  function tryToCBORType(value: T): [true, CBORType] | [false, string] {
    try {
      const innerResult = innerSchema.tryToCBORType?.(value);
      if (innerResult) {
        if (!innerResult[0]) {
          return [false, `Error encoding nested CBOR: ${innerResult[1]}`];
        }
        return [true, encodeCBOR(innerResult[1])];
      }
      return [true, encodeCBOR(innerSchema.toCBORType(value))];
    } catch (error) {
      if (error instanceof Error) {
        return [false, `Error encoding nested CBOR: ${error.message}`];
      }
      return [false, `Error encoding nested CBOR: ${error}`];
    }
  }

  return {
    fromCBORType(data: CBORType): T {
      const result = tryFromCBORType(data);
      if (!result[0]) {
        throw new Error(result[1]);
      }
      return result[1];
    },
    toCBORType(value: T): CBORType {
      const result = tryToCBORType(value);
      if (!result[0]) {
        throw new Error(result[1]);
      }
      return result[1];
    },
    tryFromCBORType,
    tryToCBORType,
  };
}
