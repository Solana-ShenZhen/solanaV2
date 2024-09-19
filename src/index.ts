import { shardedRpcClient, roundRobinRpcClient } from "./rpcClients";
import { RpcTester } from "./rpcTester";

async function testRpcMethods(clientType: "sharded" | "roundRobin") {
  const rpcClient = clientType === "sharded" ? shardedRpcClient.createClient() : roundRobinRpcClient.createClient();
  const tester = new RpcTester(rpcClient);
  await tester.testMethods();
}

async function main() {
  try {
    console.log("Testing Sharded RPC Client:");
    await testRpcMethods("sharded");

    console.log("\nTesting Round Robin RPC Client:");
    await testRpcMethods("roundRobin");
  } catch (error) {
    console.error("Main error:", error);
  }
}

main().catch(console.error);
