import {
  appendTransactionMessageInstruction,
  createSolanaRpc,
  createTransactionMessage,
  generateKeyPair,
  generateKeyPairSigner,
  getSignatureFromTransaction,
  lamports,
  pipe,
  sendAndConfirmTransactionFactory,
  sendTransactionWithoutConfirmingFactory,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/web3.js";
import { testRpcMethods } from "./rpcClients/rpcTester";
import { loadKeypair } from "./utils";
import { getTransferSolInstruction } from "@solana-program/system";

async function main() {
  try {
    const rpcURL = "https://devnet.helius-rpc.com/?api-key=f4c86c47-1d8b-4148-9dc6-d9aa6496f788";
    const rpc = createSolanaRpc(rpcURL);

    const keyPair = await generateKeyPairSigner();
    console.log("Generated public key:", keyPair.address);

    const owner = await loadKeypair("~/.config/solana/id.json");
    console.log("Owner public key:", owner.address);

    const payer = await loadKeypair("./payer.json");
    console.log("Loaded public key:", payer.address);

    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      tx => setTransactionMessageFeePayer(payer.address, tx),
      tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      tx =>
        appendTransactionMessageInstruction(
          getTransferSolInstruction({
            amount: lamports(BigInt(0.5 * Math.pow(10, 9))),
            source: payer,
            destination: owner.address,
          }),
          tx,
        ),
    );

    const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
    const sendTransaction = sendTransactionWithoutConfirmingFactory({ rpc });

    await sendTransaction(signedTransaction, { commitment: "confirmed", skipPreflight: true });
    const signature = getSignatureFromTransaction(signedTransaction);
    console.log("Explorer link:", `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  } catch (error) {
    console.error("Main error:", error);
  }
}

main().catch(console.error);
