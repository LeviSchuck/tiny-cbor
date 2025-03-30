import type { CBORType } from "../cbor.ts";

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
 *   toCBORType: (value) => value,
 *   // Optional tryFromCBORType implementation
 *   tryFromCBORType: (data) => {
 *     if (typeof data !== "string") return [false, "Not a string"];
 *     return [true, data];
 *   },
 *   // Optional tryToCBORType implementation
 *   tryToCBORType: (value) => {
 *     if (typeof value !== "string") return [false, "Not a string"];
 *     return [true, value];
 *   }
 * };
 * ```
 */
export interface CBORSchemaType<T> {
  fromCBORType(data: CBORType): T;
  toCBORType(value: T): CBORType;
  isOptional?: true;
  tryFromCBORType?(data: CBORType): [true, T] | [false, string];
  tryToCBORType?(value: T): [true, CBORType] | [false, string];
}

/**
 * Type helper that extracts the value type from a CBORSchemaType
 *
 * @example
 * ```typescript
 * import { cs } from "../cbor_schema.ts";
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
 * import { cs } from "../cbor_schema.ts";
 * const nameField: FieldDefinition<string, "name"> = {
 *   key: "name",
 *   jsKey: "name",
 *   schema: cs.string,
 * };
 * ```
 */
export interface FieldDefinition<T, K extends string> {
  key: string | number;
  jsKey: K;
  schema: CBORSchemaType<T>;
}

/**
 * Type helper that extracts the value type from a field definition
 */
export type ExtractFieldType<F> = F extends FieldDefinition<infer T, string> ? T
  : never;

export type Expand<T> = T extends (...args: infer A) => infer R
  ? (...args: Expand<A>) => Expand<R>
  : T extends object ? { [K in keyof T]: T[K] }
  : T;

/**
 * Type helper that makes properties optional if their type is T | undefined
 */
type OptionalKeys<T> = {
  [K in keyof T as undefined extends T[K] ? K : never]: T[K];
};

type RequiredKeys<T> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K];
};

export type MakeOptional<T> = Expand<
  Partial<OptionalKeys<T>> & RequiredKeys<T>
>;

/**
 * Type helper that constructs a TypeScript object type from an array of field definitions
 */
export type MapSchemaType<Fields extends FieldDefinition<unknown, string>[]> =
  MakeOptional<
    {
      [K in Fields[number]["jsKey"]]: ExtractFieldType<
        Extract<Fields[number], { jsKey: K }>
      > extends infer T
        ? Extract<Fields[number], { jsKey: K }>["schema"] extends
          { isOptional: true } ? T | undefined
        : T
        : never;
    }
  >;

/**
 * Interface for map schemas that support extension
 */
export interface ExtendableMapSchema<T> extends CBORSchemaType<T> {
  extend: <NewFields extends FieldDefinition<unknown, string>[]>(
    newFields: NewFields,
  ) => ExtendableMapSchema<
    MakeOptional<Expand<T & MapSchemaType<NewFields>>>
  >;
}
