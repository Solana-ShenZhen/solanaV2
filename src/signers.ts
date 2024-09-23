import { getTransferSolInstruction } from "@solana-program/system";
import {
  address,
  appendTransactionMessageInstruction,
  BASE_ACCOUNT_SIZE,
  compileTransaction,
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
//   BASE_ACCOUNT_SIZE
// }

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
