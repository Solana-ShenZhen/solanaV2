import { createShardedRpcClient } from "./rpcClient";

async function main() {
  const shardedRpc = createShardedRpcClient();

  try {
    // 调用不同的方法来测试分片
    const accountInfo = await shardedRpc.getAccountInfo(/* 账户公钥 */);
    console.log("Account Info:", accountInfo);

    const balance = await shardedRpc.getBalance(/* 账户公钥 */);
    console.log("Balance:", balance);

    const transaction = await shardedRpc.getTransaction(/* 交易签名 */);
    console.log("Transaction:", transaction);

    const recentBlockhash = await shardedRpc.getRecentBlockhash();
    console.log("Recent Blockhash:", recentBlockhash);

    // 注意：sendTransaction 需要一个已签名的交易
    // const txSignature = await shardedRpc.sendTransaction(/* 已签名的交易 */);
    // console.log("Transaction Signature:", txSignature);

    // 测试未映射的方法
    const slotLeader = await shardedRpc.getSlotLeader();
    console.log("Slot Leader:", slotLeader);
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);
