# Tiny CBOR

This minimal library decodes most useful CBOR structures into simple JavaScript
structures:

- Maps with keys as strings or numbers with `CBORType` values
- Arrays of `CBORType` values
- numbers
- strings
- byte strings as `Uint8Array`
- booleans
- null and undefined
