import type { CBORSchemaType } from "./type.ts";
import { CBORTag, type CBORType } from "../cbor.ts";

/**
 * A typed tag that preserves both the tag number and value type information
 */
export type CBORTypedTag<N extends number, V> = {
  tag: N;
  value: V;
};

/**
 * Creates a schema for tagged CBOR values
 *
 * @template N The literal type of the tag number
 * @template V The type of the tagged value
 * @param tagNumber The CBOR tag number
 * @param valueSchema Schema for the tagged value
 *
 * @example
 * ```typescript
 * const dateSchema = cs.tagged(
 *   0, // Standard datetime tag
 *   cs.string
 * );
 * const encoded = cs.toCBOR(dateSchema, { tag: 0, value: new Date().toISOString() });
 * const decoded = cs.fromCBOR(dateSchema, encoded);
 * ```
 */
export function tagged<N extends number, V>(
  tagNumber: N,
  valueSchema: CBORSchemaType<V>,
): CBORSchemaType<CBORTypedTag<N, V>> {
  return {
    fromCBORType(data: CBORType): CBORTypedTag<N, V> {
      if (!(data instanceof CBORTag)) {
        throw new Error(`Expected CBORTag, got ${typeof data}`);
      }

      if (data.tag !== tagNumber) {
        throw new Error(`Expected tag ${tagNumber}, got ${data.tag}`);
      }

      return {
        tag: tagNumber,
        value: valueSchema.fromCBORType(data.value),
      };
    },
    toCBORType(value: CBORTypedTag<N, V>): CBORType {
      if (value.tag !== tagNumber) {
        throw new Error(`Expected tag ${tagNumber}, got ${value.tag}`);
      }
      const encodedValue = valueSchema.toCBORType(value.value);
      return new CBORTag(tagNumber, encodedValue);
    },
  };
}
