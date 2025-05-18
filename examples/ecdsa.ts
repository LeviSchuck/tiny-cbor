import { cs } from "../index.ts";
import { decodeBase64Url } from "https://deno.land/x/tiny_encodings@0.1.0/encoding.ts";

const Ec2KeyParametersSchema = cs.map([
  cs.numberField(1, "kty", cs.literal(2)), // EC2 (ECDSA)
  cs.numberField(2, "kid", cs.optional(cs.bytes)), // key ID
  cs.numberField(3, "alg", cs.optional(cs.literal(-7))), // ES256
  cs.numberField(
    4,
    "key_ops",
    cs.optional(cs.array(cs.union([
      cs.literal(1), // sign (which we expect from a private key)
      cs.literal(2), // verify (which we expect from a public key)
    ]))),
  ),
  cs.numberField(-1, "crv", cs.literal(1)), // P-256
  cs.numberField(-2, "x", cs.bytes), // x-coordinate
  cs.numberField(-3, "y", cs.union([cs.bytes, cs.boolean])), // y-coordinate
  cs.numberField(-4, "d", cs.optional(cs.bytes)), // Private key
]);

// This is an example ECDSA P-256 private key.
// No need to file a report for a leaked key.
const key = decodeBase64Url(
  // Line break added for readability
  "pwECIAEhWCD2dKUDaWhLWJ9mzZ-gcJeFgTzXmvVwGsh_-z-MnRMUHyJYINwlpbVywj_6LAU" +
    "v8yACBRmEWcLeTmMsQQX4vTh083hNI1ggnuG5ksf4_br2nNDQC0cwfx2STOLiL57U04pAfY" +
    "aUhNgCUWhlbGxvQGV4YW1wbGUuY29tBIEB",
);

const result = cs.fromCBOR(Ec2KeyParametersSchema, key);

console.log(result);
/*
{
  kty: 2,
  kid: Uint8Array(17) [
    104, 101, 108, 108, 111,
     64, 101, 120,  97, 109,
    112, 108, 101,  46,  99,
    111, 109
  ],
  key_ops: [ 1 ],
  crv: 1,
  x: Uint8Array(32) [
    246, 116, 165,   3, 105, 104,  75,
     88, 159, 102, 205, 159, 160, 112,
    151, 133, 129,  60, 215, 154, 245,
    112,  26, 200, 127, 251,  63, 140,
    157,  19,  20,  31
  ],
  y: Uint8Array(32) [
    220,  37, 165, 181, 114, 194,  63, 250,
     44,   5,  47, 243,  32,   2,   5,  25,
    132,  89, 194, 222,  78,  99,  44,  65,
      5, 248, 189,  56, 116, 243, 120,  77
  ],
  d: Uint8Array(32) [
    158, 225, 185, 146, 199, 248, 253,
    186, 246, 156, 208, 208,  11,  71,
     48, 127,  29, 146,  76, 226, 226,
     47, 158, 212, 211, 138,  64, 125,
    134, 148, 132, 216
  ]
}
*/
