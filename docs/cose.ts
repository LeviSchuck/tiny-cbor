import { cs } from "../cbor/cbor_schema.ts";
import { CBORSchemaType } from "../cbor/schema/type.ts";

// --- RFC 9052/9053 Constants (Illustrative Subset) ---

// COSE Tags (RFC 9052 Section 2)
const COSE_SIGN_TAG = 98;
const COSE_SIGN1_TAG = 18;
const COSE_ENCRYPT_TAG = 96;
const COSE_ENCRYPT0_TAG = 16;
const COSE_MAC_TAG = 97;
const COSE_MAC0_TAG = 17;

// Header Parameters Labels (RFC 9052 Section 3.1, Table 1 & RFC 9053 Tables 9, 10, 15)
const ALG = 1; // int / tstr
const CRIT = 2; // [+ label]
const CONTENT_TYPE = 3; // tstr / int
const KID = 4; // bstr
const IV = 5; // bstr
const PARTIAL_IV = 6; // bstr
const COUNTER_SIGNATURE = 7; // COSE_Signature / [+COSE_Signature]
const EPHEMERAL_KEY = -1; // COSE_Key
const STATIC_KEY = -2; // COSE_Key
const STATIC_KEY_ID = -3; // bstr
const SALT = -20; // bstr
const PARTY_U_IDENTITY = -21; // bstr
const PARTY_U_NONCE = -22; // bstr / int
const PARTY_U_OTHER = -23; // bstr
const PARTY_V_IDENTITY = -24; // bstr
const PARTY_V_NONCE = -25; // bstr / int
const PARTY_V_OTHER = -26; // bstr

// COSE Key Common Parameters Labels (RFC 9052 Section 7.1, Table 2)
const KTY = 1;
const KEY_ID = 2; // Note: same label as header KID(4), different context
const KEY_ALG = 3; // Note: same label as header ALG(1), different context
const KEY_OPS = 4;
const BASE_IV = 5;

// COSE Key Type Parameters Labels (RFC 9053 Section 7)
// EC2 & OKP
const KEY_PARAM_CRV = -1;
const KEY_PARAM_X = -2;
const KEY_PARAM_Y = -3; // EC2 only
const KEY_PARAM_D = -4;
// Symmetric
const KEY_PARAM_K = -1;

// COSE Key Types (RFC 9053 Section 7, Table 17)
const KTY_OKP = 1;
const KTY_EC2 = 2;
const KTY_SYMMETRIC = 4;

// --- Helper Schemas ---

/** Generic label type (int / tstr) */
const labelSchema = cs.union([cs.integer, cs.string]);

/** Represents the protected header map, which is serialized to bytes */
const protectedHeaderBytesSchema = cs.bytes; // bstr .cbor header_map

/** Represents the unprotected header map */
// Note: This only defines common headers. Real applications might need more.
// A truly generic map schema isn't directly supported by the current `cs.map`.
const unprotectedHeaderMapSchema = cs.map([
  cs.numberField(ALG, "alg", cs.optional(cs.union([cs.integer, cs.string]))),
  cs.numberField(CRIT, "crit", cs.optional(cs.array(labelSchema))),
  cs.numberField(
    CONTENT_TYPE,
    "contentType",
    cs.optional(cs.union([cs.string, cs.integer])),
  ),
  cs.numberField(KID, "kid", cs.optional(cs.bytes)),
  cs.numberField(IV, "iv", cs.optional(cs.bytes)),
  cs.numberField(PARTIAL_IV, "partialIv", cs.optional(cs.bytes)),
  // counter signature needs CoseSignatureSchema - defined later
  cs.numberField(EPHEMERAL_KEY, "ephemeralKey", cs.optional(CoseKeySchema)), // Use schema directly
  cs.numberField(STATIC_KEY, "staticKey", cs.optional(CoseKeySchema)), // Use schema directly
  cs.numberField(STATIC_KEY_ID, "staticKeyId", cs.optional(cs.bytes)),
  cs.numberField(SALT, "salt", cs.optional(cs.bytes)),
  cs.numberField(PARTY_U_IDENTITY, "partyUIdentity", cs.optional(cs.bytes)),
  cs.numberField(
    PARTY_U_NONCE,
    "partyUNonce",
    cs.optional(cs.union([cs.bytes, cs.integer])),
  ),
  cs.numberField(PARTY_U_OTHER, "partyUOther", cs.optional(cs.bytes)),
  cs.numberField(PARTY_V_IDENTITY, "partyVIdentity", cs.optional(cs.bytes)),
  cs.numberField(
    PARTY_V_NONCE,
    "partyVNonce",
    cs.optional(cs.union([cs.bytes, cs.integer])),
  ),
  cs.numberField(PARTY_V_OTHER, "partyVOther", cs.optional(cs.bytes)),
  // Field for counter signature
  cs.numberField(
    COUNTER_SIGNATURE,
    "counterSignature",
    cs.optional(cs.union([CoseSignatureSchema, cs.array(CoseSignatureSchema)])), // Use schema directly
  ),
]);

