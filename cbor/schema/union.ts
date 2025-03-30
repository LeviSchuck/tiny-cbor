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
  function tryFromCBORType(
    data: CBORType,
  ): [true, Schemas[number] extends CBORSchemaType<infer T> ? T : never] | [
    false,
    string,
  ] {
    for (let i = 0; i < schemas.length; i++) {
      const schemaResult = schemas[i].tryFromCBORType?.(data);
      if (schemaResult) {
        if (schemaResult[0]) {
          return [
            true,
            schemaResult[1] as Schemas[number] extends CBORSchemaType<infer T>
              ? T
              : never,
          ];
        }
      } else {
        try {
          return [
            true,
            schemas[i].fromCBORType(data) as Schemas[number] extends
              CBORSchemaType<infer T> ? T : never,
          ];
        } catch (error) {
          if (i === schemas.length - 1) {
            if (error instanceof Error) {
              return [
                false,
                `Value doesn't match any schema in union: ${error.message}`,
              ];
            }
            return [false, `Value doesn't match any schema in union: ${error}`];
          }
        }
      }
    }
    return [false, "Value doesn't match any schema in union (which is empty)"];
  }

  function tryToCBORType(
    value: Schemas[number] extends CBORSchemaType<infer T> ? T : never,
  ): [true, CBORType] | [false, string] {
    for (let i = 0; i < schemas.length; i++) {
      const schemaResult = schemas[i].tryToCBORType?.(value as CBORType);
      if (schemaResult) {
        if (schemaResult[0]) {
          return [true, schemaResult[1]];
        }
      } else {
        try {
          return [true, schemas[i].toCBORType(value as CBORType)];
        } catch (error) {
          if (i === schemas.length - 1) {
            if (error instanceof Error) {
              return [
                false,
                `Value doesn't match any schema in union for encoding: ${error.message}`,
              ];
            }
            return [
              false,
              `Value doesn't match any schema in union for encoding: ${error}`,
            ];
          }
        }
      }
    }
    return [
      false,
      "Value doesn't match any schema in union for encoding (which is empty)",
    ];
  }

  return {
    fromCBORType(
      data: CBORType,
    ): Schemas[number] extends CBORSchemaType<infer T> ? T : never {
      const result = tryFromCBORType(data);
      if (!result[0]) {
        throw new Error(result[1]);
      }
      return result[1];
    },
    toCBORType(
      value: Schemas[number] extends CBORSchemaType<infer T> ? T : never,
    ): CBORType {
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
