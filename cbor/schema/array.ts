import type { CBORSchemaType } from "./type.ts";
import type { CBORType } from "../cbor.ts";
/**
 * Creates a schema for arrays of items of the same type
 *
 * @template T The type of array elements
 * @param itemSchema Schema for the array elements
 *
 * @example
 * ```typescript
 * import { cs } from "../cbor_schema.ts";
 * const numberArraySchema = cs.array(cs.float);
 * const encoded = cs.toCBOR(numberArraySchema, [1, 2, 3]);
 * const decoded = cs.fromCBOR(numberArraySchema, encoded); // [1, 2, 3]
 * ```
 */
export function array<T>(itemSchema: CBORSchemaType<T>): CBORSchemaType<T[]> {
  function tryFromCBORType(data: CBORType): [true, T[]] | [false, string] {
    if (!Array.isArray(data)) {
      return [false, `Expected array, got ${typeof data}`];
    }

    const result: T[] = [];
    for (let i = 0; i < data.length; i++) {
      const itemResult = itemSchema.tryFromCBORType?.(data[i]);
      if (itemResult) {
        if (!itemResult[0]) {
          return [
            false,
            `Error decoding array item at index ${i}: ${itemResult[1]}`,
          ];
        }
        result.push(itemResult[1]);
      } else {
        try {
          result.push(itemSchema.fromCBORType(data[i]));
        } catch (error) {
          if (error instanceof Error) {
            return [
              false,
              `Error decoding array item at index ${i}: ${error.message}`,
            ];
          }
          return [false, `Error decoding array item at index ${i}: ${error}`];
        }
      }
    }
    return [true, result];
  }

  function tryToCBORType(value: T[]): [true, CBORType] | [false, string] {
    if (!Array.isArray(value)) {
      return [false, `Expected array, got ${typeof value}`];
    }

    const result: CBORType[] = [];
    for (let i = 0; i < value.length; i++) {
      const itemResult = itemSchema.tryToCBORType?.(value[i]);
      if (itemResult) {
        if (!itemResult[0]) {
          return [
            false,
            `Error encoding array item at index ${i}: ${itemResult[1]}`,
          ];
        }
        result.push(itemResult[1]);
      } else {
        try {
          result.push(itemSchema.toCBORType(value[i]));
        } catch (error) {
          if (error instanceof Error) {
            return [
              false,
              `Error encoding array item at index ${i}: ${error.message}`,
            ];
          }
          return [false, `Error encoding array item at index ${i}: ${error}`];
        }
      }
    }
    return [true, result];
  }

  return {
    fromCBORType(data: CBORType): T[] {
      const result = tryFromCBORType(data);
      if (!result[0]) {
        throw new Error(result[1]);
      }
      return result[1];
    },
    toCBORType(value: T[]): CBORType {
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
