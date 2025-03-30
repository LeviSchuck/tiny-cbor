import type { CBORSchemaType } from "./type.ts";
import { CBORTag, type CBORType } from "../cbor.ts";

/**
 * A typed tag that preserves both the tag number and value type information
 */
export type CBORTypedTag<N extends number | bigint, V> = {
  tag: N;
  value: V;
};

/**
 * Creates a schema for tagged CBOR values
 *
 * @template N The literal type of the tag number (number or bigint)
 * @template V The type of the tagged value
 * @param tagNumber The CBOR tag number
 * @param valueSchema Schema for the tagged value
 *
 * @example
 * ```typescript
 * import { cs } from "../cbor_schema.ts";
 * const dateSchema = cs.tagged(
 *   0, // Standard datetime tag
 *   cs.string
 * );
 * const encoded = cs.toCBOR(dateSchema, { tag: 0, value: new Date().toISOString() });
 * const decoded = cs.fromCBOR(dateSchema, encoded);
 * ```
 */
export function tagged<N extends number | bigint, V>(
  tagNumber: N,
  valueSchema: CBORSchemaType<V>,
): CBORSchemaType<CBORTypedTag<N, V>> {
  function tryFromCBORType(
    data: CBORType,
  ): [true, CBORTypedTag<N, V>] | [false, string] {
    if (!(data instanceof CBORTag)) {
      return [false, `Expected CBORTag, got ${typeof data}`];
    }

    if (data.tag !== tagNumber) {
      return [false, `Expected tag ${tagNumber}, got ${data.tag}`];
    }

    const valueResult = valueSchema.tryFromCBORType?.(data.value);
    if (valueResult) {
      if (!valueResult[0]) {
        return [false, `Error decoding tagged value: ${valueResult[1]}`];
      }
      return [true, { tag: tagNumber, value: valueResult[1] }];
    }

    try {
      return [true, {
        tag: tagNumber,
        value: valueSchema.fromCBORType(data.value),
      }];
    } catch (error) {
      if (error instanceof Error) {
        return [false, `Error decoding tagged value: ${error.message}`];
      }
      return [false, `Error decoding tagged value: ${error}`];
    }
  }

  function tryToCBORType(
    value: CBORTypedTag<N, V>,
  ): [true, CBORType] | [false, string] {
    if (value.tag !== tagNumber) {
      return [false, `Expected tag ${tagNumber}, got ${value.tag}`];
    }

    const valueResult = valueSchema.tryToCBORType?.(value.value);
    if (valueResult) {
      if (!valueResult[0]) {
        return [false, `Error encoding tagged value: ${valueResult[1]}`];
      }
      return [true, new CBORTag(tagNumber, valueResult[1])];
    }

    try {
      return [
        true,
        new CBORTag(tagNumber, valueSchema.toCBORType(value.value)),
      ];
    } catch (error) {
      if (error instanceof Error) {
        return [false, `Error encoding tagged value: ${error.message}`];
      }
      return [false, `Error encoding tagged value: ${error}`];
    }
  }

  return {
    fromCBORType(data: CBORType): CBORTypedTag<N, V> {
      const result = tryFromCBORType(data);
      if (!result[0]) {
        throw new Error(result[1]);
      }
      return result[1];
    },
    toCBORType(value: CBORTypedTag<N, V>): CBORType {
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
