import { CBORSchemaType } from "./type.ts";
import { CBORType } from "../cbor.ts";
/**
   * Creates a schema for arrays of items of the same type
   *
   * @template T The type of array elements
   * @param itemSchema Schema for the array elements
   *
   * @example
   * ```typescript
   * const numberArraySchema = cs.array(cs.float);
   * const encoded = cs.toCBOR(numberArraySchema, [1, 2, 3]);
   * const decoded = cs.fromCBOR(numberArraySchema, encoded); // [1, 2, 3]
   * ```
   */
export function array<T>(itemSchema: CBORSchemaType<T>): CBORSchemaType<T[]> {
  return {
    fromCBORType(data: CBORType): T[] {
      if (!Array.isArray(data)) {
        throw new Error(`Expected array, got ${typeof data}`);
      }

      return data.map((item, index) => {
        try {
          return itemSchema.fromCBORType(item);
        } catch (error) {
          if (error instanceof Error) {
            // deno-coverage-ignore-next
            throw new Error(
              `Error decoding array item at index ${index}: ${error.message}`,
            );
          }
          // deno-coverage-ignore-start
          throw new Error(
            `Error decoding array item at index ${index}: ${error}`,
          );
          // deno-coverage-ignore-stop
        }
      });
    },
    toCBORType(value: T[]): CBORType {
      return value.map((item, index) => {
        try {
          return itemSchema.toCBORType(item);
        } catch (error) {
          // deno-coverage-ignore-start
          if (error instanceof Error) {
            throw new Error(
              `Error encoding array item at index ${index}: ${error.message}`,
            );
          }
          throw new Error(
            `Error encoding array item at index ${index}: ${error}`,
          );
          // deno-coverage-ignore-stop
        }
      });
    },
  };
}