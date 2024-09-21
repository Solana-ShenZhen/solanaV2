# @solana/accounts

这个包包含了用于表示、获取和解码 Solana 账户的类型和辅助方法。它可以独立使用，但也作为 Solana JavaScript SDK [`@solana/web3.js@rc`](https://github.com/solana-labs/solana-web3.js/tree/master/packages/library) 的一部分导出。

它提供了一个统一的 Solana 账户定义，无论账户是如何获取的，都可以表示编码和解码后的账户。它还引入了 `MaybeAccount` 的概念，表示一个可能存在或不存在于链上的已获取账户，同时在两种情况下都保持对其地址的跟踪。

该包提供了用于获取、解析和解码账户的辅助函数，以及断言账户存在的功能。

```ts
// Fetch.
const myAddress = address("1234..5678");
const myAccount = fetchAccount(rpc, myAddress);
myAccount satisfies MaybeEncodedAccount<"1234..5678">;

// Assert.
assertAccountExists(myAccount);
myAccount satisfies EncodedAccount<"1234..5678">;

// Decode.
type MyAccountData = { name: string; age: number };
const myDecoder: Decoder<MyAccountData> = getStructDecoder([
  ["name", addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
  ["age", getU32Decoder()],
]);
const myDecodedAccount = decodeAccount(myAccount, myDecoder);
myDecodedAccount satisfies Account<MyAccountData, "1234..5678">;
```

## 类型

### `BaseAccount`

`BaseAccount` 类型定义了所有 Solana 账户共有的属性。具体来说，它包含了存储在链上的所有内容，除了账户数据本身。

```ts
const BaseAccount: BaseAccount = {
  executable: false,
  lamports: lamports(1_000_000_000n),
  programAddress: address("1111..1111"),
};
```

该包还导出了一个 `BASE_ACCOUNT_SIZE` 常量，表示 `BaseAccount` 属性在字节中的大小。

```ts
const myTotalAccountSize = myAccountDataSize + BASE_ACCOUNT_SIZE;
```

### `Account` 和 `EncodedAccount`

`Account` 类型包含了与 Solana 账户相关的所有信息。它包含了上面描述的 `BaseAccount`，以及账户数据和账户地址。

账户数据可以表示为 `Uint8Array`（意味着账户是编码的），或者自定义数据类型（意味着账户是解码的）。

```ts
// Encoded.
const myEncodedAccount: Account<Uint8Array, "1234..5678"> = {
  address: address("1234..5678"),
  data: new Uint8Array([1, 2, 3]),
  executable: false,
  lamports: lamports(1_000_000_000n),
  programAddress: address("1111..1111"),
};

// Decoded.
type MyAccountData = { name: string; age: number };
const myDecodedAccount: Account<MyAccountData, "1234..5678"> = {
  address: address("1234..5678"),
  data: { name: "Alice", age: 30 },
  executable: false,
  lamports: lamports(1_000_000_000n),
  programAddress: address("1111..1111"),
};
```

`EncodedAccount` 类型也可以用来表示一个编码的账户，它等同于一个具有 `Uint8Array` 账户数据的 `Account`。

```ts
myEncodedAccount satisfies EncodedAccount<"1234..5678">;
```

### `MaybeAccount` 和 `MaybeEncodedAccount`

`MaybeAccount` 类型是一个联合类型，表示一个可能存在或不存在于链上的账户。当账户存在时，它被表示为一个 `Account` 类型，并附加一个 `exists` 属性设置为 `true`。当账户不存在时，它被表示为一个只包含账户地址和 `exists` 属性设置为 `false` 的对象。

```ts
// Account exists.
const myExistingAccount: MaybeAccount<MyAccountData, "1234..5678"> = {
  exists: true,
  address: address("1234..5678"),
  data: { name: "Alice", age: 30 },
  executable: false,
  lamports: lamports(1_000_000_000n),
  programAddress: address("1111..1111"),
};

// Account does not exist.
const myMissingAccount: MaybeAccount<MyAccountData, "8765..4321"> = {
  exists: false,
  address: address("8765..4321"),
};
```

与 `Account` 类型类似，`MaybeAccount` 类型也可以用来表示一个编码的账户，方法是使用 `Uint8Array` 数据类型或使用 `MaybeEncodedAccount` 辅助类型。

```ts
// Encoded account exists.
const myExistingAccount: MaybeEncodedAccount<"1234..5678"> = {
  exists: true,
  address: address("1234..5678"),
  data: new Uint8Array([1, 2, 3]),
  // ...
};

// Encoded account does not exist.
const myMissingAccount: MaybeEncodedAccount<"8765..4321"> = {
  exists: false,
  address: address("8765..4321"),
};
```

## 函数

### `assertAccountExists()`

给定一个 `MaybeAccount`，此函数断言该账户存在，并允许它在之后被用作 `Account` 类型。

```ts
const myAccount: MaybeEncodedAccount<"1234..5678">;
assertAccountExists(myAccount);

// Now we can use myAccount as an Account.
myAccount satisfies EncodedAccount<"1234..5678">;
```

### `assertAccountsExist()`

给定一个 `MaybeAccount` 数组，此函数断言所有账户都存在，并允许它们在之后被用作 `Account` 数组。

```ts
const myAccounts: MaybeEncodedAccount<Address>[];
assertAccountsExist(myAccounts);

// Now we can use them as an array of accounts
for (const a of myAccounts) {
  a satisfies EncodedAccount<Address>;
}
```

### `parseBase64RpcAccount()`

此函数将 RPC 客户端提供的 base64 编码账户解析为 `EncodedAccount` 类型，或者如果原始数据可以设置为 `null`，则解析为 `MaybeEncodedAccount` 类型。

```ts
const myAddress = address("1234..5678");
const myRpcAccount = await rpc
  .getAccountInfo(myAddress, { encoding: "base64" })
  .send();
const myAccount: MaybeEncodedAccount<"1234..5678"> =
  parseBase64RpcAccount(myRpcAccount);
```

### `parseBase58RpcAccount()`

此函数将 RPC 客户端提供的 base58 编码账户解析为 `EncodedAccount` 类型，或者如果原始数据可以设置为 `null`，则解析为 `MaybeEncodedAccount` 类型。

```ts
const myAddress = address("1234..5678");
const myRpcAccount = await rpc
  .getAccountInfo(myAddress, { encoding: "base58" })
  .send();
const myAccount: MaybeEncodedAccount<"1234..5678"> =
  parseBase58RpcAccount(myRpcAccount);
```

### `parseJsonRpcAccount()`

此函数将 RPC 客户端提供的任意 `jsonParsed` 账户解析为 `Account` 类型，或者如果原始数据可以设置为 `null`，则解析为 `MaybeAccount` 类型。预期的数据类型应作为第一个类型参数显式提供。

```ts
const myAccount: Account<MyData> =
  parseJsonRpcAccount<MyData>(myJsonRpcAccount);
```

### `fetchEncodedAccount()`

此函数从提供的 RPC 客户端和地址获取 `MaybeEncodedAccount`。它在底层使用 `getAccountInfo` RPC 方法，采用 base64 编码，并且可以提供额外的配置对象来自定义 RPC 调用的行为。

```ts
const myAddress = address("1234..5678");
const myAccount: MaybeEncodedAccount<"1234..5678"> = await fetchEncodedAccount(
  rpc,
  myAddress,
);

// With custom configuration.
const myAccount: MaybeEncodedAccount<"1234..5678"> = await fetchEncodedAccount(
  rpc,
  myAddress,
  {
    abortSignal: myAbortController.signal,
    commitment: "confirmed",
  },
);
```

### `fetchEncodedAccounts()`

此函数从提供的 RPC 客户端和一组地址获取 `MaybeEncodedAccount` 数组。它在底层使用 `getMultipleAccounts` RPC 方法，采用 base64 编码，并且可以提供额外的配置对象来自定义 RPC 调用的行为。

```ts
const myAddressA = address("1234..5678");
const myAddressB = address("8765..4321");
const [myAccountA, myAccountB] = await fetchEncodedAccounts(rpc, [
  myAddressA,
  myAddressB,
]);
myAccountA satisfies MaybeEncodedAccount<"1234..5678">;
myAccountB satisfies MaybeEncodedAccount<"8765..4321">;

// With custom configuration.
const [myAccountA, myAccountB] = await fetchEncodedAccounts(
  rpc,
  [myAddressA, myAddressB],
  {
    abortSignal: myAbortController.signal,
    commitment: "confirmed",
  },
);
```

### `fetchJsonParsedAccount()`

此函数通过使用底层的 `getAccountInfo` 方法（使用 `jsonParsed` 编码）从提供的 RPC 客户端和地址获取 `MaybeAccount`。如果 RPC 客户端不知道如何解析请求地址的账户，它也可能返回 `MaybeEncodedAccount`。无论如何，预期的数据类型都应该作为第一个类型参数明确提供。

```ts
type TokenData = { mint: Address; owner: Address };
const myAccount = await fetchJsonParsedAccount<TokenData>(rpc, myAddress);
myAccount satisfies MaybeAccount<TokenData> | MaybeEncodedAccount;

// With custom configuration.
const myAccount = await fetchJsonParsedAccount<TokenData>(rpc, myAddress, {
  abortSignal: myAbortController.signal,
  commitment: "confirmed",
});
```

### `fetchJsonParsedAccounts()`

与 `fetchJsonParsedAccount` 方法类似，此方法从提供的 RPC 客户端和一组地址获取 `MaybeAccount` 数组。它在底层使用 `getMultipleAccounts` RPC 方法，采用 `jsonParsed` 编码。如果 RPC 客户端不知道如何解析某些请求的账户，它也可能返回 `MaybeEncodedAccount` 而不是预期的 `MaybeAccount`。无论如何，预期的数据类型数组都应该作为第一个类型参数明确提供。

```ts
type TokenData = { mint: Address; owner: Address };
type MintData = { supply: bigint };
const [myAccountA, myAccountB] = await fetchJsonParsedAccounts<
  [TokenData, MintData]
>(rpc, [myAddressA, myAddressB]);
myAccountA satisfies MaybeAccount<TokenData> | MaybeEncodedAccount;
myAccountB satisfies MaybeAccount<MintData> | MaybeEncodedAccount;
```

### `decodeAccount()`

此函数通过使用提供的 `Decoder` 实例解码账户数据，将 `EncodedAccount` 转换为 `Account`（或将 `MaybeEncodedAccount` 转换为 `MaybeAccount`）。

```ts
type MyAccountData = { name: string; age: number };

const myAccount: EncodedAccount<"1234..5678">;
const myDecoder: Decoder<MyAccountData> = getStructDecoder([
  ["name", addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
  ["age", getU32Decoder()],
]);

const myDecodedAccount = decodeAccount(myAccount, myDecoder);
myDecodedAccount satisfies Account<MyAccountData, "1234..5678">;
```

### `assertAccountDecoded()`

此函数断言一个账户存储的是已解码的数据，即不是 Uint8Array。请注意，它不检查数据的形状是否与解码类型匹配，只检查它是否不是 Uint8Array。

```ts
type MyAccountData = { name: string; age: number };

const myAccount: Account<MyAccountData | Uint8Array, "1234..5678">;
assertAccountDecoded(myAccount);

// now the account data can be used as MyAccountData
account.data satisfies MyAccountData;
```

这对于缩小获取 JSON 解析账户的结果范围特别有用。

```ts
const account: MaybeAccount<MockData | Uint8Array> =
  await fetchJsonParsedAccount<MockData>(rpc, "1234..5678" as Address);

assertAccountDecoded(account);
// now we have a MaybeAccount<MockData>
account satisfies MaybeAccount<MockData>;
```

### `assertAccountsDecoded()`

此函数断言所有输入账户存储的是已解码的数据，即不是 Uint8Array。与 `assertAccountDecoded()` 一样，它不检查数据的形状是否与解码类型匹配，只检查它是否不是 Uint8Array。

```ts
type MyAccountData = { name: string; age: number };

const myAccounts: Account<MyAccountData | Uint8Array, Address>[];
assertAccountsDecoded(myAccounts);

// now the account data can be used as MyAccountData
for (const a of account) {
  account.data satisfies MyAccountData;
}
```
