import { CBORTag, type CBORType, decodeCBOR, encodeCBOR } from "./cbor.ts";

/**
 * Base interface for all CBOR schema types.
 * Provides methods to encode and decode CBOR data.
 *
 * @template T The TypeScript type that this schema represents
 *
 * @example
 * ```typescript
 * const stringSchema: CBORSchemaType<string> = {
 *   fromCBORType: (data) => {
 *     if (typeof data !== "string") throw new Error("Not a string");
 *     return data;
 *   },
 *   toCBORType: (value) => value
 * };
 * ```
 */
export interface CBORSchemaType<T> {
  fromCBORType(data: CBORType): T;
  toCBORType(value: T): CBORType;
  isOptional?: true;
}

/**
 * Type helper that extracts the value type from a CBORSchemaType
 *
 * @example
 * ```typescript
 * const WebAuthnSchema = cs.map([
 *   cs.field("fmt", cs.string),
 *   cs.field(
 *     "attStmt",
 *     cs.map([
 *       cs.field("alg", cs.integer),
 *       cs.field("sig", cs.bytes),
 *       cs.field("x5c", cs.optional(cs.array(cs.bytes))),
 *     ]),
 *   ),
 *   cs.field("authData", cs.bytes),
 * ]);
 * type WebAuthnSchemaValue = CBORSchemaValue<typeof WebAuthnSchema>;
 * ```
 */
export type CBORSchemaValue<T> = T extends CBORSchemaType<infer U> ? U : never;

/**
 * Defines a field in a map schema, mapping CBOR keys to TypeScript object properties.
 *
 * @template T The type of the field value
 * @template K The literal string type of the JavaScript property name
 *
 * @example
 * ```typescript
 * const nameField: FieldDefinition<string, "name"> = {
 *   key: "name",
 *   jsKey: "name",
 *   schema: cs.string,
 * };
 * ```
 */
interface FieldDefinition<T, K extends string> {
  key: string | number;
  jsKey: K;
  schema: CBORSchemaType<T>;
}

/**
 * Type helper that extracts the value type from a FieldDefinition
 */
type ExtractFieldType<F> = F extends FieldDefinition<infer T, string> ? T
  : never;

/**
 * Type helper that extracts the JavaScript property key from a FieldDefinition
 */
type ExtractJsKey<F> = F extends FieldDefinition<unknown, infer K> ? K : never;

type Expand<T> = T extends (...args: infer A) => infer R
  ? (...args: Expand<A>) => Expand<R>
  : T extends object ? { [K in keyof T]: T[K] }
  : T;

/**
 * Type helper that constructs a TypeScript type from an array of field definitions
 */
type MapSchemaType<Fields extends FieldDefinition<unknown, string>[]> = Expand<
  {
    [K in ExtractJsKey<Fields[number]>]: ExtractFieldType<
      Extract<Fields[number], { jsKey: K }>
    >;
  }
>;

/**
 * Main schema builder class containing all schema constructors and primitive types.
 * Prefer use of the shorthand alias `cs`.
 *
 * @example
 * ```typescript
 * // Using primitive schemas
 * const stringSchema = cs.string;
 * const numberSchema = cs.float;
 *
 * // Creating complex schemas
 * const personSchema = cs.map([
 *   cs.field("name", cs.string),
 *   cs.field("age", cs.integer),
 *   cs.field("hobbies", cs.array(cs.string))
 * ]);
 *
 * // Encoding and decoding
 * const encoded = cs.toCBOR(personSchema, {
 *   name: "Alice",
 *   age: 30,
 *   hobbies: ["reading", "hiking"]
 * });
 * const decoded = cs.fromCBOR(personSchema, encoded);
 * ```
 */
export class CBORSchema {
  /**
   * Schema for UTF-8 encoded strings
   *
   * @example
   * ```typescript
   * const schema = cs.string;
   * const encoded = cs.toCBOR(schema, "hello");
   * const decoded = cs.fromCBOR(schema, encoded); // "hello"
   * ```
   */
  static string: CBORSchemaType<string> = {
    fromCBORType(data: CBORType): string {
      if (typeof data !== "string") {
        throw new Error(`Expected string, got ${typeof data}`);
      }
      return data;
    },
    toCBORType(value: string): CBORType {
      if (typeof value !== "string") {
        throw new Error(`Expected string, got ${typeof value}`);
      }
      return value;
    },
  };

