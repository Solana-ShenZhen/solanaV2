# @solana/transaction-messages

该包包含用于创建交易消息的类型和函数。它可以独立使用，但也作为 Solana JavaScript SDK [`@solana/web3.js@rc`](https://github.com/solana-labs/solana-web3.js/tree/master/packages/library) 的一部分导出。

交易消息是使用此包提供的转换函数一步一步构建的。为了使连续应用转换到您的交易消息更加符合人体工程学，请考虑使用像 `@solana/functional` 中的管道辅助函数。

```ts
import { pipe } from "@solana/functional";
import {
  appendTransactionMessageInstruction,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from "@solana/transaction-messages";

const transferTransaction = pipe(
  createTransactionMessage({ version: 0 }),
  tx => setTransactionMessageFeePayer(myAddress, tx),
  tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  tx =>
    appendTransactionMessageInstruction(
      createTransferInstruction(myAddress, toAddress, amountInLamports),
      tx,
    ),
);
```

## 创建交易消息

### 类型

#### `TransactionVersion`

随着 Solana 交易获得更多功能，其版本将会升级。这个类型是所有可能的交易版本的联合。

### 函数

#### `createTransactionMessage()`

给定一个 `TransactionVersion`，此方法将返回一个具有该版本功能的空交易。

```ts
import { createTransactionMessage } from "@solana/transaction-messages";

const tx = createTransactionMessage({ version: 0 });
```

## 设置手续费支付者

### 类型

#### `ITransactionMessageWithFeePayer`

此类型表示已声明手续费支付者的交易消息。交易必须符合此类型才能被编译并在网络上落地。

### 函数

#### `setTransactionMessageFeePayer()`

给定一个系统账户的 base58 编码地址，此方法将返回一个新的交易消息，其类型与提供的类型相同，并额外包含 `ITransactionMessageWithFeePayer` 类型。

```ts
import { address } from "@solana/addresses";
import { setTransactionMessageFeePayer } from "@solana/transaction-messages";

const myAddress = address("mpngsFd4tmbUfzDYJayjKZwZcaR7aWb2793J6grLsGu");
const txPaidByMe = setTransactionMessageFeePayer(myAddress, tx);
```

## 定义交易消息的生命周期

只有在满足某些条件的情况下，已签名的交易才能在网络上落地：

- 它包含最近区块的哈希值
- 或者它包含网络已知的未使用的 nonce 值

这些条件定义了交易的生命周期，超过这个生命周期后，即使已签名，交易也无法再落地。在编译发送之前，必须将生命周期添加到交易消息中。

### 类型

#### `TransactionMessageWithBlockhashLifetime`

此类型表示一个交易消息，其生命周期由其包含的区块哈希的年龄定义。只有当网络的当前区块高度小于或等于 `TransactionMessageWithBlockhashLifetime['lifetimeConstraint']['lastValidBlockHeight']` 的值时，这样的交易才能在网络上落地。

#### `TransactionMessageWithDurableNonceLifetime`

此类型表示一个交易消息，其生命周期由其包含的 nonce 值定义。只有当该 nonce 为网络所知且尚未被用于落地其他交易时，这样的交易才能在网络上落地。

#### `Blockhash`

此类型表示一个字符串，特别已知是区块的 base58 编码值。

#### `Nonce`

此类型表示一个字符串，特别已知是 nonce 的 base58 编码值。

### 函数

#### `setTransactionMessageLifetimeUsingBlockhash()`

给定一个区块哈希和该区块哈希被认为可用于落地交易的最后区块高度，此方法将返回一个新的交易消息，其类型与提供的类型相同，并额外包含 `TransactionMessageWithBlockhashLifetime` 类型。

```ts
import { setTransactionMessageLifetimeUsingBlockhash } from "@solana/transaction-messages";

const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
const txWithBlockhashLifetime = setTransactionMessageLifetimeUsingBlockhash(
  latestBlockhash,
  tx,
);
```

#### `setTransactionMessageLifetimeUsingDurableNonce()`

给定一个 nonce 值、存储该 nonce 值的账户，以及被授权消耗该 nonce 的账户地址，此方法将返回一个新的交易，其类型与提供的类型相同，并额外包含 `TransactionMessageWithDurableNonceLifetime` 类型。特别地，此方法会在交易消息的开头*预置*一条指令，该指令旨在消耗（或"推进"）同一交易中定义其生命周期的 nonce。

```ts
import { setTransactionMessageLifetimeUsingDurableNonce } from "@solana/transactions";

const NONCE_VALUE_OFFSET =
  4 + // version(u32)
  4 + // state(u32)
  32; // nonce authority(pubkey)
// Then comes the nonce value.

const nonceAccountAddress = address(
  "EGtMh4yvXswwHhwVhyPxGrVV2TkLTgUqGodbATEPvojZ",
);
const nonceAuthorityAddress = address(
  "4KD1Rdrd89NG7XbzW3xsX9Aqnx2EExJvExiNme6g9iAT",
);
const { value: nonceAccount } = await rpc
  .getAccountInfo(nonceAccountAddress, {
    dataSlice: { length: 32, offset: NONCE_VALUE_OFFSET },
    encoding: "base58",
  })
  .send();
const nonce =
  // This works because we asked for the exact slice of data representing the nonce
  // value, and furthermore asked for it in `base58` encoding.
  nonceAccount!.data[0] as unknown as Nonce;

const durableNonceTransactionMessage =
  setTransactionMessageLifetimeUsingDurableNonce(
    { nonce, nonceAccountAddress, nonceAuthorityAddress },
    tx,
  );
```

#### `assertIsBlockhash()`

客户端应用程序主要处理以 base58 编码字符串形式的区块哈希。从 RPC API 返回的区块哈希符合 `Blockhash` 类型。您可以在任何需要区块哈希的地方使用该类型的值。

有时，您可能会从不受信任的网络 API 或用户输入中获取一个字符串，并期望将其验证为区块哈希。要断言这样一个任意字符串是 base58 编码的区块哈希，请使用 `assertIsBlockhash` 函数。

```ts
import { assertIsBlockhash } from "@solana/transaction-messages";

// Imagine a function that asserts whether a user-supplied blockhash is valid or not.
function handleSubmit() {
  // We know only that what the user typed conforms to the `string` type.
  const blockhash: string = blockhashInput.value;
  try {
    // If this type assertion function doesn't throw, then
    // Typescript will upcast `blockhash` to `Blockhash`.
    assertIsBlockhash(blockhash);
    // At this point, `blockhash` is a `Blockhash` that can be used with the RPC.
    const blockhashIsValid = await rpc.isBlockhashValid(blockhash).send();
  } catch (e) {
    // `blockhash` turned out not to be a base58-encoded blockhash
  }
}
```

#### `assertIsDurableNonceTransactionMessage()`

有时，您可能会从不受信任的网络 API 或用户输入中获取一个您期望是持久性 nonce 交易的交易消息。要断言这样一个任意交易确实是持久性 nonce 交易，请使用 `assertIsDurableNonceTransactionMessage` 函数。

有关如何使用断言函数的示例，请参见 [`assertIsBlockhash()`](#assertisblockhash)。

## 向交易消息添加指令

### 类型

#### `IInstruction`

此类型表示要发送给程序的指令。符合此类型的对象具有一个 `programAddress` 属性，该属性是程序的 base58 编码地址。

#### `IInstructionWithAccounts`

此类型表示一个指令，它指定了一个程序可能读取、写入或要求作为交易本身签名者的账户列表。符合此类型的对象具有一个 `accounts` 属性，该属性是一个 `IAccountMeta | IAccountLookupMeta` 数组，按照指令要求的顺序排列。

#### `IInstructionWithData`

此类型表示一个指令，它为程序提供一些输入数据。符合此类型的对象具有一个 `data` 属性，可以是任何类型的 `Uint8Array`。

### 函数

#### `appendTransactionMessageInstruction()`

给定一个指令，此方法将返回一个新的交易消息，该指令已被添加到现有指令列表的末尾。

```ts
import { address } from "@solana/addresses";
import { appendTransactionMessageInstruction } from "@solana/transaction-messages";

const memoTransaction = appendTransactionMessageInstruction(
  {
    data: new TextEncoder().encode("Hello world!"),
    programAddress: address("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
  },
  tx,
);
```

如果您想一次性向交易消息添加多个指令，您可以使用 `appendTransactionInstructions` 函数，该函数接受一个指令数组。

#### `prependTransactionMessageInstruction()`

给定一个指令，此方法将返回一个新的交易消息，该指令已被添加到现有指令列表的开头。

如果您想一次性在交易消息的开头添加多个指令，您可以使用 `prependTransactionMessageInstructions` 函数，该函数接受一个指令数组。

有关如何使用此函数的示例，请参见 [`appendTransactionMessageInstruction()`](#appendtransactioninstruction)。
