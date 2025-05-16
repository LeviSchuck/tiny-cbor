import type { CBORSchemaType } from "./type.ts";
import type { CBORType } from "../cbor.ts";

/**
 * Creates a lazy schema that defers schema resolution until runtime.
 * This is useful for recursive type definitions.
 * Unfortunately, type inference is hard for recursive schemas,
 * so an explicit type annotation is recommended.
 *
 * @template T The type of the schema
 * @param schemaFn A function that returns the schema
 * @returns A schema that will resolve the actual schema at runtime
 *
 * @example
 * ```typescript
 * import { cs, type valueOf } from "../cbor_schema.ts";
 * import { type ExtendableMapSchema } from "./type.ts";
 * // Define a recursive schema for a tree structure
 * type Tree = {
 *   value: string;
 *   children: Tree[];
 * }
 * let treeSchema : ExtendableMapSchema<Tree> = cs.map([
 *   cs.field("value", cs.string),
 *   cs.field("children", cs.array(cs.lazy(() => treeSchema)))
 * ]);
 * ```
 */
export function lazy<T>(
  schemaFn: () => CBORSchemaType<T>,
): CBORSchemaType<T> {
  let schema: CBORSchemaType<T>;

  function ensureSchema(): void {
    if (!schema) {
      schema = schemaFn();
    }
  }

  return {
    fromCBORType(data: CBORType): T {
      ensureSchema();
      return schema!.fromCBORType(data);
    },

    toCBORType(value: T): CBORType {
      ensureSchema();
      return schema!.toCBORType(value);
    },

    tryFromCBORType(data: CBORType): [true, T] | [false, string] {
      ensureSchema();
      if (!schema!.tryFromCBORType) {
        try {
          return [true, schema!.fromCBORType(data)];
        } catch (error) {
          if (error instanceof Error) {
            return [false, `Error encoding nested CBOR: ${error.message}`];
          }
          return [false, `Error encoding nested CBOR: ${error}`];
        }
      }
      return schema!.tryFromCBORType(data);
    },

    tryToCBORType(value: T): [true, CBORType] | [false, string] {
      ensureSchema();
      if (!schema!.tryToCBORType) {
        try {
          return [true, schema!.toCBORType(value)];
        } catch (error) {
          if (error instanceof Error) {
            return [false, `Error encoding nested CBOR: ${error.message}`];
          }
          return [false, `Error encoding nested CBOR: ${error}`];
        }
      }
      return schema!.tryToCBORType(value);
    },
  };
}
