# Tiny CBOR

This minimal generic library decodes most useful CBOR structures into simple
JavaScript structures:

- Maps with keys as strings or numbers with `CBORType` values
- Arrays of `CBORType` values
- numbers
- strings
- byte strings as `Uint8Array`
- booleans
- null and undefined

This implementation does not support indefinite length maps, arrays, text
strings, or byte strings. It also does not support half precision floating point
numbers.

Maps only support strings or numbers as keys, while CBOR allows more than this,
it is difficult to implement in lightweight JavaScript. Maps that have duplicate
keys will result in an error during decoding.
