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
  return {
    fromCBORType(data: CBORType): T {
      if (!(data instanceof Uint8Array)) {
        throw new Error(
          `Expected Uint8Array for nested CBOR, got ${typeof data}`,
        );
      }

      try {
        const innerData = decodeCBOR(data);
        return innerSchema.fromCBORType(innerData);
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(
            `Error decoding nested CBOR: ${error.message}`,
          );
        }
        throw new Error(`Error decoding nested CBOR: ${error}`);
      }
    },
    toCBORType(value: T): CBORType {
      try {
        const innerEncoded = innerSchema.toCBORType(value);
        return encodeCBOR(innerEncoded);
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(
            `Error encoding nested CBOR: ${error.message}`,
          );
        }
        throw new Error(`Error encoding nested CBOR: ${error}`);
      }
    },
  };
}
