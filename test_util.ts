export function decodeBase64(text: string): Uint8Array {
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
}
export function decodeHex(text: string): Uint8Array {
  text = text.replace(/[^0-9a-zA-Z]+/g, "");
  const match = text.match(/[0-9a-fA-F]{1,2}/g);
  if (text.match(/^[0-9a-fA-F]+$/) && match && match.length) {
    return Uint8Array.from(match.map((byte) => parseInt(byte, 16)));
  }
  throw new Error("Bad input to decodeHex");
}
