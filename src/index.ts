import { testRpcMethods } from "./rpcClients/rpcTester";

async function main() {
  try {
    await testRpcMethods("sharded");
    console.log("\n");
    await testRpcMethods("roundRobin");
  } catch (error) {
    console.error("Main error:", error);
  }
}

main().catch(console.error);