/**
 * COSE_Signature structure (RFC 9052 Section 4.3)
 * `[protected: empty_or_serialized_map, unprotected: header_map, signature: bstr]`
 */
export const CoseSignatureSchema = cs.tuple([
  protectedHeaderBytesSchema,
  unprotectedHeaderMapSchema,
  cs.bytes, // signature
]);

/**
 * COSE_Key structure (RFC 9052 Section 7 & RFC 9053 Section 7)
 * A map containing common and key-type-specific parameters.
 * Uses optional fields as a key can represent public or private parts,
 * and specific parameters depend on the key type (kty).
 */
export const CoseKeySchema = cs.map([
  // Common Parameters (RFC 9052 Table 2)
  cs.numberField(KTY, "kty", labelSchema), // REQUIRED
  cs.numberField(KEY_ID, "kid", cs.optional(cs.bytes)), // Use KEY_ID for COSE_Key context
  cs.numberField(KEY_ALG, "alg", cs.optional(labelSchema)), // Use KEY_ALG for COSE_Key context
  cs.numberField(KEY_OPS, "key_ops", cs.optional(cs.array(labelSchema))),
  cs.numberField(BASE_IV, "base_iv", cs.optional(cs.bytes)),

  // Key Type Specific Parameters (RFC 9053 Tables 19, 20, 21) - Negative integers
  // EC2 (kty=2) / OKP (kty=1) Parameters
  cs.numberField(KEY_PARAM_CRV, "crv", cs.optional(labelSchema)), // Curve identifier
  cs.numberField(KEY_PARAM_X, "x", cs.optional(cs.bytes)), // Public Key / x-coordinate
  // EC2 Specific
  cs.numberField(
    KEY_PARAM_Y,
    "y",
    cs.optional(cs.union([cs.bytes, cs.boolean])),
  ), // y-coordinate or sign bit
  // Symmetric (kty=4) Specific
  cs.numberField(KEY_PARAM_K, "k", cs.optional(cs.bytes)), // Key value
  // Private Key Parameter (EC2/OKP)
  cs.numberField(KEY_PARAM_D, "d", cs.optional(cs.bytes)), // Private key
]);

/**
 * COSE_KeySet structure (RFC 9052 Section 7.3)
 * `[+ COSE_Key]`
 */
export const CoseKeySetSchema = cs.array(CoseKeySchema);

/**
 * COSE_Recipient structure (RFC 9052 Section 5.3)
 * `[protected: empty_or_serialized_map, unprotected: header_map, ciphertext: bstr / nil, ? recipients: [+ COSE_Recipient]]`
 * Uses cs.nested to handle potential recursion.
 */
export const CoseRecipientSchema: CBORSchemaType<any> = cs.nested((self) =>
  cs.tuple([
    protectedHeaderBytesSchema,
    unprotectedHeaderMapSchema,
    cs.union([cs.bytes, cs.literal(null)]), // ciphertext (cek)
    cs.optional(cs.array(self)), // nested recipients
  ])
);

