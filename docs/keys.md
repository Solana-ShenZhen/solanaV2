# @solana/keys

这个包包含了用于验证、生成和操作地址及密钥材料的实用工具。它可以独立使用,但也作为 Solana JavaScript SDK [`@solana/web3.js@rc`](https://github.com/solana-labs/solana-web3.js/tree/master/packages/library) 的一部分导出。

## 类型

### `Signature`

这个类型表示使用私钥对某些数据进行的 64 字节 Ed25519 签名,以 base58 编码的字符串形式呈现。

### `SignatureBytes`

这个类型表示使用私钥对某些数据进行的 64 字节 Ed25519 签名。

当你需要验证某个特定签名确实是使用与某个已知公钥相关联的私钥对某些已知字节进行签名所产生的签名时,请使用本包中的 `verifySignature()` 函数。

## 函数

### `assertIsSignature()`

有时你可能会从不受信任的网络 API 或用户输入中获取一个你期望是 base58 编码签名(例如交易的签名)的字符串。要断言这样一个任意字符串确实是 Ed25519 签名,请使用 `assertIsSignature` 函数。

```ts
import { assertIsSignature } from "@solana/keys";

// 假设有一个函数用于断言用户提供的签名是否有效。
function handleSubmit() {
  // 我们只知道用户输入的内容符合 `string` 类型。
  const signature: string = signatureInput.value;
  try {
    // 如果这个类型断言函数没有抛出异常,那么
    // TypeScript 将把 `signature` 向上转型为 `Signature`。
    assertIsSignature(signature);
    // 此时, `signature` 是一个可以用于 RPC 的 `Signature`。
    const {
      value: [status],
    } = await rpc.getSignatureStatuses([signature]).send();
  } catch (e) {
    // `signature` 原来不是一个 base58 编码的签名
  }
}
```

### `generateKeyPair()`

生成一个 Ed25519 公钥/私钥对,用于本包中接受 `CryptoKey` 对象的其他方法。

```ts
import { generateKeyPair } from "@solana/keys";

const { privateKey, publicKey } = await generateKeyPair();
```

### `createKeyPairFromBytes()`

给定一个 64 字节的 `Uint8Array` 密钥,创建一个 Ed25519 公钥/私钥对,用于本包中接受 `CryptoKey` 对象的其他方法。

```ts
import fs from "fs";
import { createKeyPairFromBytes } from "@solana/keys";

// 从本地密钥对文件获取字节。
const keypairFile = fs.readFileSync("~/.config/solana/id.json");
const keypairBytes = new Uint8Array(JSON.parse(keypairFile.toString()));

// 从字节创建一个 CryptoKeyPair。
const { privateKey, publicKey } = await createKeyPairFromBytes(keypairBytes);
```

### `createKeyPairFromPrivateKeyBytes()`

给定一个表示为 32 字节 `Uint8Array` 的私钥,创建一个 Ed25519 公钥/私钥对,用于本包中接受 `CryptoKey` 对象的其他方法。

```ts
import { createKeyPairFromPrivateKeyBytes } from '@solana/keys';

const { privateKey, publicKey } = await createKeyPairFromPrivateKeyBytes(new Uint8Array([...]));
```

当你有一个私钥但没有相应的公钥,或者需要从种子派生密钥对时,这可能很有用。例如,以下代码片段从消息的哈希中派生出一个密钥对。

```ts
import { getUtf8Encoder } from "@solana/codecs-strings";
import { createKeyPairFromPrivateKeyBytes } from "@solana/keys";

const message = getUtf8Encoder().encode("Hello, World!");
const seed = new Uint8Array(await crypto.subtle.digest("SHA-256", message));

const derivedKeypair = await createKeyPairFromPrivateKeyBytes(seed);
```

### `createPrivateKeyFromBytes()`

给定一个表示为 32 字节 `Uint8Array` 的私钥,创建一个 Ed25519 私钥,用于本包中接受 `CryptoKey` 对象的其他方法。\*\*\*\*

```ts
import { createPrivateKeyFromBytes } from '@solana/keys';

const privateKey = await createPrivateKeyFromBytes(new Uint8Array([...]));
const extractablePrivateKey = await createPrivateKeyFromBytes(new Uint8Array([...]), true);
```

### `getPublicKeyFromPrivateKey()`

给定一个可提取的 `CryptoKey` 私钥,获取相应的公钥作为 `CryptoKey`。

```ts
import { createPrivateKeyFromBytes, getPublicKeyFromPrivateKey } from '@solana/keys';

const privateKey = await createPrivateKeyFromBytes(new Uint8Array([...]), true);

const publicKey = await getPublicKeyFromPrivateKey(privateKey);
const extractablePublicKey = await getPublicKeyFromPrivateKey(privateKey, true);
```

### `isSignature()`

这是一个类型守卫,接受一个字符串作为输入。如果字符串符合 `Signature` 类型,它将返回 `true`,并为程序中的使用细化类型。

```ts
import { isSignature } from "@solana/keys";

if (isSignature(signature)) {
  // 此时, `signature` 已被细化为可用于 RPC 的 `Signature`。
  const {
    value: [status],
  } = await rpc.getSignatureStatuses([signature]).send();
  setSignatureStatus(status);
} else {
  setError(`${signature} 不是一个交易签名`);
}
```

### `signBytes()`

给定一个私有 `CryptoKey` 和一个 `Uint8Array` 字节,此方法将返回该数据的 64 字节 Ed25519 签名,作为 `Uint8Array`。

```ts
import { signBytes } from "@solana/keys";

const data = new Uint8Array([1, 2, 3]);
const signature = await signBytes(privateKey, data);
```

### `signature()`

这个辅助函数结合了 _断言_ 一个字符串是 Ed25519 签名和将其 _强制转换_ 为 `Signature` 类型。它最适合用于不受信任的输入。

```ts
import { signature } from "@solana/keys";

const signature = signature(userSuppliedSignature);
const {
  value: [status],
} = await rpc.getSignatureStatuses([signature]).send();
```

### `verifySignature()`

给定一个公共 `CryptoKey`、一些 `SignatureBytes` 和一个 `Uint8Array` 数据,如果签名是使用与公钥相关联的私钥对数据进行签名产生的,此方法将返回 `true`,否则返回 `false`。

```ts
import { verifySignature } from "@solana/keys";

const data = new Uint8Array([1, 2, 3]);
if (!(await verifySignature(publicKey, signature, data))) {
  throw new Error("该数据 *不是* 由与 `publicKey` 相关联的私钥签名的");
}
```
