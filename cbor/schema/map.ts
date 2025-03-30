import type {
  CBORSchemaType,
  ExtractFieldType,
  FieldDefinition,
  MapSchemaType,
} from "./type.ts";
import type { CBORType } from "../cbor.ts";

/**
 * Creates a schema for CBOR maps that decode to TypeScript objects
 *
 * @template Fields Array of field definitions
 * @param fields Array of field definitions describing the map structure
 *
 * @example
 * ```typescript
 * import { cs } from "../cbor_schema.ts";
 * const personSchema = cs.map([
 *   cs.field("name", cs.string),
 *   cs.numberField(1, "age", cs.integer),
 *   cs.field("email", cs.optional(cs.string))
 * ]);
 *
 * const person = {
 *   name: "Alice",
 *   age: 30,
 *   email: "alice@example.com"
 * };
 *
 * const encoded = cs.toCBOR(personSchema, person);
 * const decoded = cs.fromCBOR(personSchema, encoded);
 * ```
 */
export function map<Fields extends FieldDefinition<unknown, string>[]>(
  fields: Fields,
): CBORSchemaType<MapSchemaType<Fields>> {
  function tryFromCBORType(
    data: CBORType,
  ): [true, MapSchemaType<Fields>] | [false, string] {
    if (!(data instanceof Map)) {
      return [false, `Expected Map, got ${typeof data}`];
    }

    const result = {} as MapSchemaType<Fields>;

    for (const field of fields) {
      const value = data.get(field.key);

      if (value === undefined) {
        if (!field.schema.isOptional) {
          return [false, `Missing required field: ${field.key}`];
        }
        continue;
      }

      const itemResult = field.schema.tryFromCBORType?.(value);
      if (itemResult) {
        if (!itemResult[0]) {
          return [
            false,
            `Error decoding field ${field.jsKey}: ${itemResult[1]}`,
          ];
        }
        (result as Record<string, unknown>)[field.jsKey] = itemResult[1];
      } else {
        try {
          (result as Record<string, unknown>)[field.jsKey] = field.schema
            .fromCBORType(value);
        } catch (error) {
          if (error instanceof Error) {
            return [
              false,
              `Error decoding field ${field.jsKey}: ${error.message}`,
            ];
          }
          return [false, `Error decoding field ${field.jsKey}: ${error}`];
        }
      }
    }

    return [true, result];
  }

  function tryToCBORType(
    value: MapSchemaType<Fields>,
  ): [true, CBORType] | [false, string] {
    const map = new Map<string | number, CBORType>();

    for (const field of fields) {
      const fieldValue = value[field.jsKey as keyof typeof value];

      if (fieldValue === undefined) {
        if (!field.schema.isOptional) {
          return [false, `Missing required field: ${field.jsKey}`];
        }
        continue;
      }

      const itemResult = field.schema.tryToCBORType?.(
        fieldValue as ExtractFieldType<typeof field>,
      );
      if (itemResult) {
        if (!itemResult[0]) {
          return [
            false,
            `Error encoding field ${field.jsKey}: ${itemResult[1]}`,
          ];
        }
        if (itemResult[1] !== undefined) {
          map.set(field.key, itemResult[1]);
        }
      } else {
        try {
          const encoded = field.schema.toCBORType(
            fieldValue as ExtractFieldType<typeof field>,
          );
          if (encoded !== undefined) {
            map.set(field.key, encoded);
          }
        } catch (error) {
          if (error instanceof Error) {
            return [
              false,
              `Error encoding field ${field.jsKey}: ${error.message}`,
            ];
          }
          return [false, `Error encoding field ${field.jsKey}: ${error}`];
        }
      }
    }

    return [true, map];
  }

  return {
    fromCBORType(data: CBORType): MapSchemaType<Fields> {
      const result = tryFromCBORType(data);
      if (!result[0]) {
        throw new Error(result[1]);
      }
      return result[1];
    },
    toCBORType(value: MapSchemaType<Fields>): CBORType {
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

/**
 * Creates a field definition for use in map schemas with a string key
 *
 * @template T The type of the field value
 * @template K The literal string type for the JavaScript property name
 * @param key The CBOR key as a string
 * @param schema Schema for the field value
 *
 * @example
 * ```typescript
 * import { cs } from "../cbor_schema.ts";
 * const nameField = cs.field("name", cs.string);
 * const emailField = cs.field("email", cs.optional(cs.string));
 * ```
 */
export function field<T, K extends string>(
  key: K,
  schema: CBORSchemaType<T>,
): FieldDefinition<T, K> {
  return {
    key,
    jsKey: key as K,
    schema,
  };
}

/**
 * Creates a field definition for use in map schemas with a numeric key
 *
 * @template T The type of the field value
 * @template K The literal string type for the JavaScript property name
 * @param key The CBOR key as a number
 * @param jsKey The JavaScript property name to use
 * @param schema Schema for the field value
 *
 * @example
 * ```typescript
 * import { cs } from "../cbor_schema.ts";
 * const ageField = cs.numberField(1, "age", cs.integer);
 * const scoreField = cs.numberField(2, "score", cs.float);
 * ```
 */
export function numberField<T, K extends string>(
  key: number,
  jsKey: K,
  schema: CBORSchemaType<T>,
): FieldDefinition<T, K> {
  return {
    key,
    jsKey,
    schema,
  };
}
