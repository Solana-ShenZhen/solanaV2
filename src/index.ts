import { createSolanaRpc, generateKeyPair, generateKeyPairSigner, lamports } from "@solana/web3.js";
import { testRpcMethods } from "./rpcClients/rpcTester";
import { loadKeypair } from "./utils";

async function main() {
  try {
    const rpcURL = "https://devnet.helius-rpc.com/?api-key=f4c86c47-1d8b-4148-9dc6-d9aa6496f788";
    const rpc = createSolanaRpc(rpcURL);

    const keyPair = await generateKeyPairSigner();
    console.log("Generated public key:", keyPair.address);

    const payer = await loadKeypair("./payer.json");
    console.log("Loaded public key:", payer.address);

    const tx1 = await rpc
      .requestAirdrop(payer.address, lamports(BigInt(Math.pow(10, 9))), { commitment: "confirmed" })
      .send();
    console.log(`tx1: ${tx1}`);
  } catch (error) {
    console.error("Main error:", error);
  }
}

main().catch(console.error);
