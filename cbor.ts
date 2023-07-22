import { decodeLength } from "./cbor_internal.ts";
export type SimpleCBORType =
  | number
  | string
  | Uint8Array
  | boolean
  | null
  | undefined;
export type CBORType =
  | SimpleCBORType
  | CBORType[]
  | Map<string | number, CBORType>;

function decodeUnsignedInteger(
  data: Uint8Array,
  argument: number,
  index: number,
): [number, number] {
  return decodeLength(data, argument, index);
}

function decodeNegativeInteger(
  data: Uint8Array,
  argument: number,
  index: number,
): [number, number] {
  const [value, length] = decodeUnsignedInteger(data, argument, index);
  return [-value - 1, length];
}

function decodeByteString(
  data: Uint8Array,
  argument: number,
  index: number,
): [Uint8Array, number] {
  const [lengthValue, lengthConsumed] = decodeLength(data, argument, index);
  const dataStartIndex = index + lengthConsumed;
  return [
    data.slice(dataStartIndex, dataStartIndex + lengthValue),
    lengthConsumed + lengthValue,
  ];
}

const TEXT_DECODER = new TextDecoder();
function decodeString(
  data: Uint8Array,
  argument: number,
  index: number,
): [string, number] {
  const [value, length] = decodeByteString(data, argument, index);
  return [TEXT_DECODER.decode(value), length];
}

function decodeArray(
  data: Uint8Array,
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
    const remainingDataLength = data.length - index - consumedLength;
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
  data: Uint8Array,
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
    let remainingDataLength = data.length - index - consumedLength;
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

function decodeNext(data: Uint8Array, index: number): [CBORType, number] {
  const byte = data[index];
  const majorType = byte >> 5;
  const argument = byte & 0x1f;
  switch (majorType) {
    case 0: {
      return decodeUnsignedInteger(data, argument, index);
    }
    case 1: {
      return decodeNegativeInteger(data, argument, index);
    }
    case 2: {
      return decodeByteString(data, argument, index);
    }
    case 3: {
      return decodeString(data, argument, index);
    }
    case 4: {
      return decodeArray(data, argument, index);
    }
    case 5: {
      return decodeMap(data, argument, index);
    }
    case 7: {
      switch (argument) {
        case 20:
          return [false, 1];
        case 21:
          return [true, 1];
        case 22:
          return [null, 1];
        case 23:
          return [undefined, 1];
      }
    }
  }
  throw new Error(`Unsupported or not well formed at ${index}`);
}

export function decodePartialCBOR(
  data: Uint8Array,
  index: number,
): [CBORType, number] {
  if (data.length === 0 || data.length <= index || index < 0) {
    throw new Error("No data");
  }
  return decodeNext(data, index);
}

export function decodeCBOR(data: Uint8Array): CBORType {
  const [value, length] = decodePartialCBOR(data, 0);
  if (length !== data.length) {
    throw new Error(
      `Data was decoded, but the whole stream was not processed ${length} != ${data.length}`,
    );
  }
  return value;
}
