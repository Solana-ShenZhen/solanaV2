import { getTransferSolInstruction } from "@solana-program/system";
import {
  address,
  appendTransactionMessageInstruction,
  BASE_ACCOUNT_SIZE,
  compileTransaction,
  createKeyPairSignerFromPrivateKeyBytes,
  createSignableMessage,
  createTransactionMessage,
  generateKeyPairSigner,
  getBase58Decoder,
  partiallySignTransactionMessageWithSigners,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  type Address,
  type Blockhash,
  type CompilableTransactionMessage,
  type CompiledTransactionMessage,
  type MessagePartialSigner,
  type SignableMessage,
  type SignatureDictionary,
  type TransactionPartialSigner,
  type TransactionSigner,
} from "@solana/web3.js";
import bs58 from "bs58";
import { loadKeypair } from "./utils";
import fs from "fs/promises";
import resolve from "resolve-dir";

function getTransferSolTransactionMessage(signer: TransactionSigner) {
  const instruction = getTransferSolInstruction({
    source: signer,
    destination: address("ED1WqT2hWJLSZtj4TtTdoovmpMrr7zpkUdbfxmcJR1Fq"),
    amount: 1n,
  });

  const mockBlockhash = {
    blockhash: "9fBfi7Q23LHd6gDENDhp25jRnzeGJZesAtCkKuqkga63" as Blockhash,
    lastValidBlockHeight: 1119n,
  };

  return pipe(
    createTransactionMessage({ version: 0 }),
    tx => setTransactionMessageFeePayer(signer.address, tx),
    tx => setTransactionMessageLifetimeUsingBlockhash(mockBlockhash, tx),
    tx => appendTransactionMessageInstruction(instruction, tx),
  );
}

async function signMessage(signer: MessagePartialSigner, message: string) {
  const [signatureDictionary] = await signer.signMessages([createSignableMessage(message)]);
  const signature = signatureDictionary[signer.address];
  console.log(`Signature: ${getBase58Decoder().decode(signature)}`);
}

async function signTransaction(signer: TransactionPartialSigner, transactionMessage: CompilableTransactionMessage) {
  const transaction = compileTransaction(transactionMessage);
  const [signatureDictionary] = await signer.signTransactions([transaction]);
  const signature = signatureDictionary[signer.address];
  console.log(`Signature: ${getBase58Decoder().decode(signature)}`);
}

async function signTransactionWithSigners(transactionMessage: CompilableTransactionMessage) {
  // const signedTransaction = await signTransactionWithSigners(transactionMessage);
  const signedTransaction = await partiallySignTransactionMessageWithSigners(transactionMessage);
  const signature = signedTransaction.signatures[transactionMessage.feePayer];
  console.log(`Signature: ${getBase58Decoder().decode(signature!)}`);
}

// {
//   const signer = await generateKeyPairSigner();

//   const transactionMessage = getTransferSolTransactionMessage(signer);
//   await signMessage(signer, "Hello, world!");
//   await signTransaction(signer, transactionMessage);
//   await signTransactionWithSigners(transactionMessage);
//   BASE_ACCOUNT_SIZE;
// }

{
  const seed = [
    232, 27, 166, 70, 79, 203, 13, 160, 116, 239, 80, 146, 125, 104, 100, 54, 71, 124, 252, 221, 107, 101, 227, 26, 206,
    153, 244, 48, 212, 177, 46, 247,
  ];
  // crypto.getRandomValues(seed);
  console.log(`Private key: ${seed}`);
  const signer1 = await createKeyPairSignerFromPrivateKeyBytes(new Uint8Array(seed));
  console.log(`Public key: ${bs58.decode(signer1.address)}`);
  // console.log(`Keypair: ${JSON.stringify(signer.keyPair, null, 2)}`);
  const signer2 = await loadKeypair("./payer.json");
  console.log(`Public key: ${bs58.decode(signer2.address)}`);
  // console.log(`Public key: ${bs58.decode(signer.keyPair.publicKey.toString())}`);
  // console.log(`Secret key: ${bs58.decode(signer.keyPair.privateKey.toString())}`);
}

// async function signMessage(signer: MessagePartialSigner, message: string) {
//   const [signatureDictionary] = await signer.signMessages([createSignableMessage(message)]);
//   const encodedSignatures = Object.entries(signatureDictionary).reduce(
//     (acc, [address, signature]) => {
//       acc[address as Address] = bs58.encode(Buffer.from(Object.values(signature)));
//       return acc;
//     },
//     {} as Record<Address, string>,
//   );
//   return encodedSignatures;
// }

// // Function to generate a random message
// function generateRandomMessage(): string {
//   return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
// }

// async function signMultipleMessages(count: number) {
//   const signer = await generateKeyPairSigner();
//   const messages = Array.from({ length: count }, () => generateRandomMessage());

//   const startTime = performance.now();
//   for (let i = 0; i < messages.length; i++) {
//     const signatures = await signMessage(signer, messages[i]);
//     // console.log(`Message ${i + 1}:`, messages[i]);
//     // console.log(`Signatures ${i + 1}:`, signatures);
//   }
//   const endTime = performance.now();
//   const totalTime = endTime - startTime;

//   console.log(`Signing ${count} messages took ${totalTime.toFixed(2)} milliseconds`);
// }

// // Sign 1000 random messages
// await signMultipleMessages(50_000);
