# Tiny CBOR

[![](https://img.shields.io/github/actions/workflow/status/levischuck/tiny-cbor/build.yaml?branch=main&style=flat-square)](https://github.com/LeviSchuck/tiny-cbor/actions)
[![](https://img.shields.io/codecov/c/gh/levischuck/tiny-cbor?style=flat-square)](https://codecov.io/gh/levischuck/tiny-cbor)
[![](https://img.shields.io/github/v/tag/levischuck/tiny-cbor?label=npm&logo=npm&style=flat-square)](https://www.npmjs.com/package/@levischuck/tiny-cbor)
[![](https://img.shields.io/jsr/v/%40levischuck/tiny-cbor?style=flat-square&logo=jsr&label=JSR)](https://jsr.io/@levischuck/tiny-cbor)
[![](https://img.shields.io/github/license/levischuck/tiny-cbor?style=flat-square)](https://github.com/LeviSchuck/tiny-cbor/blob/main/LICENSE.txt)
![](https://img.shields.io/bundlephobia/min/%40levischuck/tiny-cbor?style=flat-square)

This minimal generic library decodes and encodes most useful CBOR structures
into simple JavaScript structures:

- Maps with keys as `string`s or `number`s with `CBORType` values as a `Map`
- Arrays of `CBORType` values
- integers as `number`s
- float32 and float64 as `number`s
- float16 `NaN`, `Infinity`, `-Infinity`
- `string`s
- byte strings as `Uint8Array`
- booleans
- `null` and `undefined`
- tags as `CBORTag(tag, value)`

## Limitations

This implementation does not support:

- indefinite length maps, arrays, text strings, or byte strings.
- half precision floating point numbers
- integers outside the range of `[-9007199254740991, 9007199254740991]`, see
  [Number.MAX_SAFE_INTEGER](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER)
- native output to JSON
- does not support generic objects, only `Map`s

This implementation has the following constraints:

- Map keys may only be strings or numbers
- Tags are not interpreted

## Behavior

Maps that have duplicate keys will throw an error during decoding. Decoding data
that is incomplete will throw an error during decoding.

## Example

CBOR byte decoding example, this outputs a CBORType which is up to you to ensure
matches the right underlying type (e.g. a string) at runtime.

```typescript
// NPM
// import { decodeCBOR } from "@levischuck/tiny-cbor";
// or JSR
// import { decodeCBOR } from "jsr:@levischuck/tiny-cbor";
import { decodeCBOR } from "./index.ts";
// Get your bytes somehow, directly or with decodeBase64 / decodeHex (available through @levischuck/tiny-encodings)
// encoded ["hello", "world", 1]
const HELLO_WORLD_BYTES = new Uint8Array([
  0x83, // Array (3)
  0x65, // text (5),
  0x68, // h
  0x65, // e
  0x6C, // l
  0x6C, // l
  0x6F, // o
  0x65, // text(5),
  0x77, // w
  0x6F, // o
  0x72, // r
  0x6C, // l
  0x64, // d
  0x01, // 1
]);
const decoded = decodeCBOR(HELLO_WORLD_BYTES);
if (
  Array.isArray(decoded) && decoded.length == 3 && decoded[0] == "hello" &&
  decoded[1] == "world" && decoded[2] == 1
) {
  console.log("Success!");
}
```

To check that the decoded CBOR matches a schema you expect, or to access it more
naturally in TypeScript and JavaScript:

```typescript
// NPM
// import { decodeCBOR } from "@levischuck/tiny-cbor";
// or JSR
// import { decodeCBOR } from "jsr:@levischuck/tiny-cbor";
import { cs, decodeCBOR } from "./index.ts";

// Utility to demonstrate the type is known at type-check time
type AssertEqual<T, Expected> = T extends Expected ? Expected extends T ? T
  : never
  : never;

const HELLO_WORLD_BYTES = new Uint8Array([
  0x83, // Array (3)
  0x65, // text (5),
  0x68, // h
  0x65, // e
  0x6C, // l
  0x6C, // l
  0x6F, // o
  0x65, // text(5),
  0x77, // w
  0x6F, // o
  0x72, // r
  0x6C, // l
  0x64, // d
  0x01, // 1
]);
const decoded = decodeCBOR(HELLO_WORLD_BYTES);
const schema = cs.tuple([cs.string, cs.string, cs.integer]);
const parsed = schema.fromCBORType(decoded);
// parsed will have the type [string, string, number]
// You don't need to use AssertEqual, this is just for demonstration that the type is preserved
const doubleChecked: AssertEqual<[string, string, number], typeof parsed> =
  parsed;
// If the type failed, this will be `never`, which it should not, since fromCBORType will throw

if (
  Array.isArray(doubleChecked) && doubleChecked.length == 3 &&
  doubleChecked[0] == "hello" && doubleChecked[1] == "world" &&
  doubleChecked[2] == 1
) {
  console.log("Success!");
}
```

## Where to get it

This library is available on
[NPM](https://www.npmjs.com/package/@levischuck/tiny-cbor) and
[JSR](https://jsr.io/@levischuck/tiny-cbor).

This library is no longer automatically published to Deno's Third Party Modules.
Newer versions may appear on deno.land/x, but do not work.
