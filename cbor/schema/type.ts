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
 * Type helper that extracts the value type from a FieldDefinition
 */
export type ExtractFieldType<F> = F extends FieldDefinition<infer T, string> ? T
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
export type MapSchemaType<Fields extends FieldDefinition<unknown, string>[]> =
  Expand<
    {
      [K in ExtractJsKey<Fields[number]>]: ExtractFieldType<
        Extract<Fields[number], { jsKey: K }>
      >;
    }
  >;
