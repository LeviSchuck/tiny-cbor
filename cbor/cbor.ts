import {
  decodeLength,
  encodeLength,
  MAJOR_TYPE_ARRAY,
  MAJOR_TYPE_BYTE_STRING,
  MAJOR_TYPE_MAP,
  MAJOR_TYPE_NEGATIVE_INTEGER,
  MAJOR_TYPE_SIMPLE_OR_FLOAT,
  MAJOR_TYPE_TAG,
  MAJOR_TYPE_TEXT_STRING,
  MAJOR_TYPE_UNSIGNED_INTEGER,
} from "./cbor_internal.ts";

/**
 * A value which is wrapped with a CBOR Tag.
 * Several tags are registered with defined meanings like 0 for a date string.
 * These meanings are **not interpreted** when decoded or encoded.
 *
 * This class is an immutable record.
 * If the tag number or value needs to change, then construct a new tag
 */
export class CBORTag {
  private tagId: number;
  private tagValue: CBORType;
  /**
   * Wrap a value with a tag number.
   * When encoded, this tag will be attached to the value.
   *
   * @param tag Tag number
   * @param value Wrapped value
   */
  constructor(tag: number, value: CBORType) {
    this.tagId = tag;
    this.tagValue = value;
  }
  /**
   * Read the tag number
   */
  get tag(): number {
    return this.tagId;
  }
  /**
   * Read the value
   */
  get value(): CBORType {
    return this.tagValue;
  }
}

/**
 * Supported types which are encodable and decodable with tiny CBOR.
 * Note that plain javascript objects are omitted.
 */
export type CBORType =
  | number
  | bigint
  | string
  | Uint8Array
  | boolean
  | null
  | undefined
  | CBORType[]
  | CBORTag
  | Map<string | number, CBORType>;

function decodeUnsignedInteger(
  data: DataView,
  argument: number,
  index: number,
): [number, number] {
  return decodeLength(data, argument, index);
}

function decodeNegativeInteger(
  data: DataView,
  argument: number,
  index: number,
): [number, number] {
  const [value, length] = decodeUnsignedInteger(data, argument, index);
  return [-value - 1, length];
}

function decodeByteString(
  data: DataView,
  argument: number,
  index: number,
): [Uint8Array, number] {
  const [lengthValue, lengthConsumed] = decodeLength(data, argument, index);
  const dataStartIndex = index + lengthConsumed;
  return [
    new Uint8Array(
      data.buffer.slice(dataStartIndex, dataStartIndex + lengthValue),
    ),
    lengthConsumed + lengthValue,
  ];
}

const TEXT_DECODER = new TextDecoder();
function decodeString(
  data: DataView,
  argument: number,
  index: number,
): [string, number] {
  const [value, length] = decodeByteString(data, argument, index);
  return [TEXT_DECODER.decode(value), length];
}

function decodeArray(
  data: DataView,
  argument: number,
  index: number,
): [CBORType[], number] {
  if (argument === 0) {
    return [[], 1];
  }
  const [length, lengthConsumed] = decodeLength(data, argument, index);
  let consumedLength = lengthConsumed;
  const value = [];
  for (let i = 0; i < length; i++) {
    const remainingDataLength = data.byteLength - index - consumedLength;
    if (remainingDataLength <= 0) {
      throw new Error("array is not supported or well formed");
    }
    const [decodedValue, consumed] = decodeNext(data, index + consumedLength);
    value.push(decodedValue);
    consumedLength += consumed;
  }
  return [value, consumedLength];
}

const MAP_ERROR = "Map is not supported or well formed";

