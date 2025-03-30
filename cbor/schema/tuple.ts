import type { CBORSchemaType } from "./type.ts";
import type { CBORType } from "../cbor.ts";

/**
 * Creates a schema for fixed-length tuples with heterogeneous types
 *
 * @template Schemas Array of schemas for each tuple element
 * @param schemas Array of schemas defining each element's type
 *
 * @example
 * ```typescript
 * import { cs } from "../cbor_schema.ts";
 * const pointSchema = cs.tuple([
 *   cs.float, // x coordinate
 *   cs.float  // y coordinate
 * ]);
 * const encoded = cs.toCBOR(pointSchema, [10.5, 20.7]);
 * const decoded = cs.fromCBOR(pointSchema, encoded); // [10.5, 20.7]
 * ```
 */
export function tuple<T extends unknown[]>(
  schemas: { [K in keyof T]: CBORSchemaType<T[K]> },
): CBORSchemaType<T> {
  function tryFromCBORType(data: CBORType): [true, T] | [false, string] {
    if (!Array.isArray(data)) {
      return [false, `Expected array for tuple, got ${typeof data}`];
    }

    if (data.length !== schemas.length) {
      return [
        false,
        `Expected tuple of length ${schemas.length}, got ${data.length}`,
      ];
    }

    // Create a tuple with the correct types
    const result = [] as unknown as T;

    for (let i = 0; i < schemas.length; i++) {
      const itemResult = schemas[i].tryFromCBORType?.(data[i]);
      if (itemResult) {
        if (!itemResult[0]) {
          return [
            false,
            `Error decoding tuple item at index ${i}: ${itemResult[1]}`,
          ];
        }
        (result as Record<string, unknown>)[i] = itemResult[1];
      } else {
        try {
          (result as Record<string, unknown>)[i] = schemas[i].fromCBORType(
            data[i],
          );
        } catch (error) {
          if (error instanceof Error) {
            return [
              false,
              `Error decoding tuple item at index ${i}: ${error.message}`,
            ];
          }
          return [false, `Error decoding tuple item at index ${i}: ${error}`];
        }
      }
    }

    return [true, result];
  }

  function tryToCBORType(value: T): [true, CBORType] | [false, string] {
    if (!Array.isArray(value) || value.length !== schemas.length) {
      return [false, `Expected tuple of length ${schemas.length}`];
    }

    const result: CBORType[] = [];
    for (let i = 0; i < schemas.length; i++) {
      const itemResult = schemas[i].tryToCBORType?.(value[i]);
      if (itemResult) {
        if (!itemResult[0]) {
          return [
            false,
            `Error encoding tuple item at index ${i}: ${itemResult[1]}`,
          ];
        }
        result.push(itemResult[1]);
      } else {
        try {
          result.push(schemas[i].toCBORType(value[i]));
        } catch (error) {
          if (error instanceof Error) {
            return [
              false,
              `Error encoding tuple item at index ${i}: ${error.message}`,
            ];
          }
          return [false, `Error encoding tuple item at index ${i}: ${error}`];
        }
      }
    }

    return [true, result];
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
