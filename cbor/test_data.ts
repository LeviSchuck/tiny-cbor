// deno-lint-ignore-file no-explicit-any
import {
  decodeBase64,
  decodeHex,
} from "https://deno.land/x/tiny_encodings@0.1.0/encoding.ts";

export const APPLE_MACBOOK_WEBAUTHN_PAYLOAD: Uint8Array = decodeBase64(
  "o2NmbXRmcGFja2VkZ2F0dFN0bXSiY2FsZyZjc2lnWEcwRQIhALaKZcLGbJC2pBgXo1TOQ3kk6QJBK6f06RoVRPXWoKZ1AiAem3G7nAvOdHmRkRB6XLSqqW6ewlSnEQEh41nihBaexWhhdXRoRGF0YVik5Xzy8T0lOI+lGCNxUj1Gkv4afX8pd2CguvM0wW24Z31FAAAAAK3OAAI1vMYKZIsLJfHwVQMAIIbxWxpjQbTc5Egz0nCF0CMGAKZR63CA2Q104dGfXhRUpQECAyYgASFYIJuZHdGDZCQWWhbCL/unV9t0EySQlGn91bWqM72cOfn+Ilgg58aIWjt6fa1ysYdJoKrEw17+tjNPJEtTmvlC7Ee0vt0=",
);
export const APPLE_MACBOOK_WEBAUTHN_SIGNATURE: Uint8Array = decodeBase64(
  "MEUCIQC2imXCxmyQtqQYF6NUzkN5JOkCQSun9OkaFUT11qCmdQIgHptxu5wLznR5kZEQely0qqlunsJUpxEBIeNZ4oQWnsU=",
);
export const APPLE_MACBOOK_WEBAUTHN_AUTH_DATA: Uint8Array = decodeBase64(
  "5Xzy8T0lOI+lGCNxUj1Gkv4afX8pd2CguvM0wW24Z31FAAAAAK3OAAI1vMYKZIsLJfHwVQMAIIbxWxpjQbTc5Egz0nCF0CMGAKZR63CA2Q104dGfXhRUpQECAyYgASFYIJuZHdGDZCQWWhbCL/unV9t0EySQlGn91bWqM72cOfn+Ilgg58aIWjt6fa1ysYdJoKrEw17+tjNPJEtTmvlC7Ee0vt0=",
);
export const YUBIKEY_WEBAUTHN_PAYLOAD: Uint8Array = decodeBase64(
  "o2NmbXRmcGFja2VkZ2F0dFN0bXSjY2FsZyZjc2lnWEcwRQIhALBn778qDKHv8NV1uOmDJpK489XDUtETDzEmCx+/iNTpAiBIOHVRFmnNPCn2Mpa373DBhmOdCzJm4dRM00zKmykgsGN4NWOBWQLdMIIC2TCCAcGgAwIBAgIJAN+S2cTi7WYKMA0GCSqGSIb3DQEBCwUAMC4xLDAqBgNVBAMTI1l1YmljbyBVMkYgUm9vdCBDQSBTZXJpYWwgNDU3MjAwNjMxMCAXDTE0MDgwMTAwMDAwMFoYDzIwNTAwOTA0MDAwMDAwWjBvMQswCQYDVQQGEwJTRTESMBAGA1UECgwJWXViaWNvIEFCMSIwIAYDVQQLDBlBdXRoZW50aWNhdG9yIEF0dGVzdGF0aW9uMSgwJgYDVQQDDB9ZdWJpY28gVTJGIEVFIFNlcmlhbCAxMTU1MTA5NTk5MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEChhsbk0KalKKRJCaeiQjaHAo1MV+zLcXuhKAuFwvweTgYWaMPCCu8zNQ0ZZFI4osOQv13/o0/yVQL0cPPUC4iKOBgTB/MBMGCisGAQQBgsQKDQEEBQQDBQQDMCIGCSsGAQQBgsQKAgQVMS4zLjYuMS40LjEuNDE0ODIuMS43MBMGCysGAQQBguUcAgEBBAQDAgQwMCEGCysGAQQBguUcAQEEBBIEEC/AV5+BE0fqsRa7Wo25ICowDAYDVR0TAQH/BAIwADANBgkqhkiG9w0BAQsFAAOCAQEAgqyvETCpm9FDJ9L4+bBBoqBKZoUnJCLlexSwuPg7bxVFZku/VWgerwFYciq/ztLkrGM87AlZVkUksPLlF92XEJi5iRUX7NDFU6Lkc5+d4T2v0NXXuKxKN/TyzDDvJcsAZS0Z22nX2le9Gpwdjth9RtgNKzvf0dnvnStoMtStW810IUzmphQdFrLpOsssiPYKPrbV9hRxl1kJNzvGd5AjJFcaVz9g8Hu+0XuSyLWfooIQv6jGASKTABs57+V7+cseOsqKQTD4Ovhmj3Pe8nEbINyZ6KgE7qP3QnGXtrRRs3NcI7ybG+J0wm07+RlvjEpLcV9LlcTbe5fnWU60ZWSMHGhhdXRoRGF0YVjE5Xzy8T0lOI+lGCNxUj1Gkv4afX8pd2CguvM0wW24Z31BAAAAAi/AV5+BE0fqsRa7Wo25ICoAQPPTdIWWy5rxtPl7kMlvDhCnyedMAL1MnIb6Dr4X8LxYxxPPf1ePUCDkcaeTkDumNZe8QygXVYURVjC2C0Ms0I6lAQIDJiABIVgg7A8cNQWoU35zXxfQTE5VUTnG6ivmvGXP5guCyjRtX4MiWCCGwl6Xa+GjdAd9GIIIEAIfw0jDtNfET+V6HUUIU1LRYg==",
);
export const YUBIKEY_WEBAUTHN_SIGNATURE: Uint8Array = decodeBase64(
  "MEUCIQCwZ++/Kgyh7/DVdbjpgyaSuPPVw1LREw8xJgsfv4jU6QIgSDh1URZpzTwp9jKWt+9wwYZjnQsyZuHUTNNMypspILA=",
);
export const YUBIKEY_WEBAUTHN_CERT: Uint8Array = decodeBase64(
  "MIIC2TCCAcGgAwIBAgIJAN+S2cTi7WYKMA0GCSqGSIb3DQEBCwUAMC4xLDAqBgNVBAMTI1l1YmljbyBVMkYgUm9vdCBDQSBTZXJpYWwgNDU3MjAwNjMxMCAXDTE0MDgwMTAwMDAwMFoYDzIwNTAwOTA0MDAwMDAwWjBvMQswCQYDVQQGEwJTRTESMBAGA1UECgwJWXViaWNvIEFCMSIwIAYDVQQLDBlBdXRoZW50aWNhdG9yIEF0dGVzdGF0aW9uMSgwJgYDVQQDDB9ZdWJpY28gVTJGIEVFIFNlcmlhbCAxMTU1MTA5NTk5MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEChhsbk0KalKKRJCaeiQjaHAo1MV+zLcXuhKAuFwvweTgYWaMPCCu8zNQ0ZZFI4osOQv13/o0/yVQL0cPPUC4iKOBgTB/MBMGCisGAQQBgsQKDQEEBQQDBQQDMCIGCSsGAQQBgsQKAgQVMS4zLjYuMS40LjEuNDE0ODIuMS43MBMGCysGAQQBguUcAgEBBAQDAgQwMCEGCysGAQQBguUcAQEEBBIEEC/AV5+BE0fqsRa7Wo25ICowDAYDVR0TAQH/BAIwADANBgkqhkiG9w0BAQsFAAOCAQEAgqyvETCpm9FDJ9L4+bBBoqBKZoUnJCLlexSwuPg7bxVFZku/VWgerwFYciq/ztLkrGM87AlZVkUksPLlF92XEJi5iRUX7NDFU6Lkc5+d4T2v0NXXuKxKN/TyzDDvJcsAZS0Z22nX2le9Gpwdjth9RtgNKzvf0dnvnStoMtStW810IUzmphQdFrLpOsssiPYKPrbV9hRxl1kJNzvGd5AjJFcaVz9g8Hu+0XuSyLWfooIQv6jGASKTABs57+V7+cseOsqKQTD4Ovhmj3Pe8nEbINyZ6KgE7qP3QnGXtrRRs3NcI7ybG+J0wm07+RlvjEpLcV9LlcTbe5fnWU60ZWSMHA==",
);
export const YUBIKEY_WEBAUTHN_AUTH_DATA: Uint8Array = decodeBase64(
  "5Xzy8T0lOI+lGCNxUj1Gkv4afX8pd2CguvM0wW24Z31BAAAAAi/AV5+BE0fqsRa7Wo25ICoAQPPTdIWWy5rxtPl7kMlvDhCnyedMAL1MnIb6Dr4X8LxYxxPPf1ePUCDkcaeTkDumNZe8QygXVYURVjC2C0Ms0I6lAQIDJiABIVgg7A8cNQWoU35zXxfQTE5VUTnG6ivmvGXP5guCyjRtX4MiWCCGwl6Xa+GjdAd9GIIIEAIfw0jDtNfET+V6HUUIU1LRYg==",
);
export const WEBAUTHN_REGISTRATION_PAYLOAD: Uint8Array = decodeHex(
  "a5010203262001215820ec0f1c3505a8537e735f17d04c4e555139c6ea2be6bc65cfe60b82ca346d5f8322582086c25e976be1a374077d18820810021fc348c3b4d7c44fe57a1d45085352d162",
);
export const WEBAUTHN_REGISTRATION_X_COORD: Uint8Array = decodeHex(
  "ec0f1c3505a8537e735f17d04c4e555139c6ea2be6bc65cfe60b82ca346d5f83",
);
export const WEBAUTHN_REGISTRATION_Y_COORD: Uint8Array = decodeHex(
  "86c25e976be1a374077d18820810021fc348c3b4d7c44fe57a1d45085352d162",
);
export const HELLO_WORLD_CBOR: Uint8Array = decodeHex(
  "6b68656c6c6f20776f726c64",
);
export const BYTES_HELLO_WORLD_CBOR: Uint8Array = decodeHex(
  "4b68656c6c6f20776f726c64",
);
export const LOWER_ALPHABET_CBOR: Uint8Array = decodeHex(
  "781a6162636465666768696a6b6c6d6e6f707172737475767778797a",
);
export const HELLO_WORLD_AS_BYTES: Uint8Array = decodeHex(
  "68656c6c6f20776f726c64",
);
export const LONG_ARRAY_CBOR: Uint8Array = decodeHex(
  "9818000000000000000000000000000000000000000000000000",
);
export const LONG_ARRAY: Array<number> = new Array(0x18).fill(0);
const encoder = new TextEncoder();
export const LOWER_ALPHABET_BYTES: Uint8Array = encoder.encode(
  "abcdefghijklmnopqrstuvwxyz",
);
export const LOWER_ALPHABET_BYTES_CBOR: Uint8Array = decodeHex(
  "581a6162636465666768696a6b6c6d6e6f707172737475767778797a",
);

