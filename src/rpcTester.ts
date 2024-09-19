import { address, signature } from "@solana/web3.js";
import { ShardedRpcClient } from "./rpcClients";

export class RpcTester {
  private add = address("dv3qDFk1DTF36Z62bNvrCXe9sKATA6xvVy6A798xxAS");
  private sig = signature("ng6KaftZuwc75va7hGoSmtSxyG5oSnppzbVPV98di4zo6HbjPrLoRzrDoX9LGGwfxkBTQqh3kLmMTFx7e7g9Kpj");

  constructor(private rpcClient: ReturnType<typeof ShardedRpcClient.prototype.createClient>) {}

  private methods = [
    { name: "Account Info", fn: () => this.rpcClient.getAccountInfo(this.add).send() },
    { name: "Balance", fn: () => this.rpcClient.getBalance(this.add).send() },
    { name: "Transaction", fn: () => this.rpcClient.getTransaction(this.sig).send() },
    { name: "Recent Blockhash", fn: () => this.rpcClient.getLatestBlockhash().send() },
    { name: "Slot Leader", fn: () => this.rpcClient.getSlotLeader().send() },
  ];

  async testMethods() {
    for (const method of this.methods) {
      try {
        const result = await method.fn();
        console.log(`${method.name}:`, result);
      } catch (error) {
        console.error(`Error in ${method.name}:`, error);
      }
    }
  }
}
