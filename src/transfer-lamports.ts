import {
  address,
  appendTransactionMessageInstruction,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  getSignatureFromTransaction,
  isSolanaError,
  lamports,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE,
} from "@solana/web3.js";
import { loadKeypair } from "./utils";
import { getSystemErrorMessage, getTransferSolInstruction, isSystemError } from "@solana-program/system";

const SOURCE_ACCOUNT_SIGNER = await loadKeypair("./payer.json");

console.log(`source account address: ${SOURCE_ACCOUNT_SIGNER.address}`);

const DESTINATION_ACCOUNT_ADDRESS = address("2J2n1DPiF6qqHBaVU4qfgKd7yBwnMtaWJiW98qZqwaTm");

console.log(`destination account address: ${DESTINATION_ACCOUNT_ADDRESS}`);

const rpc = createSolanaRpc("https://devnet.helius-rpc.com/?api-key=f4c86c47-1d8b-4148-9dc6-d9aa6496f788");
const rpcSubscriptions = createSolanaRpcSubscriptions(
  "ws://devnet.helius-rpc.com/?api-key=f4c86c47-1d8b-4148-9dc6-d9aa6496f788",
);

const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
  rpc,
  rpcSubscriptions,
});

const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  tx => setTransactionMessageFeePayer(SOURCE_ACCOUNT_SIGNER.address, tx),
  tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  tx =>
    appendTransactionMessageInstruction(
      getTransferSolInstruction({
        source: SOURCE_ACCOUNT_SIGNER,
        destination: DESTINATION_ACCOUNT_ADDRESS,
        amount: lamports(1_000_000n),
      }),
      tx,
    ),
);

const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
console.log(`signature: ${getSignatureFromTransaction(signedTransaction)}`);

try {
  await sendAndConfirmTransaction(signedTransaction, { commitment: "confirmed" });
  console.log(
    `Explorer link: https://explorer.solana.com/tx/${getSignatureFromTransaction(signedTransaction)}?cluster=devnet`,
  );
} catch (e) {
  if (isSolanaError(e, SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE)) {
    const preflightErrorContext = e.context;
    const preflightErrorMessage = e.message;
    const errorDetailMessage = isSystemError(e.cause, transactionMessage)
      ? getSystemErrorMessage(e.cause.context.code)
      : e.cause?.message;
    console.error(preflightErrorContext, "%s: %s", preflightErrorMessage, errorDetailMessage);
  } else {
    throw e;
  }
}
