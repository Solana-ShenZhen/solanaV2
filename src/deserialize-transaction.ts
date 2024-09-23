import {
  address,
  appendTransactionMessageInstructions,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  getSignatureFromTransaction,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransaction,
  signTransactionMessageWithSigners,
  type Address,
  type Rpc,
  type RpcFromTransport,
  type RpcTransport,
  type SolanaRpcApi,
  type TransactionSigner,
} from "@solana/web3.js";
import { loadKeypair } from "./utils";
import { getTransferSolInstruction, SYSTEM_PROGRAM_ADDRESS } from "@solana-program/system";
import { getAddMemoInstruction, MEMO_PROGRAM_ADDRESS } from "@solana-program/memo";
import {
  findAddressLookupTablePda,
  getCreateLookupTableInstruction,
  getExtendLookupTableInstruction,
} from "@solana-program/address-lookup-table";

const LOOKUP_TABLE_ADDRESS = "" as Address;
console.log(`lookup table address: ${LOOKUP_TABLE_ADDRESS}`);

const rpc_url = "https://devnet.helius-rpc.com/?api-key=f4c86c47-1d8b-4148-9dc6-d9aa6496f788";
const rpc = createSolanaRpc(rpc_url);
const rpcSubscriptions = createSolanaRpcSubscriptions(
  "ws://devnet.helius-rpc.com/?api-key=f4c86c47-1d8b-4148-9dc6-d9aa6496f788",
);

const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
  rpc,
  rpcSubscriptions,
});

const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
console.log(`[setup] Got a blockhash: ${latestBlockhash}`);

const SOURCE_ACCOUNT_SIGNER = await loadKeypair("./payer.json");

console.log(`source account address: ${SOURCE_ACCOUNT_SIGNER.address}`);

const DESTINATION_ACCOUNT_ADDRESS = address("2J2n1DPiF6qqHBaVU4qfgKd7yBwnMtaWJiW98qZqwaTm");

console.log(`destination account address: ${DESTINATION_ACCOUNT_ADDRESS}`);
// 1. 创建 lookup table
async function createLookupTableInstruction(rpc: Rpc<SolanaRpcApi>, authority: TransactionSigner) {
  const slot = await rpc.getSlot().send();
  const pdaAddressLookupTable = await findAddressLookupTablePda({ authority: authority.address, recentSlot: slot });
  console.log(`lookup table pda: ${pdaAddressLookupTable[0]}`);
  const instruction = getCreateLookupTableInstruction({
    address: pdaAddressLookupTable,
    authority: authority,
    recentSlot: slot,
  });
  return { instruction, lookupTable: pdaAddressLookupTable[0] };
}

// 2. 将地址添加到 lookup table
async function addAddressToLookupTableInstruction(
  lookupTable: Address,
  authority: TransactionSigner,
  addresses: Address[],
) {
  return getExtendLookupTableInstruction({
    address: lookupTable,
    authority,
    payer: authority,
    addresses,
  });
}

// 3. 创建交易
{
  const { instruction: createLookupTableIx, lookupTable } = await createLookupTableInstruction(
    rpc,
    SOURCE_ACCOUNT_SIGNER,
  );
  const addAddressToLookupTableIx = await addAddressToLookupTableInstruction(lookupTable, SOURCE_ACCOUNT_SIGNER, [
    SYSTEM_PROGRAM_ADDRESS,
    MEMO_PROGRAM_ADDRESS,
  ]);
  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    tx => setTransactionMessageFeePayer(SOURCE_ACCOUNT_SIGNER.address, tx),
    tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    tx => appendTransactionMessageInstructions([createLookupTableIx, addAddressToLookupTableIx], tx),
  );

  const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
  // const signedTransaction = await signTransaction([SOURCE_ACCOUNT_SIGNER], transactionMessage);

  try {
    await sendAndConfirmTransaction(signedTransaction, { commitment: "confirmed" });
    console.log(
      `Explorer link: https://explorer.solana.com/tx/${getSignatureFromTransaction(signedTransaction)}?cluster=devnet`,
    );
  } catch (e) {
    console.error(e);
  }
}

// const transactionMessage = pipe(
//   createTransactionMessage({ version: 0 }),
//   tx => setTransactionMessageFeePayer(SOURCE_ACCOUNT_SIGNER.address, tx),
//   tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
//   tx =>
//     appendTransactionMessageInstructions(
//       [
//         getTransferSolInstruction({
//           source: SOURCE_ACCOUNT_SIGNER,
//           destination: DESTINATION_ACCOUNT_ADDRESS,
//           amount: 10000n,
//         }),
//         getAddMemoInstruction({
//           memo: "Hello, world!",
//         }),
//       ],
//       tx,
//     ),
// );