  /**
   * Schema for boolean values
   *
   * @example
   * ```typescript
   * const schema = cs.boolean;
   * const encoded = cs.toCBOR(schema, true);
   * const decoded = cs.fromCBOR(schema, encoded); // true
   * ```
   */
  static boolean: CBORSchemaType<boolean> = {
    fromCBORType(data: CBORType): boolean {
      if (typeof data !== "boolean") {
        throw new Error(`Expected boolean, got ${typeof data}`);
      }
      return data;
    },
    toCBORType(value: boolean): CBORType {
      if (typeof value !== "boolean") {
        throw new Error(`Expected boolean, got ${typeof value}`);
      }
      return value;
    },
  };

  /**
   * Schema for floating point numbers
   *
   * @example
   * ```typescript
   * const schema = cs.float;
   * const encoded = cs.toCBOR(schema, 3.14);
   * const decoded = cs.fromCBOR(schema, encoded); // 3.14
   * ```
   */
  static float: CBORSchemaType<number> = {
    fromCBORType(data: CBORType): number {
      if (typeof data !== "number") {
        throw new Error(`Expected number, got ${typeof data}`);
      }
      return data;
    },
    toCBORType(value: number): CBORType {
      if (typeof value !== "number") {
        throw new Error(`Expected number, got ${typeof value}`);
      }
      return value;
    },
  };

  /**
   * Schema for integer values
   *
   * @example
   * ```typescript
   * const schema = cs.integer;
   * const encoded = cs.toCBOR(schema, 42);
   * const decoded = cs.fromCBOR(schema, encoded); // 42
   * ```
   */
  static integer: CBORSchemaType<number> = {
    fromCBORType(data: CBORType): number {
      if (typeof data !== "number" || !Number.isInteger(data)) {
        throw new Error(`Expected integer, got ${data}`);
      }
      return data;
    },
    toCBORType(value: number): CBORType {
      if (!Number.isInteger(value)) {
        throw new Error(`Value ${value} is not a valid integer`);
      }
      return value;
    },
  };

