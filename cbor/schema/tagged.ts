import { CBORSchemaType } from "./type.ts";
import { type CBORType, CBORTag } from "../cbor.ts";

/**
 * Creates a schema for tagged CBOR values
 *
 * @template T The type of the tagged value
 * @param tagNumber The CBOR tag number
 * @param valueSchema Schema for the tagged value
 *
 * @example
 * ```typescript
 * const dateSchema = cs.tagged(
 *   0, // Standard datetime tag
 *   cs.string
 * );
 * const encoded = cs.toCBOR(dateSchema, new Date().toISOString());
 * const decoded = cs.fromCBOR(dateSchema, encoded);
 * ```
 */
export function tagged<T>(
  tagNumber: number,
  valueSchema: CBORSchemaType<T>,
): CBORSchemaType<T> {
  return {
    fromCBORType(data: CBORType): T {
      if (!(data instanceof CBORTag)) {
        throw new Error(`Expected CBORTag, got ${typeof data}`);
      }

      if (data.tag !== tagNumber) {
        throw new Error(`Expected tag ${tagNumber}, got ${data.tag}`);
      }

      return valueSchema.fromCBORType(data.value);
    },
    toCBORType(value: T): CBORType {
      const encodedValue = valueSchema.toCBORType(value);
      return new CBORTag(tagNumber, encodedValue);
    },
  };
} 