// --- COSE Message Schemas ---

/**
 * COSE_Sign structure (RFC 9052 Section 4.1)
 * Tag: 98
 * `[protected: empty_or_serialized_map, unprotected: header_map, payload: bstr / nil, signatures: [+ COSE_Signature]]`
 */
export const CoseSignSchema = cs.tagged(
  COSE_SIGN_TAG,
  cs.tuple([
    protectedHeaderBytesSchema,
    unprotectedHeaderMapSchema,
    cs.union([cs.bytes, cs.literal(null)]), // payload
    cs.array(CoseSignatureSchema), // signatures
  ]),
);

/**
 * COSE_Sign1 structure (RFC 9052 Section 4.2)
 * Tag: 18
 * `[protected: empty_or_serialized_map, unprotected: header_map, payload: bstr / nil, signature: bstr]`
 */
export const CoseSign1Schema = cs.tagged(
  COSE_SIGN1_TAG,
  cs.tuple([
    protectedHeaderBytesSchema,
    unprotectedHeaderMapSchema,
    cs.union([cs.bytes, cs.literal(null)]), // payload
    cs.bytes, // signature
  ]),
);

/**
 * COSE_Encrypt structure (RFC 9052 Section 5.1)
 * Tag: 96
 * `[protected: empty_or_serialized_map, unprotected: header_map, ciphertext: bstr / nil, recipients: [+ COSE_Recipient]]`
 */
export const CoseEncryptSchema = cs.tagged(
  COSE_ENCRYPT_TAG,
  cs.tuple([
    protectedHeaderBytesSchema,
    unprotectedHeaderMapSchema,
    cs.union([cs.bytes, cs.literal(null)]), // ciphertext
    cs.array(CoseRecipientSchema), // recipients
  ]),
);

/**
 * COSE_Encrypt0 structure (RFC 9052 Section 5.2)
 * Tag: 16
 * `[protected: empty_or_serialized_map, unprotected: header_map, ciphertext: bstr / nil]`
 */
export const CoseEncrypt0Schema = cs.tagged(
  COSE_ENCRYPT0_TAG,
  cs.tuple([
    protectedHeaderBytesSchema,
    unprotectedHeaderMapSchema,
    cs.union([cs.bytes, cs.literal(null)]), // ciphertext
  ]),
);

/**
 * COSE_Mac structure (RFC 9052 Section 6.1)
 * Tag: 97
 * `[protected: empty_or_serialized_map, unprotected: header_map, payload: bstr / nil, tag: bstr, recipients: [+ COSE_Recipient]]`
 */
export const CoseMacSchema = cs.tagged(
  COSE_MAC_TAG,
  cs.tuple([
    protectedHeaderBytesSchema,
    unprotectedHeaderMapSchema,
    cs.union([cs.bytes, cs.literal(null)]), // payload
    cs.bytes, // tag
    cs.array(CoseRecipientSchema), // recipients
  ]),
);

/**
 * COSE_Mac0 structure (RFC 9052 Section 6.2)
 * Tag: 17
 * `[protected: empty_or_serialized_map, unprotected: header_map, payload: bstr / nil, tag: bstr]`
 */
export const CoseMac0Schema = cs.tagged(
  COSE_MAC0_TAG,
  cs.tuple([
    protectedHeaderBytesSchema,
    unprotectedHeaderMapSchema,
    cs.union([cs.bytes, cs.literal(null)]), // payload
    cs.bytes, // tag
  ]),
);

// --- Examples ---

/**
 * Example usage: Encoding and Decoding a COSE_KeySet
 */
