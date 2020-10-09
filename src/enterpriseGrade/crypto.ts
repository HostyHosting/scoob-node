import sodium from "sodium-native";

export function encryptMessage(publicKey: Buffer, messageString: string) {
  const message = Buffer.from(messageString, "utf-8");
  const ciphertext = Buffer.alloc(sodium.crypto_box_SEALBYTES + message.length);
  sodium.crypto_box_seal(ciphertext, message, publicKey);
  return ciphertext.toString("base64");
}

export function decryptMessage(
  publicKey: Buffer,
  secretKey: Buffer,
  ciphertextString: string
) {
  const ciphertext = Buffer.from(ciphertextString, "base64");
  const decrypted = Buffer.alloc(
    ciphertext.length - sodium.crypto_box_SEALBYTES
  );
  sodium.crypto_box_seal_open(decrypted, ciphertext, publicKey, secretKey);
  return decrypted.toString("utf-8");
}

export function generateKeys() {
  const publicKey = sodium.sodium_malloc(sodium.crypto_box_PUBLICKEYBYTES);
  const secretKey = sodium.sodium_malloc(sodium.crypto_box_SECRETKEYBYTES);
  sodium.crypto_box_keypair(publicKey, secretKey);
  return [publicKey, secretKey] as const;
}
