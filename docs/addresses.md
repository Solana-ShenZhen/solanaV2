# @solana/addresses

这个包包含用于生成账户地址的实用工具。它可以独立使用，但也作为 Solana JavaScript SDK [`@solana/web3.js@rc`](https://github.com/solana-labs/solana-web3.js/tree/master/packages/library) 的一部分导出。

## 类型

### `Address`

这个类型表示一个验证为 Solana 地址的字符串。需要格式正确的地址的函数应该使用这个类型来指定它们的输入。

当你需要将任意字符串验证为 base58 编码的地址时，请使用本包中的 `address()`、`assertIsAddress()` 或 `isAddress()` 函数。

### `ProgramDerivedAddress`

这个类型表示程序派生地址和用于确保派生地址不在 Ed25519 曲线上的 bump seed 的元组。

当你需要验证任意元组是否表示程序派生地址时，请使用本包中的 `assertIsProgramDerivedAddress()` 或 `isProgramDerivedAddress()` 函数。

### `ProgramDerivedAddressBump`

这个类型表示在派生程序派生地址时用作种子的 0-255 之间的整数。这个值的目的是修改派生过程，以确保派生的地址不在 Ed25519 曲线上。

## 函数

### `address()`

这个辅助函数结合了断言字符串是地址和将其强制转换为 `Address` 类型的功能。它最适合用于不受信任的输入。

```ts
import { address } from "@solana/addresses";

await transfer(address(fromAddress), address(toAddress), lamports(100000n));
```

当从已知正确的地址字符串开始时，使用类型转换比使用 `address()` 辅助函数更有效，因为辅助函数会无条件地对其输入进行验证。

```ts
import { Address } from "@solana/addresses";

const MEMO_PROGRAM_ADDRESS =
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr" as Address<"MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr">;
```

### `assertIsAddress()`

客户端应用程序主要以 base58 编码字符串的形式处理地址和公钥。从 RPC API 返回的地址符合 `Address` 类型。你可以在任何需要 base58 编码地址的地方使用该类型的值。

有时你可能会从不受信任的网络 API 或用户输入获取一个你期望验证为地址的字符串。要断言这样一个任意字符串是 base58 编码的地址，请使用 `assertIsAddress` 函数。

```ts
import { assertIsAddress } from "@solana/addresses";

// 想象一个在用户提交表单时获取账户余额的函数。
function handleSubmit() {
  // 我们只知道用户输入的内容符合 `string` 类型。
  const address: string = accountAddressInput.value;
  try {
    // 如果这个类型断言函数没有抛出异常，那么
    // TypeScript 将把 `address` 向上转型为 `Address`。
    assertIsAddress(address);
    // 此时，`address` 是一个可以用于 RPC 的 `Address`。
    const balanceInLamports = await rpc.getBalance(address).send();
  } catch (e) {
    // `address` 原来不是 base58 编码的地址
  }
}
```

### `assertIsProgramDerivedAddress()`

如果你从某个不受信任的源接收到地址/bump-seed 元组，你可以使用这个函数断言该元组符合 `ProgramDerivedAddress` 类型。

有关如何使用断言函数的示例，请参见 [`assertIsAddress()`](#assertisaddress)。

### `createAddressWithSeed()`

返回一个从某个基础地址、某个程序地址和一个种子字符串或字节数组派生的 base58 编码地址。

```ts
import { createAddressWithSeed } from "@solana/addresses";

const derivedAddress = await createAddressWithSeed({
  // 与此地址关联的私钥将能够为 `derivedAddress` 签名。
  baseAddress: "B9Lf9z5BfNPT4d5KMeaBFx8x1G4CULZYR1jA2kmxRDka" as Address,
  // 只有这个程序能够向这个账户写入数据。
  programAddress: "445erYq578p2aERrGW9mn9KiYe3fuG6uHdcJ2LPPShGw" as Address,
  seed: "data-account",
});
```

### `getAddressDecoder()`

返回一个解码器，你可以用它将表示地址的 32 字节数组转换为该地址的 base58 编码表示。返回 `Address` 和解码器停止读取的字节数组中的偏移量的元组。

```ts
import { getAddressDecoder } from "@solana/addresses";

const addressBytes = new Uint8Array([
  150, 183, 190, 48, 171, 8, 39, 156, 122, 213, 172, 108, 193, 95, 26, 158, 149,
  243, 115, 254, 20, 200, 36, 30, 248, 179, 178, 232, 220, 89, 53, 127,
]);
const addressDecoder = getAddressDecoder();
const address = addressDecoder.decode(address); // B9Lf9z5BfNPT4d5KMeaBFx8x1G4CULZYR1jA2kmxRDka
```

### `getAddressEncoder()`

返回一个编码器，你可以用它将 base58 编码的地址编码为字节数组。

```ts
import { getAddressEncoder } from "@solana/addresses";

const address = "B9Lf9z5BfNPT4d5KMeaBFx8x1G4CULZYR1jA2kmxRDka" as Address;
const addressEncoder = getAddressEncoder();
const addressBytes = addressEncoder.encode(address);
// Uint8Array(32) [
//   150, 183, 190,  48, 171,   8, 39, 156,
//   122, 213, 172, 108, 193,  95, 26, 158,
//   149, 243, 115, 254,  20, 200, 36,  30,
//   248, 179, 178, 232, 220,  89, 53, 127
// ]
```

### `getAddressFromPublicKey()`

给定一个公共 `CryptoKey`，此方法将返回其关联的 `Address`。

```ts
import { getAddressFromPublicKey } from "@solana/addresses";

const address = await getAddressFromPublicKey(publicKey);
```

### `getProgramDerivedAddress()`

给定一个程序的 `Address` 和最多 16 个 `Seeds`，此方法将返回与每个相关联的程序派生地址（PDA）。

```ts
import { getAddressEncoder, getProgramDerivedAddress } from "@solana/addresses";

const addressEncoder = getAddressEncoder();
const { bumpSeed, pda } = await getProgramDerivedAddress({
  programAddress: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" as Address,
  seeds: [
    // 所有者
    addressEncoder.encode(
      "9fYLFVoVqwH37C3dyPi6cpeobfbQ2jtLpN5HgAYDDdkm" as Address,
    ),
    // Token 程序
    addressEncoder.encode(
      "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address,
    ),
    // Mint
    addressEncoder.encode(
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address,
    ),
  ],
});
```

### `isAddress()`

这是一个类型守卫，接受一个字符串作为输入。如果字符串符合 `Address` 类型，它将返回 `true`，并将细化类型以供你的程序使用。

```ts
import { isAddress } from "@solana/addresses";

if (isAddress(ownerAddress)) {
  // 此时，`ownerAddress` 已被细化为可用于 RPC 的 `Address`。
  const { value: lamports } = await rpc.getBalance(ownerAddress).send();
  setBalanceLamports(lamports);
} else {
  setError(`${ownerAddress} 不是一个地址`);
}
```

### `isProgramDerivedAddress()`

这是一个类型守卫，接受一个元组作为输入。如果元组符合 `ProgramDerivedAddress` 类型，它将返回 `true`，并将细化类型以供你的程序使用。

有关如何使用类型守卫的示例，请参见 [`isAddress()`](#isaddress)。