function decodeMap(
  data: DataView,
  argument: number,
  index: number,
): [CBORType, number] {
  if (argument === 0) {
    return [new Map(), 1];
  }
  const [length, lengthConsumed] = decodeLength(data, argument, index);
  let consumedLength = lengthConsumed;
  const result = new Map<string | number, CBORType>();
  for (let i = 0; i < length; i++) {
    let remainingDataLength = data.byteLength - index - consumedLength;
    if (remainingDataLength <= 0) {
      throw new Error(MAP_ERROR);
    }
    // Load key
    const [key, keyConsumed] = decodeNext(data, index + consumedLength);
    consumedLength += keyConsumed;
    remainingDataLength -= keyConsumed;
    // Check that there's enough to have a value
    if (remainingDataLength <= 0) {
      throw new Error(MAP_ERROR);
    }
    // Technically CBOR maps can have any type as the key, and so can JS Maps
    // However, JS Maps can only reference such keys as references which would
    // require key iteration and pattern matching.
    // For simplicity, since such keys are not in use with WebAuthn, this
    // capability is not implemented and the types are restricted to strings
    // and numbers.
    if (typeof key !== "string" && typeof key !== "number") {
      throw new Error(MAP_ERROR);
    }
    // CBOR Maps are not well formed if there are duplicate keys
    if (result.has(key)) {
      throw new Error(MAP_ERROR);
    }
    // Load value
    const [value, valueConsumed] = decodeNext(data, index + consumedLength);
    consumedLength += valueConsumed;
    result.set(key, value);
  }
  return [result, consumedLength];
}

function decodeFloat16(data: DataView, index: number): [number, number] {
  if (index + 3 > data.byteLength) {
    throw new Error("CBOR stream ended before end of Float 16");
  }
  // Skip the first byte
  const result = data.getUint16(index + 1, false);
  // A minimal selection of supported values
  if (result == 0x7c00) {
    return [Infinity, 3];
  } else if (result == 0x7e00) {
    return [NaN, 3];
  } else if (result == 0xfc00) {
    return [-Infinity, 3];
  }
  throw new Error("Float16 data is unsupported");
}

function decodeFloat32(data: DataView, index: number): [number, number] {
  if (index + 5 > data.byteLength) {
    throw new Error("CBOR stream ended before end of Float 32");
  }
  // Skip the first byte
  const result = data.getFloat32(index + 1, false);
  // First byte + 4 byte float
  return [result, 5];
}

function decodeFloat64(data: DataView, index: number): [number, number] {
  if (index + 9 > data.byteLength) {
    throw new Error("CBOR stream ended before end of Float 64");
  }
  // Skip the first byte
  const result = data.getFloat64(index + 1, false);
  // First byte + 8 byte float
  return [result, 9];
}

function decodeTag(
  data: DataView,
  argument: number,
  index: number,
): [CBORTag, number] {
  const [tag, tagBytes] = decodeLength(data, argument, index);
  const [value, valueBytes] = decodeNext(data, index + tagBytes);
  return [new CBORTag(tag, value), tagBytes + valueBytes];
}

function decodeNext(data: DataView, index: number): [CBORType, number] {
  if (index >= data.byteLength) {
    throw new Error("CBOR stream ended before tag value");
  }
  const byte = data.getUint8(index);
  const majorType = byte >> 5;
  const argument = byte & 0x1f;
  switch (majorType) {
    case MAJOR_TYPE_UNSIGNED_INTEGER: {
      return decodeUnsignedInteger(data, argument, index);
    }
    case MAJOR_TYPE_NEGATIVE_INTEGER: {
      return decodeNegativeInteger(data, argument, index);
    }
    case MAJOR_TYPE_BYTE_STRING: {
      return decodeByteString(data, argument, index);
    }
    case MAJOR_TYPE_TEXT_STRING: {
      return decodeString(data, argument, index);
    }
    case MAJOR_TYPE_ARRAY: {
      return decodeArray(data, argument, index);
    }
    case MAJOR_TYPE_MAP: {
      return decodeMap(data, argument, index);
    }
    case MAJOR_TYPE_TAG: {
      return decodeTag(data, argument, index);
    }
    case MAJOR_TYPE_SIMPLE_OR_FLOAT: {
      switch (argument) {
        case 20:
          return [false, 1];
        case 21:
          return [true, 1];
        case 22:
          return [null, 1];
        case 23:
          return [undefined, 1];
        // 24: Simple value (value 32..255 in following byte)
        case 25: // IEEE 754 Half-Precision Float (16 bits follow)
          return decodeFloat16(data, index);
        case 26: // IEEE 754 Single-Precision Float (32 bits follow)
          return decodeFloat32(data, index);
        case 27: // IEEE 754 Double-Precision Float (64 bits follow)
          return decodeFloat64(data, index);
          // 28-30: Reserved, not well-formed in the present document
          // 31: "break" stop code for indefinite-length items
      }
    }
  }
  throw new Error(`Unsupported or not well formed at ${index}`);
}

