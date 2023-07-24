# Tiny CBOR

This minimal generic library decodes most useful CBOR structures into simple
JavaScript structures:

- Maps with keys as strings or numbers with `CBORType` values
- Arrays of `CBORType` values
- integers
- float32 and float64
- float16 `NaN`, `Infinity`, `-Infinity`
- strings
- byte strings as `Uint8Array`
- booleans
- null and undefined

## Limitations

This implementation does not support:

- indefinite length maps, arrays, text strings, or byte strings.
- half precision floating point numbers
- integers outside the range of `[-9007199254740991, 9007199254740991]`, see
  [Number.MAX_SAFE_INTEGER](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER)
- tags

This implementation has the following constraints:

- Map keys may only be strings or numbers

## Behavior

Maps that have duplicate keys will throw an error during decoding.
