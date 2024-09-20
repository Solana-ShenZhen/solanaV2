import { createKeyPairSignerFromBytes, type KeyPairSigner } from "@solana/web3.js";
import fs from "fs/promises";
import resolve from "resolve-dir";

export async function loadKeypair(jsonPath: string): Promise<KeyPairSigner> {
  const fileContent = await fs.readFile(resolve(jsonPath), "utf-8");
  const keyPairData = JSON.parse(fileContent);
  return createKeyPairSignerFromBytes(new Uint8Array(keyPairData));
}