function exampleKeySet() {
  const keySet: typeof CoseKeySetSchema.infer = [
    { // Example Symmetric Key (AES-GCM 128)
      kty: KTY_SYMMETRIC, // 4
      kid: Uint8Array.from([0x01, 0x02, 0x03, 0x04]),
      alg: 1, // A128GCM (from RFC 9053, Table 5)
      k: Uint8Array.from(Array(16).fill(0xAA)), // 128-bit key value
      key_ops: [3, 4], // encrypt, decrypt
    },
    { // Example EC Public Key (P-256)
      kty: KTY_EC2, // 2
      kid: Uint8Array.from([0xDE, 0xAD, 0xBE, 0xEF]),
      alg: -7, // ES256 (from RFC 9053, Table 1)
      crv: 1, // P-256 (from RFC 9053, Table 18)
      x: Uint8Array.from(Array(32).fill(0xBB)), // 256-bit x-coordinate
      y: Uint8Array.from(Array(32).fill(0xCC)), // 256-bit y-coordinate
      key_ops: [2], // verify
    },
  ];

  try {
    // Encode the KeySet
    const encodedKeySet = cs.toCBOR(CoseKeySetSchema, keySet);
    console.log(
      "Encoded COSE_KeySet (Hex):",
      Buffer.from(encodedKeySet).toString("hex"),
    );
    // Output: Encoded COSE_KeySet (Hex): 82a501040244010203040301048203042150aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa501020244deadbeef032a0101215820bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb225820cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc048102

    // Decode the KeySet
    const decodedKeySet = cs.fromCBOR(CoseKeySetSchema, encodedKeySet);
    console.log("Decoded COSE_KeySet:", JSON.stringify(decodedKeySet, null, 2)); // Note: Uint8Arrays won't display nicely in JSON

    // Verify a field (optional)
    console.assert(
      decodedKeySet[0].kty === KTY_SYMMETRIC,
      "First key should be Symmetric",
    );
    console.assert(
      decodedKeySet[1].crv === 1,
      "Second key curve should be P-256",
    );
  } catch (e) {
    console.error("Error during KeySet example:", e);
  }
}

/**
 * Example usage: Encoding and Decoding a COSE_Sign1 message
 */
function exampleSign1() {
  const textEncoder = new TextEncoder();
  const payload = textEncoder.encode("This is the content to be signed.");

  // Simplified example - protected headers often contain alg
  const protectedHeaders = cs.toCBOR(
    cs.map([cs.numberField(ALG, "alg", cs.integer)]),
    { alg: -7 },
  ); // ES256

  const sign1Message: typeof CoseSign1Schema.inferTagged = {
    tag: COSE_SIGN1_TAG,
    value: [
      protectedHeaders, // Protected headers (serialized map)
      { kid: Uint8Array.from([115, 105, 103, 110, 101, 114, 45, 49]) }, // Unprotected headers {4: b'signer-1'}
      payload, // Payload
      Uint8Array.from(Array(64).fill(0xEE)), // Dummy signature
    ],
  };

  try {
    // Encode Sign1 message
    const encodedSign1 = cs.toCBOR(CoseSign1Schema, sign1Message);
    console.log(
      "\nEncoded COSE_Sign1 (Hex):",
      Buffer.from(encodedSign1).toString("hex"),
    );
    // Output: Encoded COSE_Sign1 (Hex): d28443a10126a104487369676e65722d315822546869732069732074686520636f6e74656e7420746f206265207369676e65642e5840eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee

    // Decode Sign1 message
    const decodedSign1 = cs.fromCBOR(CoseSign1Schema, encodedSign1);
    console.log("Decoded COSE_Sign1 Tag:", decodedSign1.tag);
    console.log("Decoded COSE_Sign1 Value:", decodedSign1.value);

    // Further decode protected headers if needed
    const decodedProtected = cs.fromCBOR(
      cs.map([cs.numberField(ALG, "alg", cs.integer)]),
      decodedSign1.value[0],
    );
    console.log("Decoded Protected Headers:", decodedProtected);
    console.assert(decodedProtected.alg === -7, "Algorithm should be ES256");
  } catch (e) {
    console.error("Error during Sign1 example:", e);
  }
}

// Run examples
// exampleKeySet();
// exampleSign1();
// Note: To run these examples, you might need a CBOR implementation and potentially
// Node.js environment for Buffer/console, or adapt to Deno/browser environment.