  /**
   * Schema for byte strings (Uint8Array)
   *
   * @example
   * ```typescript
   * const schema = cs.bytes;
   * const data = new Uint8Array([1, 2, 3]);
   * const encoded = cs.toCBOR(schema, data);
   * const decoded = cs.fromCBOR(schema, encoded); // Uint8Array [1, 2, 3]
   * ```
   */
  static bytes: CBORSchemaType<Uint8Array> = {
    fromCBORType(data: CBORType): Uint8Array {
      if (!(data instanceof Uint8Array)) {
        throw new Error(`Expected Uint8Array, got ${typeof data}`);
      }
      return data;
    },
    toCBORType(value: Uint8Array): CBORType {
      if (!(value instanceof Uint8Array)) {
        throw new Error(`Expected Uint8Array, got ${typeof value}`);
      }
      return value;
    },
  };

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
  static array<T>(itemSchema: CBORSchemaType<T>): CBORSchemaType<T[]> {
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
              throw new Error(
                `Error decoding array item at index ${index}: ${error.message}`,
              );
            }
            // deno-coverage-ignore-start
            throw new Error(
              `Error decoding array item at index ${index}: ${error}`,
            );
            // deno-coverage-ignore-end
          }
        });
      },
      toCBORType(value: T[]): CBORType {
        return value.map((item, index) => {
          try {
            return itemSchema.toCBORType(item);
          } catch (error) {
            if (error instanceof Error) {
              throw new Error(
                `Error encoding array item at index ${index}: ${error.message}`,
              );
            }
            // deno-coverage-ignore-start
            throw new Error(
              `Error encoding array item at index ${index}: ${error}`,
            );
            // deno-coverage-ignore-end
          }
        });
      },
    };
  }

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
  static tuple<T extends unknown[]>(
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
            // deno-coverage-ignore-start
            throw new Error(
              `Error decoding tuple item at index ${i}: ${error}`,
            );
            // deno-coverage-ignore-end
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
            // deno-coverage-ignore-start
            throw new Error(
              `Error encoding tuple item at index ${index}: ${error}`,
            );
            // deno-coverage-ignore-end
          }
        });
      },
    };
  }

  /**
   * Creates a schema for union types that can be one of several types
   *
   * @template Schemas Array of possible schemas
   * @param schemas Array of schemas that the value might conform to
   *
   * @example
   * ```typescript
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
  static union<Schemas extends CBORSchemaType<unknown>[]>(
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
      }
    }
  }

  /**
   * Creates a schema for tagged CBOR values
   *
   * @template T The type of the tagged value
   * @param tagNumber The CBOR tag number
   * @param valueSchema Schema for the tagged value
   *
   * @example
   * ```typescript
   * const dateSchema = cs.tagged(
   *   0, // Standard datetime tag
   *   cs.string
   * );
   * const encoded = cs.toCBOR(dateSchema, new Date().toISOString());
   * const decoded = cs.fromCBOR(dateSchema, encoded);
   * ```
   */
  static tagged<T>(
    tagNumber: number,
    valueSchema: CBORSchemaType<T>,
  ): CBORSchemaType<T> {
    return {
      fromCBORType(data: CBORType): T {
        if (!(data instanceof CBORTag)) {
          throw new Error(`Expected CBORTag, got ${typeof data}`);
        }

        if (data.tag !== tagNumber) {
          throw new Error(`Expected tag ${tagNumber}, got ${data.tag}`);
        }

        return valueSchema.fromCBORType(data.value);
      },
      toCBORType(value: T): CBORType {
        const encodedValue = valueSchema.toCBORType(value);
        return new CBORTag(tagNumber, encodedValue);
      },
    };
  }

  /**
   * Creates a schema for optional values that might be undefined
   *
   * @template T The type when the value is present
   * @param schema Schema for the value when present
   *
   * @example
   * ```typescript
   * const optionalNumberSchema = cs.optional(cs.float);
   * const encoded1 = cs.toCBOR(optionalNumberSchema, 42);
   * const encoded2 = cs.toCBOR(optionalNumberSchema, undefined);
   * const decoded1 = cs.fromCBOR(optionalNumberSchema, encoded1); // 42
   * const decoded2 = cs.fromCBOR(optionalNumberSchema, encoded2); // undefined
   * ```
   */
  static optional<T>(schema: CBORSchemaType<T>): CBORSchemaType<T | undefined> {
    return {
      fromCBORType(data: CBORType): T | undefined {
        if (data === undefined || data === null) {
          return undefined;
        }
        return schema.fromCBORType(data);
      },
      toCBORType(value: T | undefined): CBORType {
        if (value === undefined) {
          return undefined;
        }
        return schema.toCBORType(value);
      },
      isOptional: true,
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
   * const nameField = cs.field("name", cs.string);
   * const emailField = cs.field("email", cs.optional(cs.string));
   * ```
   */
  static field<T, K extends string>(
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
   * const ageField = cs.numberField(1, "age", cs.integer);
   * const scoreField = cs.numberField(2, "score", cs.float);
   * ```
   */
  static numberField<T, K extends string>(
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

  /**
   * Creates a schema for CBOR maps that decode to TypeScript objects
   *
   * @template Fields Array of field definitions
   * @param fields Array of field definitions describing the map structure
   *
   * @example
   * ```typescript
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
  static map<Fields extends FieldDefinition<unknown, string>[]>(
    fields: Fields,
  ): CBORSchemaType<MapSchemaType<Fields>> {
    return {
      fromCBORType(data: CBORType): MapSchemaType<Fields> {
        if (!(data instanceof Map)) {
          throw new Error(`Expected Map, got ${typeof data}`);
        }

        const result = {} as MapSchemaType<Fields>;

        for (const field of fields) {
          const value = data.get(field.key);

          if (value === undefined && !field.schema.isOptional) {
            throw new Error(`Missing required field: ${field.key}`);
          }

          try {
            (result as Record<string, unknown>)[field.jsKey] = field.schema
              .fromCBORType(value);
          } catch (error) {
            if (error instanceof Error) {
              throw new Error(
                `Error decoding field ${field.jsKey}: ${error.message}`,
              );
            }
            // deno-coverage-ignore-start
            throw new Error(`Error decoding field ${field.jsKey}: ${error}`);
            // deno-coverage-ignore-end
          }
        }

        return result;
      },
      toCBORType(value: MapSchemaType<Fields>): CBORType {
        const map = new Map<string | number, CBORType>();

        for (const field of fields) {
          const fieldValue = value[field.jsKey as keyof typeof value];

          if (fieldValue === undefined) {
            if (!field.schema.isOptional) {
              throw new Error(`Missing required field: ${field.jsKey}`);
            }
            continue;
          }

          try {
            const encoded = field.schema.toCBORType(
              fieldValue as ExtractFieldType<typeof field>,
            );
            if (encoded !== undefined) {
              map.set(field.key, encoded);
            }
          } catch (error) {
            throw new Error(
              `Error encoding field ${field.jsKey}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          }
        }

        return map;
      },
    };
  }

  /**
   * Creates a schema for nested CBOR data (CBOR within CBOR)
   *
   * @template T The type of the nested data
   * @param innerSchema Schema for the nested data
   *
   * @example
   * ```typescript
   * const metadataSchema = cs.map([
   *   cs.field("version", cs.integer)
   * ]);
   *
   * const documentSchema = cs.map([
   *   cs.field("content", cs.string),
   *   cs.field("metadata", cs.nested(metadataSchema))
   * ]);
   *
   * const doc = {
   *   content: "Hello",
   *   metadata: { version: 1 }
   * };
   *
   * const encoded = cs.toCBOR(documentSchema, doc);
   * const decoded = cs.fromCBOR(documentSchema, encoded);
   * ```
   */
  static nested<T>(innerSchema: CBORSchemaType<T>): CBORSchemaType<T> {
    return {
      fromCBORType(data: CBORType): T {
        if (!(data instanceof Uint8Array)) {
          throw new Error(
            `Expected Uint8Array for nested CBOR, got ${typeof data}`,
          );
        }

        try {
          const innerData = decodeCBOR(data);
          return innerSchema.fromCBORType(innerData);
        } catch (error) {
          throw new Error(
            `Error decoding nested CBOR: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      },
      toCBORType(value: T): CBORType {
        try {
          const innerEncoded = innerSchema.toCBORType(value);
          return encodeCBOR(innerEncoded);
        } catch (error) {
          throw new Error(
            `Error encoding nested CBOR: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      },
    };
  }

  /**
   * Decodes a CBOR byte array using the provided schema
   *
   * @template T The type to decode to
   * @param schema The schema to use for decoding
   * @param data The CBOR encoded data
   * @returns The decoded value
   *
   * @example
   * ```typescript
   * const data = new Uint8Array([101, 72, 101, 108, 108, 111]);  // "Hello" in CBOR
   * const value = cs.fromCBOR(cs.string, data);
   * ```
   */
  static fromCBOR<T>(
    schema: CBORSchemaType<T>,
    data: Uint8Array | ArrayBuffer | ArrayBufferLike | DataView,
  ): T {
    const decoded = decodeCBOR(data);
    return schema.fromCBORType(decoded);
  }

  /**
   * Encodes a value to CBOR using the provided schema
   *
   * @template T The type of the value to encode
   * @param schema The schema to use for encoding
   * @param value The value to encode
   * @returns CBOR encoded data as Uint8Array
   *
   * @example
   * ```typescript
   * const schema = cs.string;
   * const encoded = cs.toCBOR(schema, "Hello, CBOR!");
   * ```
   */
  static toCBOR<T>(schema: CBORSchemaType<T>, value: T): Uint8Array {
    const encoded = schema.toCBORType(value);
    return encodeCBOR(encoded);
  }
}

/**
 * Main schema builder class containing all schema constructors and primitive types.
 * Use this to build complex CBOR schemas that can encode/decode TypeScript types.
 *
 * @example
 * ```typescript
 * // Using primitive schemas
 * const stringSchema = cs.string;
 * const numberSchema = cs.float;
 *
 * // Creating complex schemas
 * const personSchema = cs.map([
 *   cs.field("name", cs.string),
 *   cs.field("age", cs.integer),
 *   cs.field("hobbies", cs.array(cs.string))
 * ]);
 *
 * // Encoding and decoding
 * const encoded = cs.toCBOR(personSchema, {
 *   name: "Alice",
 *   age: 30,
 *   hobbies: ["reading", "hiking"]
 * });
 * const decoded = cs.fromCBOR(personSchema, encoded);
 * ```
 */
export const cs = CBORSchema;

// Export types for external use
export type { FieldDefinition };
