import { address, signature, type Address, type Signature } from "@solana/web3.js";
import { ShardedRpcClient } from "./ShardedRpcClient";
import { RoundRobinRpcClient } from "./RoundRobinRpcClient";

// Define a more generic interface that matches the actual RPC client method signatures
interface RpcClientInterface {
  getAccountInfo: (address: Address, config?: any) => Promise<any>;
  getBalance: (address: Address, config?: any) => Promise<any>;
  getTransaction: (signature: Signature, config?: any) => Promise<any>;
  getLatestBlockhash: (config?: any) => Promise<any>;
  getSlotLeader: (config?: any) => Promise<any>;
}

class RpcTester {
  private static readonly ADD = address("dv3qDFk1DTF36Z62bNvrCXe9sKATA6xvVy6A798xxAS");
  private static readonly SIG = signature(
    "ng6KaftZuwc75va7hGoSmtSxyG5oSnppzbVPV98di4zo6HbjPrLoRzrDoX9LGGwfxkBTQqh3kLmMTFx7e7g9Kpj",
  );

  private readonly methods: Array<{ name: string; fn: () => Promise<any> }>;

  constructor(private rpcClient: RpcClientInterface) {
    this.methods = [
      { name: "Account Info", fn: () => this.rpcClient.getAccountInfo(RpcTester.ADD) },
      { name: "Balance", fn: () => this.rpcClient.getBalance(RpcTester.ADD) },
      { name: "Transaction", fn: () => this.rpcClient.getTransaction(RpcTester.SIG) },
      { name: "Recent Blockhash", fn: () => this.rpcClient.getLatestBlockhash() },
      { name: "Slot Leader", fn: () => this.rpcClient.getSlotLeader() },
    ];
  }

  async testMethods() {
    for (const { name, fn } of this.methods) {
      try {
        const result = await fn();
        console.log(`${name}:`, result);
      } catch (error) {
        console.error(`Error in ${name}:`, error);
      }
    }
  }
}

function createRpcClient(clientType: "sharded" | "roundRobin"): RpcClientInterface {
  const ClientClass = clientType === "sharded" ? ShardedRpcClient : RoundRobinRpcClient;
  const client = new ClientClass().createClient();

  return {
    getAccountInfo: (address, config) => client.getAccountInfo(address, config).send(),
    getBalance: (address, config) => client.getBalance(address, config).send(),
    getTransaction: (signature, config) => client.getTransaction(signature, config).send(),
    getLatestBlockhash: config => client.getLatestBlockhash(config).send(),
    getSlotLeader: config => client.getSlotLeader(config).send(),
  };
}

export async function testRpcMethods(clientType: "sharded" | "roundRobin") {
  const rpcClient = createRpcClient(clientType);
  const tester = new RpcTester(rpcClient);
  console.log(`Testing ${clientType} RPC Client:`);
  await tester.testMethods();
}
