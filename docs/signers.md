# @solana/signers

# @solana/signers

这个包为 Solana 中的消息和交易签名提供了一个抽象层。它可以独立使用，但也作为 Solana JavaScript SDK [`@solana/web3.js@rc`](https://github.com/solana-labs/solana-web3.js/tree/master/packages/library) 的一部分导出。

你可以将签名者视为签署消息和交易的抽象方式。这可以使用加密密钥对、浏览器中的钱包适配器、用于测试目的的空操作签名者，或者你想要的任何东西。以下是使用 `CryptoKeyPair` 签名者的示例：

```ts
import { pipe } from "@solana/functional";
import { generateKeyPairSigner } from "@solana/signers";
import { createTransactionMessage } from "@solana/transaction-messages";
import { compileTransaction } from "@solana/transactions";

// Generate a key pair signer.
const mySigner = await generateKeyPairSigner();
mySigner.address; // Address;

// Sign one or multiple messages.
const myMessage = createSignableMessage("Hello world!");
const [messageSignatures] = await mySigner.signMessages([myMessage]);

// Sign one or multiple transaction messages.
const myTransactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  // Add instructions, fee payer, lifetime, etc.
);
const myTransaction = compileTransaction(myTransactionMessage);
const [transactionSignatures] = await mySigner.signTransactions([
  myTransaction,
]);
```

正如你所看到的，这提供了一个一致的 API，无论背后的签名方式如何。如果明天我们需要使用浏览器钱包，我们只需要将 `generateKeyPairSigner` 函数替换为我们选择的签名者工厂即可。

这个包提供了五种不同类型的签名者，可以在适用时组合使用。其中三种允许我们签署交易，而另外两种用于常规消息签名。

它们被分为三类：

- **部分签名者**：给定一个消息或交易，为其提供一个或多个签名。这些签名者无法修改给定的数据，这使我们能够并行运行多个签名者。
- **修改签名者**：可以选择在使用零个或多个私钥签名之前修改消息或交易。由于修改消息或交易会使任何预先存在的签名失效，修改签名者必须在任何其他签名者之前完成工作。
- **发送签名者**：给定一个交易，签名并立即将其发送到区块链。在适用的情况下，签名者也可以决定在签名之前修改提供的交易。这个接口适应了那些无法在不同时发送交易的情况下签署交易的钱包。这类签名者不适用于常规消息。

因此，我们最终得到以下接口。

|                     | 部分签名者                 | 修改签名者                   | 发送签名者                 |
| ------------------- | -------------------------- | ---------------------------- | -------------------------- |
| `TransactionSigner` | `TransactionPartialSigner` | `TransactionModifyingSigner` | `TransactionSendingSigner` |
| `MessageSigner`     | `MessagePartialSigner`     | `MessageModifyingSigner`     | 不适用                     |

我们将在下面的文档中详细介绍这五个签名者接口及其各自的特征。

这个包还提供了以下具体的签名者实现：

- `KeyPairSigner`：使用 `CryptoKeyPair` 来签署消息和交易。
- Noop 签名者：不签署任何内容，主要用于测试目的或表示一个账户将在不同环境中签名（例如，将交易发送到你的服务器以便它可以签名）。

此外，这个包允许将交易签名者存储在指令的账户元数据中。这使我们能够在适用时通过传递签名者而不是地址来创建指令，从而允许我们自动签署整个交易，而无需扫描其指令来查找所需的签名者。

在接下来的部分中，我们将更详细地介绍所有提供的签名者，然后深入探讨如何将签名者存储在指令账户元数据中以及如何从中受益。

## 签署消息

### 类型

#### `SignableMessage`

定义一个消息，包含可能已由其他签名者提供的任何签名。这个接口允许修改签名者根据该消息是否已存在签名来决定是否应该修改提供的消息。它还通过提供一个类似于交易的结构来帮助创建更一致的 API，该结构也会跟踪其签名字典。

```ts
type SignableMessage = {
  content: Uint8Array;
  signatures: SignatureDictionary; // Record<Address, SignatureBytes>
};
```

#### `MessagePartialSigner<TAddress>`

一个接口，用于签署一组 `SignableMessages`，而不修改它们的内容。它定义了一个 `signMessages` 函数，该函数为每个提供的消息返回一个 `SignatureDictionary`。这些签名字典预期会与现有的签名字典合并（如果有的话）。

```ts
const myMessagePartialSigner: MessagePartialSigner<"1234..5678"> = {
  address: address("1234..5678"),
  signMessages: async (
    messages: SignableMessage[],
  ): Promise<SignatureDictionary[]> => {
    // My custom signing logic.
  },
};
```

**特征**：

- **并行**。当多个签名者签署同一条消息时，我们可以并行执行此操作以获取所有签名。
- **灵活顺序**。对于给定的消息，我们使用这些签名者的顺序并不重要。

#### `MessageModifyingSigner<TAddress>`

一个接口，可能会在签署之前修改提供的 `SignableMessages` 的内容。例如，这使得钱包能够在它们签署的消息前面或后面添加随机数。对于每条消息，它的 `modifyAndSignMessages` 函数不是返回 `SignatureDirectory`，而是返回更新后的 `SignableMessage`，其中包含可能被修改的内容和签名字典。

```ts
const myMessageModifyingSigner: MessageModifyingSigner<"1234..5678"> = {
  address: address("1234..5678"),
  modifyAndSignMessages: async (
    messages: SignableMessage[],
  ): Promise<SignableMessage[]> => {
    // My custom signing logic.
  },
};
```

**特征**：

- **顺序执行**。与部分签名者相反，这些不能并行执行，因为每次调用都可能修改消息的内容。
- **首要签名者**。对于给定的消息，修改签名者必须始终在部分签名者之前使用，因为前者可能会修改消息，从而影响后者的结果。
- **潜在冲突**。如果提供了多个修改签名者，第二个签名者可能会使第一个签名者的签名无效。然而，修改签名者可能会根据该消息是否已存在签名来决定是否修改消息。

#### `MessageSigner<TAddress>`

联合接口，可以使用任何可用的消息签名者。

```ts
type MessageSigner<TAddress extends string = string> =
  | MessagePartialSigner<TAddress>
  | MessageModifyingSigner<TAddress>;
```

### 函数

#### `createSignableMessage(content, signatures?)`

从 `Uint8Array` 或 UTF-8 字符串创建一个 `SignableMessage`。如果消息已经包含签名，它可以选择接受一个签名字典。

```ts
const myMessage = createSignableMessage(new Uint8Array([1, 2, 3]));
const myMessageFromText = createSignableMessage("Hello world!");
const myMessageWithSignatures = createSignableMessage("Hello world!", {
  "1234..5678": new Uint8Array([1, 2, 3]),
});
```

#### 类型守卫

上述描述的每个消息接口都配有两个类型守卫，允许我们检查给定值是否为请求类型的消息签名者。一个返回布尔值，另一个在提供的值不符合预期接口时通过抛出错误来断言。

```ts
const myAddress = address("1234..5678");

isMessagePartialSigner({ address: myAddress, signMessages: async () => {} }); // ✅ true
isMessagePartialSigner({ address: myAddress }); // ❌ false
assertIsMessagePartialSigner({
  address: myAddress,
  signMessages: async () => {},
}); // ✅ void
assertIsMessagePartialSigner({ address: myAddress }); // ❌ Throws an error.

isMessageModifyingSigner({
  address: myAddress,
  modifyAndSignMessages: async () => {},
}); // ✅ true
isMessageModifyingSigner({ address: myAddress }); // ❌ false
assertIsMessageModifyingSigner({
  address: myAddress,
  modifyAndSignMessages: async () => {},
}); // ✅ void
assertIsMessageModifyingSigner({ address: myAddress }); // ❌ Throws an error.

isMessageSigner({ address: myAddress, signMessages: async () => {} }); // ✅ true
isMessageSigner({ address: myAddress, modifyAndSignMessages: async () => {} }); // ✅ true
assertIsMessageSigner({ address: myAddress, signMessages: async () => {} }); // ✅ void
assertIsMessageSigner({
  address: myAddress,
  modifyAndSignMessages: async () => {},
}); // ✅ void
```

## 签署交易

### 类型

#### `TransactionPartialSigner<TAddress>`

一个接口，用于签署一组 `Transactions`，而不修改它们的内容。它定义了一个 `signTransactions` 函数，该函数为每个提供的交易返回一个 `SignatureDictionary`。这些签名字典预期会与现有的签名（如果有的话）合并。

```ts
const myTransactionPartialSigner: TransactionPartialSigner<"1234..5678"> = {
  address: address("1234..5678"),
  signTransactions: async (
    transactions: Transaction[],
  ): Promise<SignatureDictionary[]> => {
    // My custom signing logic.
  },
};
```

**特征**：

- **并行**。它为每个提供的交易返回一个签名目录，而不修改它们，这使得多个部分签名者可以并行签署同一笔交易。
- **灵活顺序**。对于给定的交易，我们使用这些签名者的顺序并不重要。

#### `TransactionModifyingSigner<TAddress>`

一个可能在签署之前修改提供的 `Transactions` 的接口。例如，这使得钱包能够在签署交易之前向其注入额外的指令。对于每个交易，其 `modifyAndSignTransactions` 函数不是返回 `SignatureDirectory`，而是返回一个更新后的 `Transaction`，其中包含可能被修改的指令集和签名目录。

```ts
const myTransactionModifyingSigner: TransactionModifyingSigner<"1234..5678"> = {
  address: address("1234..5678"),
  modifyAndSignTransactions: async <T extends Transaction>(
    transactions: T[],
  ): Promise<T[]> => {
    // My custom signing logic.
  },
};
```

**特征**：

- **顺序执行**。与部分签名者不同，这些签名者不能并行执行，因为每次调用都可能修改提供的交易。
- **首先签名**。对于给定的交易，修改签名者必须始终在部分签名者之前使用，因为前者可能会修改交易，从而影响后者的结果。
- **潜在冲突**。如果提供了多个修改签名者，第二个签名者可能会使第一个签名者的签名无效。然而，修改签名者可以根据该交易是否已存在签名来决定是否修改交易。

#### `TransactionSendingSigner<TAddress>`

一个在签署一个或多个交易后立即将其发送到区块链的接口。它定义了一个 `signAndSendTransactions` 函数，该函数为每个提供的 `CompilableTransaction` 返回交易签名（即其标识符）。这个接口对于 PDA 钱包和其他不提供签署交易而不发送的接口的钱包类型是必需的。

注意，这类签名者也可能在签署和发送交易之前修改提供的交易。这使得在修改后的交易无法与应用程序共享，因此必须直接发送的用例成为可能。

```ts
const myTransactionSendingSigner: TransactionSendingSigner<"1234..5678"> = {
  address: address("1234..5678"),
  signAndSendTransactions: async (
    transactions: Transaction[],
  ): Promise<SignatureBytes[]> => {
    // My custom signing logic.
  },
};
```

**特征**：

- **单一签名者**。由于此签名者还负责发送提供的交易，因此对于给定的一组交易，我们只能使用一个 `TransactionSendingSigner`。
- **最后签名者**。显然，该签名者也必须是最后使用的签名者。
- **潜在冲突**。由于签名者可能决定在发送交易之前修改给定的交易，它们可能会使先前的签名无效。然而，签名者可以根据该交易是否已存在签名来决定是否修改交易。
- **潜在确认**。虽然这个接口并不要求，但值得注意的是，大多数钱包还会等待交易被确认（通常是 `confirmed` 确认级别）后才通知应用程序它们已完成。

#### `TransactionSigner<TAddress>`

联合接口，可以使用任何可用的交易签名者。

```ts
type TransactionSigner<TAddress extends string = string> =
  | TransactionPartialSigner<TAddress>
  | TransactionModifyingSigner<TAddress>
  | TransactionSendingSigner<TAddress>;
```

### 函数

#### 类型守卫

上述描述的每个交易接口都配有两个类型守卫，允许我们检查给定值是否为请求类型的交易签名者。一个返回布尔值，另一个通过在提供的值不符合预期接口时抛出错误来进行断言。

```ts
const myAddress = address("1234..5678");

isTransactionPartialSigner({
  address: myAddress,
  signTransactions: async () => {},
}); // ✅ true
isTransactionPartialSigner({ address: myAddress }); // ❌ false
assertIsTransactionPartialSigner({
  address: myAddress,
  signTransactions: async () => {},
}); // ✅ void
assertIsTransactionPartialSigner({ address: myAddress }); // ❌ Throws an error.

isTransactionModifyingSigner({
  address: myAddress,
  modifyAndSignTransactions: async () => {},
}); // ✅ true
isTransactionModifyingSigner({ address: myAddress }); // ❌ false
assertIsTransactionModifyingSigner({
  address: myAddress,
  modifyAndSignTransactions: async () => {},
}); // ✅ void
assertIsTransactionModifyingSigner({ address: myAddress }); // ❌ Throws an error.

isTransactionSendingSigner({
  address: myAddress,
  signAndSignTransaction: async () => {},
}); // ✅ true
isTransactionSendingSigner({ address: myAddress }); // ❌ false
assertIsTransactionSendingSigner({
  address: myAddress,
  signAndSignTransaction: async () => {},
}); // ✅ void
assertIsTransactionSendingSigner({ address: myAddress }); // ❌ Throws an error.

isTransactionSigner({ address: myAddress, signTransactions: async () => {} }); // ✅ true
isTransactionSigner({
  address: myAddress,
  modifyAndSignTransactions: async () => {},
}); // ✅ true
isTransactionSigner({
  address: myAddress,
  signAndSignTransaction: async () => {},
}); // ✅ true
assertIsTransactionSigner({
  address: myAddress,
  signTransactions: async () => {},
}); // ✅ void
assertIsTransactionSigner({
  address: myAddress,
  modifyAndSignTransactions: async () => {},
}); // ✅ void
assertIsTransactionSigner({
  address: myAddress,
  signAndSignTransaction: async () => {},
}); // ✅ void
```

## 创建和生成密钥对签名者

### 类型

#### `KeyPairSigner<TAddress>`

定义了一个使用 `CryptoKeyPair` 来签署消息和交易的签名者。它同时实现了 `MessagePartialSigner` 和 `TransactionPartialSigner` 接口，并跟踪用于签署消息和交易的 `CryptoKeyPair` 实例。

```ts
import { generateKeyPairSigner } from "@solana/signers";

const myKeyPairSigner = generateKeyPairSigner();
myKeyPairSigner.address; // Address;
myKeyPairSigner.keyPair; // CryptoKeyPair;
const [myMessageSignatures] = await myKeyPairSigner.signMessages([myMessage]);
const [myTransactionSignatures] = await myKeyPairSigner.signTransactions([
  myTransaction,
]);
```

### 函数

#### `createSignerFromKeyPair()`

从提供的 Crypto KeyPair 创建一个 `KeyPairSigner`。返回的签名者的 `signMessages` 和 `signTransactions` 函数将使用提供的密钥对的私钥来签署消息和交易。请注意，`signMessages` 和 `signTransactions` 的实现都是并行化的，这意味着它们将并行签署所有提供的消息和交易。

```ts
import { generateKeyPair } from "@solana/keys";
import { createSignerFromKeyPair, KeyPairSigner } from "@solana/signers";

const myKeyPair: CryptoKeyPair = await generateKeyPair();
const myKeyPairSigner: KeyPairSigner = await createSignerFromKeyPair(myKeyPair);
```

#### `generateKeyPairSigner()`

一个便利函数，用于生成新的 Crypto KeyPair 并立即从中创建一个 `KeyPairSigner`。

```ts
import { generateKeyPairSigner } from "@solana/signers";

const myKeyPairSigner = await generateKeyPairSigner();
```

#### `createKeyPairSignerFromBytes()`

一个便利函数，从 64 字节的 `Uint8Array` 密钥创建一个新的 KeyPair，并立即从中创建一个 `KeyPairSigner`。

```ts
import fs from "fs";
import { createKeyPairFromBytes } from "@solana/keys";

// Get bytes from local keypair file.
const keypairFile = fs.readFileSync("~/.config/solana/id.json");
const keypairBytes = new Uint8Array(JSON.parse(keypairFile.toString()));

// Create a KeyPairSigner from the bytes.
const { privateKey, publicKey } =
  await createKeyPairSignerFromBytes(keypairBytes);
```

#### `createKeyPairSignerFromPrivateKeyBytes()`

一个便利函数，从 32 字节的 `Uint8Array` 私钥创建一个新的 KeyPair，并立即从中创建一个 `KeyPairSigner`。

```ts
import { getUtf8Encoder } from "@solana/codecs-strings";
import { createKeyPairFromPrivateKeyBytes } from "@solana/keys";

const message = getUtf8Encoder().encode("Hello, World!");
const seed = new Uint8Array(await crypto.subtle.digest("SHA-256", message));

const derivedSigner = await createKeyPairSignerFromPrivateKeyBytes(seed);
```

#### `isKeyPairSigner()`

一个类型守卫，如果提供的值是 `KeyPairSigner`，则返回 `true`。

```ts
const myKeyPairSigner = await generateKeyPairSigner();
isKeyPairSigner(myKeyPairSigner); // ✅ true
isKeyPairSigner({ address: address("1234..5678") }); // ❌ false
```

#### `assertIsKeyPairSigner()`

一个类型守卫，如果提供的值不是 `KeyPairSigner`，则抛出错误。

```ts
const myKeyPairSigner = await generateKeyPairSigner();
assertIsKeyPairSigner(myKeyPairSigner); // ✅ void
assertIsKeyPairSigner({ address: address("1234..5678") }); // ❌ Throws an error.
```

## 创建 Noop 签名者

对于给定的地址，可以创建一个 Noop（无操作）签名者，以提供 `MessagePartialSigner` 和 `TransactionPartialSigner` 接口的实现，使其不签署任何内容。具体来说，使用 `NoopSigner` 签署交易或消息将返回一个空的 `SignatureDictionary`。

这种签名者可能在以下情况下有用：

- 用于测试目的。
- 用于表明给定账户是签名者，并自行承担为该账户提供签名的责任。例如，如果我们需要将交易发送到服务器，由服务器签名并为我们发送。

### Types

#### `NoopSigner<TAddress>`

定义一个 Noop（无操作）签名者。

```ts
const myNoopSigner: NoopSigner;
myNoopSigner satisfies MessagePartialSigner;
myNoopSigner satisfies TransactionPartialSigner;
```

### Functions

#### `createNoopSigner()`

从给定的地址创建一个 Noop（无操作）签名者。

```ts
import { createNoopSigner } from "@solana/signers";

const myNoopSigner = createNoopSigner(address("1234..5678"));
const [myMessageSignatures] = await myNoopSigner.signMessages([myMessage]); // <- Empty signature dictionary.
const [myTransactionSignatures] = await myNoopSigner.signTransactions([
  myTransaction,
]); // <- Empty signature dictionary.
```

## 在指令账户元数据中存储交易签名者

本包定义了账户元数据的替代定义，允许我们在其中存储 `TransactionSigners`。这意味着每个指令可以跟踪自己的签名者集合，进而交易也可以做到这一点。

它还提供了帮助函数，用于从指令和交易中去重和提取签名者，这使得可以自动签署整个交易，我们将在下一节中看到这一点。

### Types

#### `IAccountSignerMeta`

允许我们在其中存储 `TransactionSigners` 的替代 `IAccountMeta` 定义。

```ts
const mySignerMeta: IAccountSignerMeta = {
  address: myTransactionSigner.address,
  role: AccountRole.READONLY_SIGNER,
  signer: myTransactionSigner,
};
```

#### `IInstructionWithSigners`

可组合的类型，允许在指令的 `accounts` 数组中使用 `IAccountSignerMetas`。

```ts
const myInstructionWithSigners: IInstruction & IInstructionWithSigners = {
  programAddress: address("1234..5678"),
  accounts: [
    {
      address: myTransactionSigner.address,
      role: AccountRole.READONLY_SIGNER,
      signer: myTransactionSigner,
    },
  ],
};
```

#### `ITransactionMessageWithSigners`

可组合的类型，允许在交易消息的所有账户元数据中使用 `IAccountSignerMetas`。

```ts
const myTransactionMessageWithSigners: BaseTransactionMessage &
  ITransactionMessageWithSigners = {
  instructions: [
    myInstructionA as IInstruction & IInstructionWithSigners,
    myInstructionB as IInstruction & IInstructionWithSigners,
    myInstructionC as IInstruction,
  ],
  version: 0,
};
```

### 函数

#### `getSignersFromInstruction()`

从指令的账户元数据中提取并去重所有存储的签名者。

```ts
const mySignerA = {
  address: address("1111..1111"),
  signTransactions: async () => {},
};
const mySignerB = {
  address: address("2222..2222"),
  signTransactions: async () => {},
};
const myInstructionWithSigners: IInstructionWithSigners = {
  programAddress: address("1234..5678"),
  accounts: [
    {
      address: mySignerA.address,
      role: AccountRole.READONLY_SIGNER,
      signer: mySignerA,
    },
    {
      address: mySignerB.address,
      role: AccountRole.WRITABLE_SIGNER,
      signer: mySignerB,
    },
    {
      address: mySignerA.address,
      role: AccountRole.WRITABLE_SIGNER,
      signer: mySignerA,
    },
  ],
};

const instructionSigners = getSignersFromInstruction(myInstructionWithSigners);
// ^ [mySignerA, mySignerB]
```

#### `getSignersFromTransactionMessage()`

与 `getSignersFromInstruction` 类似，这个函数从交易消息中所有指令的账户元数据中提取并去重所有存储的签名者。

```ts
const transactionSigners = getSignersFromTransactionMessage(
  myTransactionMessageWithSigners,
);
```

#### `addSignersToInstruction()`

辅助函数，将提供的签名者添加到任何适用的账户元数据中。对于一个账户元数据要匹配提供的签名者，它必须：

- 具有签名者角色（`AccountRole.READONLY_SIGNER` 或 `AccountRole.WRITABLE_SIGNER`）。
- 具有与提供的签名者相同的地址。
- 尚未附加签名者。

```ts
const myInstruction: IInstruction = {
  accounts: [
    { address: "1111" as Address, role: AccountRole.READONLY_SIGNER },
    { address: "2222" as Address, role: AccountRole.WRITABLE_SIGNER },
  ],
  // ...
};

const mySignerA: TransactionSigner<"1111">;
const mySignerB: TransactionSigner<"2222">;
const myInstructionWithSigners = addSignersToInstruction(
  [mySignerA, mySignerB],
  myInstruction,
);

// myInstructionWithSigners.accounts[0].signer === mySignerA
// myInstructionWithSigners.accounts[1].signer === mySignerB
```

#### `addSignersToTransactionMessage()`

与 `addSignersToInstruction` 类似，这个函数将签名者添加到交易消息中所有指令的所有适用账户元数据中。

```ts
const myTransactionMessageWithSigners = addSignersToTransactionMessage(
  mySigners,
  myTransactionMessage,
);
```

## 使用签名者签署交易

正如我们在上一节中所看到的，我们可以从指令和交易消息中存储和提取 `TransactionSigners`。这使我们能够提供辅助方法，使用存储在其中的签名者来签署交易消息。

### 函数

#### `partiallySignTransactionMessageWithSigners()`

提取提供的交易消息中的所有签名者，并使用它们来签署交易。它首先按顺序使用所有 `TransactionModifyingSigners`，然后并行使用所有 `TransactionPartialSigners`。

如果一个复合签名者同时实现了这两个接口，当没有其他签名者实现该接口时，它将被用作修改签名者。否则，它将被用作部分签名者。

```ts
const mySignedTransaction =
  await partiallySignTransactionMessageWithSigners(myTransactionMessage);
```

它还接受一个可选的 `AbortSignal`，该信号将传播给所有签名者。

```ts
const mySignedTransaction = await partiallySignTransactionMessageWithSigners(
  myTransactionMessage,
  {
    abortSignal: myAbortController.signal,
  },
);
```

最后，请注意，此函数会忽略 `TransactionSendingSigners`，因为它不发送交易。有关如何使用发送签名者的更多详细信息，请参阅下面的 `signAndSendTransactionMessageWithSigners` 函数。

#### `signTransactionMessageWithSigners()`

此函数的工作方式与上面描述的 `partiallySignTransactionMessageWithSigners` 函数相同，只是它还确保交易在返回之前已完全签名。如果不是这种情况，将抛出错误。

```ts
const mySignedTransaction =
  await signTransactionMessageWithSigners(myTransactionMessage);

// With additional config.
const mySignedTransaction = await signTransactionMessageWithSigners(
  myTransactionMessage,
  {
    abortSignal: myAbortController.signal,
  },
);

// We now know the transaction is fully signed.
mySignedTransaction satisfies IFullySignedTransaction;
```

#### `signAndSendTransactionMessageWithSigners()`

提取提供的交易中的所有签名者，并使用它们签署交易，然后立即将其发送到区块链。它返回已发送交易的签名（即其标识符）。

```ts
const transactionSignature =
  await signAndSendTransactionMessageWithSigners(transactionMessage);

// With additional config.
const transactionSignature = await signAndSendTransactionMessageWithSigners(
  transactionMessage,
  {
    abortSignal: myAbortController.signal,
  },
);
```

与 `partiallySignTransactionMessageWithSigners` 函数类似，它首先按顺序使用所有 `TransactionModifyingSigners`，然后并行使用所有 `TransactionPartialSigners`。然后，它使用识别到的 `TransactionSendingSigner` 发送交易。

在这里，复合交易签名者的处理方式也是如此，即如果存在任何发送签名者，则至少使用一个。当一个 `TransactionSigner` 实现多个接口时，按以下顺序使用它：

- 如果不存在其他 `TransactionSendingSigner`，则作为 `TransactionSendingSigner` 使用。
- 如果不存在其他 `TransactionModifyingSigner`，则作为 `TransactionModifyingSigner` 使用。
- 否则，作为 `TransactionPartialSigner` 使用。

提供的交易必须在其账户元数据中包含恰好一个 `TransactionSendingSigner`。如果多个复合签名者实现了 `TransactionSendingSigner` 接口，其中一个将被选为发送签名者。否则，如果必须选择多个 `TransactionSendingSigners`，该函数将抛出错误。

如果你想在调用此函数之前断言交易使用了恰好一个 `TransactionSendingSigner`，你可以使用 `assertIsTransactionMessageWithSingleSendingSigner` 函数。

```ts
assertIsTransactionMessageWithSingleSendingSigner(transactionMessage);
const transactionSignature =
  await signAndSendTransactionMessageWithSigners(transactionMessage);
```

或者，你可以使用 `isTransactionWithSingleSendingSigner()` 函数来提供一个备选方案，以防交易不包含任何发送签名者。

```ts
let transactionSignature: SignatureBytes;
if (isTransactionWithSingleSendingSigner(transactionMessage)) {
  transactionSignature =
    await signAndSendTransactionMessageWithSigners(transactionMessage);
} else {
  const signedTransaction =
    await signTransactionMessageWithSigners(transactionMessage);
  const encodedTransaction = getBase64EncodedWireTransaction(signedTransaction);
  transactionSignature = await rpc.sendTransaction(encodedTransaction).send();
}
```
