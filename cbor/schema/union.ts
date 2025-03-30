import type { CBORSchemaType } from "./type.ts";
import type { CBORType } from "../cbor.ts";

/**
 * Creates a schema for union types that can be one of several types
 *
 * @template Schemas Array of possible schemas
 * @param schemas Array of schemas that the value might conform to
 *
 * @example
 * ```typescript
 * import { cs } from "../cbor_schema.ts";
 * const numberOrStringSchema = cs.union([
 *   cs.float,
 *   cs.string
 * ]);
 * const encoded1 = cs.toCBOR(numberOrStringSchema, 42);
 * const encoded2 = cs.toCBOR(numberOrStringSchema, "hello");
 * const decoded1 = cs.fromCBOR(numberOrStringSchema, encoded1); // 42
 * const decoded2 = cs.fromCBOR(numberOrStringSchema, encoded2); // "hello"
 * ```
 */
export function union<Schemas extends CBORSchemaType<unknown>[]>(
  schemas: Schemas,
): CBORSchemaType<
  Schemas[number] extends CBORSchemaType<infer T> ? T : never
> {
  return {
    fromCBORType(
      data: CBORType,
    ): Schemas[number] extends CBORSchemaType<infer T> ? T : never {
      for (let i = 0; i < schemas.length; i++) {
        try {
          return schemas[i].fromCBORType(data) as Schemas[number] extends
            CBORSchemaType<infer T> ? T : never;
        } catch (error) {
          if (i === schemas.length - 1) {
            if (error instanceof Error) {
              throw new Error(
                `Value doesn't match any schema in union: ${error.message}`,
              );
            }
            throw new Error(
              `Value doesn't match any schema in union: ${error}`,
            );
          }
        }
      }
      throw new Error("Failed to decode union value");
    },
    toCBORType(
      value: Schemas[number] extends CBORSchemaType<infer T> ? T : never,
    ): CBORType {
      for (let i = 0; i < schemas.length; i++) {
        try {
          return schemas[i].toCBORType(value as CBORType);
        } catch (error) {
          if (i === schemas.length - 1) {
            if (error instanceof Error) {
              throw new Error(
                `Value doesn't match any schema in union for encoding: ${error.message}`,
              );
            }
            throw new Error(
              `Value doesn't match any schema in union for encoding: ${error}`,
            );
          }
        }
      }

      throw new Error("Failed to encode union value");
    },
  };
}