function encodeSimple(data: boolean | null | undefined): number {
  if (data === true) {
    return 0xf5;
  } else if (data === false) {
    return 0xf4;
  } else if (data === null) {
    return 0xf6;
  } else if (data === undefined) {
    return 0xf7;
  }
  throw new Error("Internal error");
}

function encodeFloat(data: number): Uint8Array {
  if (
    Math.fround(data) == data || !Number.isFinite(data) || Number.isNaN(data)
  ) {
    // Float32
    const output = new Uint8Array(5);
    output[0] = 0xfa;
    const view = new DataView(output.buffer);
    view.setFloat32(1, data, false);
    return output;
  } else {
    // Float64
    const output = new Uint8Array(9);
    output[0] = 0xfb;
    const view = new DataView(output.buffer);
    view.setFloat64(1, data, false);
    return output;
  }
}

function encodeNumber(data: number | bigint): (number | Uint8Array)[] {
  if (typeof data == "number") {
    if (Number.isSafeInteger(data)) {
      // Encode integer
      if (data < 0) {
        return encodeLength(MAJOR_TYPE_NEGATIVE_INTEGER, Math.abs(data));
      } else {
        return encodeLength(MAJOR_TYPE_UNSIGNED_INTEGER, data);
      }
    }
    return [encodeFloat(data)];
  } else {
    if (data < 0n) {
      return encodeLength(MAJOR_TYPE_NEGATIVE_INTEGER, data * -1n);
    } else {
      return encodeLength(MAJOR_TYPE_UNSIGNED_INTEGER, data);
    }
  }
}

const ENCODER = new TextEncoder();

function encodeString(data: string): (number | Uint8Array)[] {
  return [
    new Uint8Array(encodeLength(MAJOR_TYPE_TEXT_STRING, data.length)),
    ENCODER.encode(data),
  ];
}

function encodeBytes(data: Uint8Array): (number | Uint8Array)[] {
  return [
    new Uint8Array(encodeLength(MAJOR_TYPE_BYTE_STRING, data.length)),
    data,
  ];
}

function encodeArray(data: CBORType[]): (number | Uint8Array)[] {
  const output: (number | Uint8Array)[] = [];
  output.push(new Uint8Array(encodeLength(MAJOR_TYPE_ARRAY, data.length)));
  for (const element of data) {
    output.push(...encodePartialCBOR(element));
  }
  return output;
}

function encodeMap(
  data: Map<string | number, CBORType>,
): (number | Uint8Array)[] {
  const output: (number | Uint8Array)[] = [];
  output.push(new Uint8Array(encodeLength(MAJOR_TYPE_MAP, data.size)));
  for (const [key, value] of data.entries()) {
    output.push(...encodePartialCBOR(key));
    output.push(...encodePartialCBOR(value));
  }
  return output;
}

function encodeTag(tag: CBORTag): (number | Uint8Array)[] {
  return [
    new Uint8Array(encodeLength(MAJOR_TYPE_TAG, tag.tag)),
    ...encodePartialCBOR(tag.value),
  ];
}

function encodePartialCBOR(data: CBORType): (number | Uint8Array)[] {
  if (typeof data == "boolean" || data === null || data == undefined) {
    return [encodeSimple(data)];
  }
  if (typeof data == "number" || typeof data == "bigint") {
    return encodeNumber(data);
  }
  if (typeof data == "string") {
    return encodeString(data);
  }
  if (data instanceof Uint8Array) {
    return encodeBytes(data);
  }
  if (Array.isArray(data)) {
    return encodeArray(data);
  }
  if (data instanceof Map) {
    return encodeMap(data);
  }
  if (data instanceof CBORTag) {
    return encodeTag(data);
  }
  throw new Error("Not implemented");
}

