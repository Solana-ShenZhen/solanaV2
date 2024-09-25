# @solana/transactions

该包包含用于编译、签名和发送交易的类型和函数。它可以独立使用，但也作为 Solana JavaScript SDK [`@solana/web3.js@rc`](https://github.com/solana-labs/solana-web3.js/tree/master/packages/library) 的一部分导出。

交易是通过编译交易消息创建的。在提交到网络之前，它们必须先进行签名。

## 编译交易

### 函数

#### `compileTransaction()`

给定一个 `TransactionMessage`，此函数返回一个 `Transaction` 对象。这包括交易消息的编译字节，以及一个签名映射。这个映射将为每个需要签名交易的地址设置一个键。交易此时还没有这些地址的任何签名。

交易消息是否准备好被编译在类型级别上为您强制执行。为了可以签名，交易消息必须：

- 有一个版本和零个或多个指令列表（即符合 `BaseTransactionMessage`）
- 设置了手续费支付者（即符合 `ITransactionMessageWithFeePayer`）
- 指定了生命周期（即符合 `TransactionMessageWithBlockhashLifetime | TransactionMessageWithDurableNonceLifetime`）

## 签署交易

为了能够在网络上落地，交易必须由所有属于交易所需签名者账户的私钥进行签名。

### 类型

#### `FullySignedTransaction`

此类型表示已由其所有必需签名者签署的交易。完全签署是设计用于在网络上落地交易的函数的先决条件。

### 函数

#### `getSignatureFromTransaction()`

给定一个由其手续费支付者签署的交易，此方法将返回唯一标识该交易的 `Signature`。这个字符串可以用于在以后查找交易，例如在 Solana 区块浏览器上。

```ts
import { getSignatureFromTransaction } from "@solana/transactions";

const signature = getSignatureFromTransaction(tx);
console.debug(
  `Inspect this transaction at https://explorer.solana.com/tx/${signature}`,
);
```

### `signTransaction()`

给定一个 `CryptoKey` 对象数组，这些对象是与需要签署交易的地址相关的私钥，此方法将返回一个新的已签名交易，类型为 `FullySignedTransaction`。在被输入的 `CryptoKey` 对象签名后，交易必须拥有所有必需签名者的签名。

```ts
import { generateKeyPair } from "@solana/keys";
import { signTransaction } from "@solana/transactions";

const signedTransaction = await signTransaction([myPrivateKey], tx);
```

### `partiallySignTransaction()`

此函数与 `signTransaction()` 相同，但不要求交易由所有签名者签署。部分签名的交易无法在网络上落地，但可以被序列化和反序列化。

## 序列化交易

在将交易发送到网络上落地之前，您必须以特定方式对其进行序列化。您可以使用这些类型和函数将已签名的交易序列化为适合通过网络传输的二进制格式。

### 类型

#### `Base64EncodedWireTransaction`

此类型表示交易的线格式（wire format）作为一个 base64 编码的字符串。

### 函数

#### `getBase64EncodedWireTransaction()`

给定一个已签名的交易，此方法返回符合 `Base64EncodedWireTransaction` 类型的交易字符串。

```ts
import {
  getBase64EncodedWireTransaction,
  signTransaction,
} from "@solana/transactions";

const serializedTransaction =
  getBase64EncodedWireTransaction(signedTransaction);
const signature = await rpc
  .sendTransaction(serializedTransaction, { encoding: "base64" })
  .send();
```
