# @solana/rpc

这个包包含了用于创建对象的实用工具，你可以使用这些对象与 Solana JSON RPC 服务器进行通信。它可以独立使用，但也作为 Solana JavaScript SDK [`@solana/web3.js@rc`](https://github.com/solana-labs/solana-web3.js/tree/master/packages/library) 的一部分导出。

除非你计划创建自定义 RPC 接口，否则你可以使用 [`createSolanaRpc(clusterUrl)`](#createsolanarpcclusterurl-config) 函数来获取 [Solana JSON RPC API](https://solana.com/docs/rpc/http) 的默认实现。

## 类型

### `RpcTransport{Devnet|Testnet|Mainnet}`

这些类型细化了基本的 `RpcTransport` 类型。每个类型都描述了一个特定于某个 Solana 集群的传输。

例如，`RpcTransportDevnet` 被理解为与 devnet 相关的 RPC 服务器通信，因此可能只被接受用作 `RpcDevnet` 的传输。

这在你需要对 RPC 提供的功能做出断言的情况下很有用。例如，像 `requestAirdrop` 这样的 RPC 方法在主网上是不可用的。你可以使用在编译时断言 RPC 传输类型的能力来防止调用未实现的方法或假定不可用功能的存在。

### `RpcTransportFromClusterUrl<TClusterUrl extends ClusterUrl>`

给定一个 `ClusterUrl`，这个工具类型将解析为尽可能具体的 `RpcTransport`。

```ts
function createCustomTransport<TClusterUrl extends ClusterUrl>(
  clusterUrl: TClusterUrl,
): RpcTransportFromClusterUrl<TClusterUrl> {
  /* ... */
}
const transport = createCustomTransport(
  testnet("http://api.testnet.solana.com"),
);
transport satisfies RpcTransportTestnet; // OK
```

### `Rpc{Devnet|Testnet|Mainnet}<TRpcMethods>`

这些类型细化了基本的 `Rpc` 类型。每个类型都描述了一个特定于某个 Solana 集群和一组 RPC 方法的 RPC。

这在你需要对 RPC 是否适合特定用途做出断言的情况下很有用。例如，你可能希望在编译时将某些类型与属于某些集群的 RPC 组合时产生类型错误。

```ts
async function getSpecialAccountInfo(
  address: Address<"ReAL1111111111111111111111111111">,
  rpc: RpcMainnet,
): Promise<SpecialAccountInfo>;
async function getSpecialAccountInfo(
  address: Address<"TeST1111111111111111111111111111">,
  rpc: RpcDevnet | RpcTestnet,
): Promise<SpecialAccountInfo>;
async function getSpecialAccountInfo(
  address: Address,
  rpc: Rpc,
): Promise<SpecialAccountInfo> {
  /* ... */
}
const rpc = createSolanaRpc(devnet("https://api.devnet.solana.com"));
await getSpecialAccountInfo(address("ReAL1111111111111111111111111111"), rpc); // ERROR
```

### `RpcFromTransport<TRpcMethods, TRpcTransport extends RpcTransport>`

给定一个 `RpcTransport`，这个工具类型将解析为尽可能具体的 `Rpc`。

```ts
function createCustomRpc<TRpcTransport extends RpcTransport>(
  transport: TRpcTransport,
): RpcFromTransport<MyCustomRpcMethods, TRpcTransport> {
  /* ... */
}
const transport = createDefaultRpcTransport({
  url: mainnet("http://rpc.company"),
});
transport satisfies RpcTransportMainnet; // OK
const rpc = createCustomRpc(transport);
rpc satisfies RpcMainnet<MyCustomRpcMethods>; // OK
```

### SolanaRpcApiFromTransport<TTransport extends RpcTransport>

## 常量

### `DEFAULT_RPC_CONFIG`

当你使用自定义传输创建 `Rpc` 实例，但其他方面使用默认 RPC API 行为时，请使用此配置。

```ts
const myCustomRpc = createRpc({
  api: createSolanaRpcApi(DEFAULT_RPC_CONFIG),
  transport: myCustomTransport,
});
```

## 函数

### `createDefaultRpcTransport(config)`

创建一个具有一些默认行为的 `RpcTransport`。

默认行为包括：

- 自动设置的 `Solana-Client` 请求头，包含 `@solana/web3.js` 的版本
- 将同一运行循环中对相同方法和相同参数的多个调用合并为单个网络请求的逻辑

#### 参数

一个具有以下属性的配置对象：

- `dispatcher_NODE_ONLY`：一个可选的 `Undici.Dispatcher` 实例，用于控制网络堆栈的行为。此选项仅与 Node 应用程序相关。请查阅 `Undici.Dispatcher` 的各个子类（如 `Agent`、`Client` 和 `Pool`）的文档，网址为 https://undici.nodejs.org/#/docs/api/Client。
- `headers`：一个可选对象，其中键是 HTTP 头名称，值是 HTTP 头值。此参数的类型不允许覆盖某些头。
- `url`：一个 `ClusterUrl`，用于联系 RPC 服务器。

### `createSolanaRpc(clusterUrl, config)`

给定集群 URL 和一些可选的传输配置，创建一个暴露 Solana JSON RPC API 的 `Rpc` 实例。有关传输配置的形状，请参见 `createDefaultRpcTransport`。

### `createSolanaRpcFromTransport(transport)`

给定提供的 `RpcTransport`，创建一个暴露 Solana JSON RPC API 的 `Rpc` 实例。