/**
 * Like {decodeCBOR}, but the length of the data is unknown and there is likely
 * more -- possibly unrelated non-CBOR -- data afterwards.
 *
 * Examples:
 *
 * ```ts
 * import {decodePartialCBOR} from './cbor.ts'
 * decodePartialCBOR(new Uint8Array([1, 2, 245, 3, 4]), 2)
 * // returns [true, 1]
 * // It did not decode the leading [1, 2] or trailing [3, 4]
 * ```
 *
 * @param data a data stream to read data from
 * @param index where to start reading in the data stream
 * @returns a tuple of the value followed by bytes read.
 * @throws {Error}
 *   When the data stream ends early or the CBOR data is not well formed
 */
export function decodePartialCBOR(
  data: DataView | Uint8Array | ArrayBuffer,
  index: number,
): [CBORType, number] {
  if (data.byteLength === 0 || data.byteLength <= index || index < 0) {
    throw new Error("No data");
  }

  if (data instanceof Uint8Array) {
    return decodeNext(new DataView(data.buffer), index);
  } else if (data instanceof ArrayBuffer) {
    return decodeNext(new DataView(data), index);
  }

  // otherwise, it is a data view
  return decodeNext(data, index);
}

/**
 * Decode CBOR data from a binary stream
 *
 * The entire data stream from [0, length) will be consumed.
 * If you require a partial decoding, see {decodePartialCBOR}.
 *
 * Examples:
 *
 * ```ts
 * import {decodeCBOR, CBORTag, CBORType} from './cbor.ts'
 * decodeCBOR(new Uint8Array([162, 99, 107, 101, 121, 101, 118, 97, 108, 117, 101, 1, 109, 97, 110, 111, 116, 104, 101, 114, 32, 118, 97, 108, 117, 101]));
 * // returns new Map<string | number, CBORType>([
 * //   ["key", "value"],
 * //   [1, "another value"]
 * // ]);
 *
 * const taggedItem = new Uint8Array([217, 4, 210, 101, 104, 101, 108, 108, 111]);
 * decodeCBOR(new DataView(taggedItem.buffer))
 * // returns new CBORTag(1234, "hello")
 * ```
 *
 * @param data a data stream, multiple types are supported
 * @returns
 */
export function decodeCBOR(
  data: DataView | Uint8Array | ArrayBuffer,
): CBORType {
  const [value, length] = decodePartialCBOR(data, 0);
  if (length !== data.byteLength) {
    throw new Error(
      `Data was decoded, but the whole stream was not processed ${length} != ${data.byteLength}`,
    );
  }
  return value;
}

/**
 * Encode a supported structure to a CBOR byte string.
 *
 * Example:
 *
 * ```ts
 * import {encodeCBOR, CBORType, CBORTag} from './cbor.ts'
 * encodeCBOR(new Map<string | number, CBORType>([
 *   ["key", "value"],
 *   [1, "another value"]
 * ]));
 * // returns new Uint8Array([162, 99, 107, 101, 121, 101, 118, 97, 108, 117, 101, 1, 109, 97, 110, 111, 116, 104, 101, 114, 32 118, 97, 108, 117, 101])
 *
 * encodeCBOR(new CBORTag(1234, "hello"))
 * // returns new UInt8Array([217, 4, 210, 101, 104, 101, 108, 108, 111])
 * ```
 *
 * @param data Data to encode
 * @returns A byte string as a Uint8Array
 * @throws Error
 *   if unsupported data is found during encoding
 */
export function encodeCBOR(data: CBORType): Uint8Array {
  const results = encodePartialCBOR(data);
  let length = 0;
  for (const result of results) {
    if (typeof result == "number") {
      length += 1;
    } else {
      length += result.length;
    }
  }
  const output = new Uint8Array(length);
  let index = 0;
  for (const result of results) {
    if (typeof result == "number") {
      output[index] = result;
      index += 1;
    } else {
      output.set(result, index);
      index += result.length;
    }
  }
  return output;
}
