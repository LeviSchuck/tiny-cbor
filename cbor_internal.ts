export function decodeLength(
  data: Uint8Array,
  argument: number,
  index: number,
): [number, number] {
  if (argument < 24) {
    return [argument, 1];
  }
  const remainingDataLength = data.length - index - 1;
  switch (argument) {
    case 24: {
      if (remainingDataLength > 0) {
        const value = data[index + 1];
        if (value >= 24) {
          return [value, 2];
        }
      }
      break;
    }
    case 25: {
      if (remainingDataLength > 1) {
        const value1 = data[index + 1];
        const value2 = data[index + 2];
        const value = (value1 << 8) | value2;
        if (value >= 24) {
          return [value, 3];
        }
      }
      break;
    }
  }
  throw new Error("Length not supported or not well formed");
}
