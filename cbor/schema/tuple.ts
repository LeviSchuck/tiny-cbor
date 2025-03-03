import { CBORSchemaType } from "./type.ts";
import { type CBORType } from "../cbor.ts";

/**
 * Creates a schema for fixed-length tuples with heterogeneous types
 *
 * @template Schemas Array of schemas for each tuple element
 * @param schemas Array of schemas defining each element's type
 *
 * @example
 * ```typescript
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
  return {
    fromCBORType(data: CBORType): T {
      if (!Array.isArray(data)) {
        throw new Error(`Expected array for tuple, got ${typeof data}`);
      }

      if (data.length !== schemas.length) {
        throw new Error(
          `Expected tuple of length ${schemas.length}, got ${data.length}`,
        );
      }

      // Create a tuple with the correct types
      const result = [] as unknown as T;

      for (let i = 0; i < schemas.length; i++) {
        try {
          (result as Record<string, unknown>)[i] = schemas[i].fromCBORType(
            data[i],
          );
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(
              `Error decoding tuple item at index ${i}: ${error.message}`,
            );
          }
          throw new Error(
            `Error decoding tuple item at index ${i}: ${error}`,
          );
        }
      }

      return result;
    },
    toCBORType(value: T): CBORType {
      if (!Array.isArray(value) || value.length !== schemas.length) {
        throw new Error(`Expected tuple of length ${schemas.length}`);
      }

      return schemas.map((schema, index) => {
        try {
          return schema.toCBORType(value[index]);
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(
              `Error encoding tuple item at index ${index}: ${error.message}`,
            );
          }
          throw new Error(
            `Error encoding tuple item at index ${index}: ${error}`,
          );
        }
      });
    },
  };
} 