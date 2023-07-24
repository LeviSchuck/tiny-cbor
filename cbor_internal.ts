export function decodeLength(
  data: Uint8Array,
  argument: number,
  index: number,
): [number, number] {
  if (argument < 24) {
    return [argument, 1];
  }
  const remainingDataLength = data.length - index - 1;
  const view = new DataView(data.buffer, index + 1);
  let output : number | undefined;
  let bytes = 0;
  switch (argument) {
    case 24: {
      if (remainingDataLength > 0) {
        output = view.getUint8(0);
        bytes = 2;
      }
      break;
    }
    case 25: {
      if (remainingDataLength > 1) {
        output = view.getUint16(0, false);
        bytes = 3;
      }
      break;
    }
    case 26: {
      if (remainingDataLength > 3) {
        output = view.getUint32(0, false);
        bytes = 5;
      }
      break;
    }
    case 27: {
      if (remainingDataLength > 7) {
        const bigOutput = view.getBigUint64(0, false);
        // Bound it to [24, MAX_SAFE_INTEGER], where it is safe
        // to encode as a javascript number
        if (bigOutput >= 24n && bigOutput <= Number.MAX_SAFE_INTEGER) {
          return [Number(bigOutput), 9];
        }
      }
      break;
    }
  }

  if (output && output >= 24) {
    return [output, bytes];
  }

  throw new Error("Length not supported or not well formed");
}

export type MajorType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export const MAJOR_TYPE_UNSIGNED_INTEGER: MajorType = 0;
export const MAJOR_TYPE_NEGATIVE_INTEGER: MajorType = 1;
export const MAJOR_TYPE_BYTE_STRING: MajorType = 2;
export const MAJOR_TYPE_TEXT_STRING: MajorType = 3;
export const MAJOR_TYPE_ARRAY: MajorType = 4;
export const MAJOR_TYPE_MAP: MajorType = 5;
export const MAJOR_TYPE_TAG: MajorType = 6;
export const MAJOR_TYPE_SIMPLE_OR_FLOAT: MajorType = 7;

export function encodeLength(
  major: MajorType,
  argument: number | bigint,
): number[] {
  const majorEncoded = major << 5;
  if (argument < 0) {
    throw new Error("CBOR Data Item argument must not be negative");
  }

  // Convert to bigint first.
  // Encode integers around and above 32 bits in big endian / network byte order
  // is unreliable in javascript.
  // https://tc39.es/ecma262/#sec-bitwise-shift-operators
  // Bit shifting operations result in 32 bit signed numbers
  let bigintArgument: bigint;
  if (typeof argument == "number") {
    if (!Number.isInteger(argument)) {
      throw new Error("CBOR Data Item argument must be an integer");
    }
    bigintArgument = BigInt(argument);
  } else {
    bigintArgument = argument;
  }

  // Negative 0 is not a thing
  if (major == MAJOR_TYPE_NEGATIVE_INTEGER) {
    if (bigintArgument == 0n) {
      throw new Error("CBOR Data Item argument cannot be zero when negative");
    }
    bigintArgument = bigintArgument - 1n;
  }

  if (bigintArgument > 18446744073709551615n) {
    throw new Error("CBOR number out of range");
  }

  // Encode into 64 bits and extract the tail
  const buffer = new Uint8Array(8);
  const view = new DataView(buffer.buffer);
  view.setBigUint64(0, bigintArgument, false);
  if (bigintArgument <= 23) {
    return [majorEncoded | buffer[7]];
  } else if (bigintArgument <= 255) {
    return [majorEncoded | 24, buffer[7]];
  } else if (bigintArgument <= 65535) {
    return [majorEncoded | 25, ...buffer.slice(6)];
  } else if (bigintArgument <= 4294967295) {
    return [
      majorEncoded | 26,
      ...buffer.slice(4),
    ];
  } else {
    return [
      majorEncoded | 27,
      ...buffer,
    ];
  }
}