export const DECODED_APPLE_MACBOOK_WEBAUTHN_PAYLOAD = new Map<any, any>([
  ["fmt", "packed"],
  [
    "attStmt",
    new Map<any, any>([
      ["alg", -7],
      [
        "sig",
        APPLE_MACBOOK_WEBAUTHN_SIGNATURE,
      ],
    ]),
  ],
  [
    "authData",
    APPLE_MACBOOK_WEBAUTHN_AUTH_DATA,
  ],
]);
export const DECODED_YUBIKEY_WEBAUTHN_PAYLOAD = new Map<any, any>([
  ["fmt", "packed"],
  [
    "attStmt",
    new Map<any, any>([
      ["alg", -7],
      [
        "sig",
        YUBIKEY_WEBAUTHN_SIGNATURE,
      ],
      ["x5c", [
        YUBIKEY_WEBAUTHN_CERT,
      ]],
    ]),
  ],
  [
    "authData",
    YUBIKEY_WEBAUTHN_AUTH_DATA,
  ],
]);
export const DECODED_WEBAUTHN_REGISTRATION_PAYLOAD = new Map<any, any>([
  [1, 2],
  [3, -7],
  [-1, 1],
  [
    -2,
    WEBAUTHN_REGISTRATION_X_COORD,
  ],
  [
    -3,
    WEBAUTHN_REGISTRATION_Y_COORD,
  ],
]);
