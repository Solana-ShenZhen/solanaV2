# @solana/web3.js

这是用于构建 Node、web 和 React Native 的 Solana 应用程序的 JavaScript SDK。

## 函数

除了重新导出 `@solana/*` 命名空间中包的函数外，这个包还提供了额外的辅助工具，用于构建 Solana 应用程序，并带有合理的默认设置。

### `airdropFactory({rpc, rpcSubscriptions})`

返回一个函数，你可以调用它来向 Solana 地址空投一定数量的 `Lamports`。

```ts
import {
  address,
  airdropFactory,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  devnet,
  lamports,
} from "@solana/web3.js";

const rpc = createSolanaRpc(devnet("http://127.0.0.1:8899"));
const rpcSubscriptions = createSolanaRpcSubscriptions(
  devnet("ws://127.0.0.1:8900"),
);

const airdrop = airdropFactory({ rpc, rpcSubscriptions });

await airdrop({
  commitment: "confirmed",
  recipientAddress: address("FnHyam9w4NZoWR6mKN1CuGBritdsEWZQa4Z4oawLZGxa"),
  lamports: lamports(10_000_000n),
});
```

> [!NOTE] 这只在测试集群上有效。

### `decodeTransactionMessage(compiledTransactionMessage, rpc, config)`

从 `CompiledTransactionMessage` 返回一个 `TransactionMessage`。如果编译后的消息中的任何账户需要地址查找表来找到它们的地址，这个函数将使用提供的 RPC 实例从网络获取地址查找表的内容。

### `fetchLookupTables(lookupTableAddresses, rpc, config)`

给定属于地址查找表的地址列表，返回一个映射，将查找表地址映射到它们包含的有序地址数组。

### `getComputeUnitEstimateForTransactionMessageFactory({rpc})`

为你的交易消息正确预算计算单元限制可以增加你的交易被接受处理的概率。如果你没有在交易上声明计算单元限制，验证者将假设每条指令的上限为 200K 计算单元（CU）。

由于验证者有动机将尽可能多的交易打包到每个区块中，他们可能会选择包含他们知道会适合当前区块剩余计算预算的交易，而不是可能不适合的交易。因此，只要可能，你应该在每个交易消息上设置计算单元限制。

使用这个工具来估算给定交易消息的实际计算单元成本。

```ts
import { getSetComputeUnitLimitInstruction } from "@solana-program/compute-budget";
import {
  createSolanaRpc,
  getComputeUnitEstimateForTransactionMessageFactory,
  pipe,
} from "@solana/web3.js";

// 创建一个估算器函数。
const rpc = createSolanaRpc("http://127.0.0.1:8899");
const getComputeUnitEstimateForTransactionMessage =
  getComputeUnitEstimateForTransactionMessageFactory({
    rpc,
  });

// 创建你的交易消息。
const transactionMessage = pipe(
  createTransactionMessage({ version: "legacy" }),
  /* ... */
);

// 请求估算此消息将消耗的实际计算单元。
const computeUnitsEstimate =
  await getComputeUnitEstimateForTransactionMessage(transactionMessage);

// 设置交易消息的计算单元预算。
const transactionMessageWithComputeUnitLimit =
  prependTransactionMessageInstruction(
    getSetComputeUnitLimitInstruction({ units: computeUnitsEstimate }),
    transactionMessage,
  );
```

> [!WARNING]
> 计算单元估算只是一个估计。实际交易的计算单元消耗可能高于或低于模拟中观察到的值。除非你确信你的特定交易消息将消耗与估算相同或更少的计算单元，否则你可能想通过固定数量的 CU 或乘数来增加估算值。

> [!NOTE]
> 如果你正在准备一个将由钱包签名并提交到网络的_未签名_交易，你可能想让钱包来确定计算单元限制。考虑到钱包可能对某些类型的交易消耗多少计算单元有更全局的视图，并且可能能够更好地估算适当的计算单元预算。

### `sendAndConfirmDurableNonceTransactionFactory({rpc, rpcSubscriptions})`

返回一个函数，你可以调用它来发送基于 nonce 的交易到网络，并等待它被确认。

```ts
import {
  isSolanaError,
  sendAndConfirmDurableNonceTransactionFactory,
  SOLANA_ERROR__INVALID_NONCE,
  SOLANA_ERROR__NONCE_ACCOUNT_NOT_FOUND,
} from "@solana/web3.js";

const sendAndConfirmNonceTransaction =
  sendAndConfirmDurableNonceTransactionFactory({ rpc, rpcSubscriptions });

try {
  await sendAndConfirmNonceTransaction(transaction, {
    commitment: "confirmed",
  });
} catch (e) {
  if (isSolanaError(e, SOLANA_ERROR__NONCE_ACCOUNT_NOT_FOUND)) {
    console.error(
      "此交易指定的生命周期引用了一个不存在的 nonce 账户 " +
        `\`${e.context.nonceAccountAddress}\``
    );
  } else if (isSolanaError(e, SOLANA_ERROR__INVALID_NONCE)) {
    console.error(
      "此交易依赖于一个不再有效的 nonce"
    );
  } else {
    throw e;
  }
}
```

### `sendAndConfirmTransactionFactory({rpc, rpcSubscriptions})`

返回一个函数，你可以调用它来发送基于区块哈希的交易到网络，并等待它被确认。

```ts
import {
  isSolanaError,
  sendAndConfirmTransactionFactory,
  SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED,
} from "@solana/web3.js";

const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
  rpc,
  rpcSubscriptions,
});

try {
  await sendAndConfirmTransaction(transaction, { commitment: "confirmed" });
} catch (e) {
  if (isSolanaError(e, SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED)) {
    console.error("此交易依赖于一个已过期的区块哈希");
  } else {
    throw e;
  }
}
```

### `sendTransactionWithoutConfirmingFactory({rpc, rpcSubscriptions})`

返回一个函数，你可以调用它来发送任何类型生命周期的交易到网络，而无需等待它被确认。

```ts
import {
  sendTransactionWithoutConfirmingFactory,
  SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE,
} from "@solana/web3.js";

const sendTransaction = sendTransactionWithoutConfirmingFactory({ rpc });

try {
  await sendTransaction(transaction, { commitment: "confirmed" });
} catch (e) {
  if (
    isSolanaError(
      e,
      SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE,
    )
  ) {
    console.error("交易在模拟中失败", e.cause);
  } else {
    throw e;
  }
}
```
