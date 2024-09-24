# Solana JavaScript SDK

这是用于构建 Solana 应用程序的 JavaScript SDK，适用于 Node、Web 和 React Native。

## 安装

在 Node.js 或 Web 应用程序中使用：

## 示例

为了熟悉 API，请运行并修改 `examples/` 目录中的实时示例。在那里，你会找到一系列单一用途的 Node 脚本，用于演示特定功能或用例。你还会找到一个可以在浏览器中运行的 React 应用程序，它展示了使用浏览器钱包创建、签名和发送交易的能力。

## 2.0 版本的新特性

Solana JavaScript SDK 的 2.0 版本是对您在使用 web3.js 开发 Solana 应用程序时向我们反馈的许多痛点的回应。

### Tree-Shakability（可树摇性）

web3.js（1.x）API 的面向对象设计阻止了优化编译器能够从你的生产构建中"tree-shake"（摇树）未使用的代码。无论你在应用程序中使用了多少 web3.js API，到目前为止你都被迫打包所有内容。

在这里了解更多关于 tree-shaking（树摇）的信息：

- [Mozilla Developer Docs: Tree Shaking（Mozilla 开发者文档：树摇）](https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking)
- [WebPack Docs: Tree Shaking（WebPack 文档：树摇）](https://webpack.js.org/guides/tree-shaking/)
- [Web.Dev Blog Article: Reduce JavaScript Payloads with Tree Shaking（Web.Dev 博客文章：通过树摇减少 JavaScript 负载）](https://web.dev/articles/reduce-javascript-payloads-with-tree-shaking)

一个无法进行 tree-shake（树摇）的 API 示例是 `Connection` 类。它有几十个方法，但因为它是一个 _class_（类），你别无选择，只能在应用程序的最终捆绑包中包含每个方法，无论你实际使用了多少。

不必要的大型 JavaScript 捆绑包可能会导致部署到云计算提供商（如 Cloudflare 或 AWS Lambda）时出现问题。它们还会影响 Web 应用程序的启动性能，因为下载和 JavaScript 解析时间更长。

2.0 版本是完全可进行树摇（tree-shakable）的，并且将保持这一特性，通过构建时检查来强制执行。优化编译器现在可以消除应用程序未使用的库的那些部分。

新的库本身由几个较小的、模块化的包组成，这些包都在 `@solana` 组织下，包括：

- `@solana/accounts`（账户）：用于获取和解码账户
- `@solana/codecs`（编解码器）：用于从一组原语组合数据（反）序列化器或构建自定义序列化器
- `@solana/errors`（错误）：用于识别和细化在 `@solana` 命名空间中抛出的编码错误
- `@solana/rpc`（远程过程调用）：用于发送 RPC 请求
- `@solana/rpc-subscriptions`（RPC 订阅）：用于订阅 RPC 通知
- `@solana/signers`（签名者）：用于构建消息和/或交易签名者对象
- `@solana/sysvars`（系统变量）：用于获取和解码系统变量账户
- `@solana/transaction-messages`（交易消息）：用于构建和转换 Solana 交易消息对象
- `@solana/transactions`（交易）：用于编译和签署交易以提交到网络
- 还有更多！

这些包中的一些本身由更小的包组成。例如，`@solana/rpc` 由 `@solana/rpc-spec`（用于核心 JSON RPC 规范类型）、`@solana/rpc-api`（用于 Solana 特定的 RPC 方法）、`@solana/rpc-transport-http`（用于默认的 HTTP 传输）等组成。

开发者可以使用主库（`@solana/web3.js@rc`）中的默认配置，或者在需要通过组合进行自定义的地方导入其任何子包。

### 可组合的内部结构（Composable Internals）

根据您的用例和对某些应用程序行为的容忍度，您可能希望配置您的应用程序以做出与其他开发者不同的权衡。web3.js（1.x）API 对所有开发者强加了一套严格的常见情况默认设置，其中一些是不可能更改的。

到目前为止，无法自定义 web3.js 一直是一个令人沮丧的源头：

- Mango 团队想要自定义交易确认策略，但所有这些功能都隐藏在 `confirmTransaction` 后面 —— 这是 `Connection` 的一个静态方法。[这里是 GitHub 上 `confirmTransaction` 的代码](https://github.com/solana-labs/solana-web3.js/blob/69a8ad25ef09f9e6d5bff1ffa8428d9be0bd32ac/packages/library-legacy/src/connection.ts#L3734)。
- Solana 开发者 'mPaella' [希望我们在 RPC（远程过程调用）中添加一个功能](https://github.com/solana-labs/solana-web3.js/issues/1143#issuecomment-1435927152)，在主要 URL 失败的情况下可以故障转移到一组备用 URL。
- Solana 开发者 'epicfaace' 希望在 RPC（远程过程调用）传输中提供对自动时间窗口批处理的一流支持。[这是他们的拉取请求（pull request）](https://github.com/solana-labs/solana/pull/23628)。
- 多位开发者表达了对失败请求或交易进行自定义重试逻辑的需求。[这是来自 'dafyddd' 的拉取请求（pull request）](https://github.com/solana-labs/solana/pull/11811)，以及[另一个来自 'abrkn' 的](https://github.com/solana-labs/solana-web3.js/issues/1041)，试图修改重试逻辑以适应他们各自的用例。

  2.0 版本暴露了更多的内部结构，特别是在与 RPC（Remote Procedure Call，远程过程调用）通信方面，并允许有意愿的开发者能够从默认实现中组合新的实现，从而实现几乎无限的定制化数组。

构成 web3.js 的各个模块以 **默认** 配置组装在 npm 包 `@solana/web3.js@rc` 中，这种配置让人想起传统库，但那些希望以不同配置组装它们的人也可以这样做。

在许多地方都提供了泛型类型，允许你指定新功能，通过组合和超类型对每个 API（Application Programming Interface，应用程序编程接口）进行扩展，并鼓励你创建自己的高级定制抽象。

事实上，我们希望你这样做，并开源其中一些供其他有类似需求的人使用。

### 现代 JavaScript；零依赖（Modern JavaScript; Zero-Dependency）

现代 JavaScript 特性的进步为加密应用程序的开发者提供了机会，例如使用原生 Ed25519 密钥和将大值表示为原生 `bigint` 的能力。

Web 孵化器社区组（Web Incubator Community Group）一直在倡导将 Ed25519 支持添加到 [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)（Web 加密 API）中，并且支持已经在大多数现代 JavaScript 运行时中落地。

对 `bigint` 值的引擎支持也已变得普遍。JavaScript 中较旧的 `number` 原始类型的最大值为 2^53 - 1，而 Rust 的 `u64` 可以表示高达 2^64 的值。

2.0 版本消除了 Ed25519 加密、大数字 polyfills 等的用户空间实现，转而支持自定义实现或使用原生 JavaScript 特性，从而减小了库的大小。它没有第三方依赖。

### 函数式架构（Functional Architecture）

web3.js（1.x）的面向对象、基于类的架构（object oriented, class-based architecture）导致了不必要的捆绑包膨胀。无论您在运行时实际使用多少方法，您的应用程序别无选择，只能捆绑类的所有功能和依赖项。

基于类的架构（Class-based architecture）还给触发双包危险（dual-package hazard）的开发者带来了独特的风险。这描述了一种情况，如果您同时为 CommonJS 和 ES 模块构建，就可能会遇到这种情况。当依赖树中存在同一个类的两个副本时，就会出现这种情况，导致像 `instanceof` 这样的检查失败。这引入了令人恼火且难以调试的问题。

阅读更多关于双包危险（dual-package hazard）的信息：

- [NodeJS：双包危险（Dual Package Hazard）](https://nodejs.org/api/packages.html#dual-package-hazard)

  2.0 版本不实现任何类（值得注意的例外是 `SolanaError` 类），并在函数边界实现尽可能薄的接口。

### 统计数据（Statistics）

考虑以下 2.0 版本与旧版 1.x 之间的统计比较。

|                                                                        | 1.x（旧版） | 2.0        | +/- % |
| ---------------------------------------------------------------------- | ----------- | ---------- | ----- |
| 库的总压缩大小（Total minified size of library）                       | 81 KB       | 57.5 KB    | -29%  |
| 库的总压缩大小（当运行时支持 Ed25519 时）                              | 81 KB       | 53 KB      | -33%  |
| 执行 lamports 转账的 Web 应用程序的打包大小（Bundled size）            | 111 KB      | 23.9 KB    | -78%  |
| 执行 lamports 转账的 Web 应用程序的打包大小（当运行时支持 Ed25519 时） | 111 KB      | 18.2 KB    | -83%  |
| 密钥生成、签名和验证签名的性能（Brave 浏览器使用实验性 API 标志）      | 700 ops/s   | 7000 ops/s | +900% |
| Solana Explorer 的首次加载大小（First-load size）                      | 311 KB      | 228 KB     | -26%  |

重新设计的库主要通过使用现代 JavaScript API 实现了这些加速和打包大小的减少。

为了验证我们的工作，我们在 Solana Explorer 的主页上用新的 2.0 库替换了旧版 1.x 库。总的首次加载打包大小减少了 26%，而没有删除任何功能。如果你想深入了解，这里有一个由 Callum McIntyre 发布的 [X 线程（X thread）](https://twitter.com/callum_codes/status/1679124485218226176)。

## 2.0 版本 API 导览（A Tour of the Version 2.0 API）

以下是如何使用新库与 RPC（Remote Procedure Call，远程过程调用）交互、配置网络传输、使用 Ed25519 密钥以及序列化数据的概述。

### RPC（Remote Procedure Call，远程过程调用）

2.0 版本附带了 [JSON RPC 规范（JSON RPC specification）](https://www.jsonrpc.org/specification) 的实现和 [Solana JSON RPC](https://docs.solana.com/api) 的类型规范。

负责管理与 RPC 通信的主要包是 `@solana/rpc`。然而，这个包使用了更细粒度的包来将 RPC 逻辑分解成更小的部分。具体来说，这些包是：

- `@solana/rpc`：包含所有与发送 Solana RPC 调用相关的逻辑。
- `@solana/rpc-api`：使用类型描述所有 Solana RPC 方法。
- `@solana/rpc-transport-http`：提供使用 HTTP 请求的 RPC 传输的具体实现。
- `@solana/rpc-spec`：定义用于发送 RPC 请求的 JSON RPC 规范。
- `@solana/rpc-spec-types`：共享的 JSON RPC 规范类型和辅助函数，由 `@solana/rpc` 和 `@solana/rpc-subscriptions`（在下一节中描述）共同使用。
- `@solana/rpc-types`：共享的 Solana RPC 类型和辅助函数，由 `@solana/rpc` 和 `@solana/rpc-subscriptions` 共同使用。

主要的 `@solana/web3.js` 包重新导出了 `@solana/rpc` 包，因此，接下来我们将直接从库中导入 RPC 类型和函数。

#### RPC 调用（RPC Calls）

你可以通过提供 Solana JSON RPC 服务器的 URL 来使用 `createSolanaRpc` 函数。这将创建一个默认客户端，用于与 Solana JSON RPC API 进行交互。

```ts
import { createSolanaRpc } from "@solana/web3.js";

// Create an RPC client.
const rpc = createSolanaRpc("http://127.0.0.1:8899");
//    ^? Rpc<SolanaRpcApi>

// Send a request.
const slot = await rpc.getSlot().send();
```

#### 自定义 RPC 传输（Custom RPC Transports）

`createSolanaRpc` 函数使用默认的 HTTP 传输与 RPC 服务器通信，这应该能满足大多数用例。你可以提供自己的传输或包装现有的传输，以任何你认为合适的方式与 RPC 服务器通信。在下面的示例中，我们显式创建一个传输，并通过 `createSolanaRpcFromTransport` 函数使用它来创建一个新的 RPC 客户端。

```ts
import {
  createSolanaRpcFromTransport,
  createDefaultRpcTransport,
} from "@solana/web3.js";

// Create an HTTP transport or any custom transport of your choice.
const transport = createDefaultRpcTransport({
  url: "https://api.devnet.solana.com",
});

// Create an RPC client using that transport.
const rpc = createSolanaRpcFromTransport(transport);
//    ^? Rpc<SolanaRpcApi>

// Send a request.
const slot = await rpc.getSlot().send();
```

自定义传输 (custom transport) 可以实现专门的功能，例如协调多个传输、实现重试等。让我们来看一些具体的例子。

##### Round Robin 轮询

一个 'round robin' （轮询）传输是一种按顺序将请求分发到一系列 endpoints （端点）的传输方式。

```ts
import {
  createDefaultRpcTransport,
  createSolanaRpcFromTransport,
  type RpcTransport,
} from "@solana/web3.js";

// Create an HTTP transport for each RPC server.
const transports = [
  createDefaultRpcTransport({ url: "https://mainnet-beta.my-server-1.com" }),
  createDefaultRpcTransport({ url: "https://mainnet-beta.my-server-2.com" }),
  createDefaultRpcTransport({ url: "https://mainnet-beta.my-server-3.com" }),
];

// Set up the round-robin transport.
let nextTransport = 0;
async function roundRobinTransport<TResponse>(
  ...args: Parameters<RpcTransport>
): Promise<TResponse> {
  const transport = transports[nextTransport];
  nextTransport = (nextTransport + 1) % transports.length;
  return await transport(...args);
}

// Create an RPC client using the round-robin transport.
const rpc = createSolanaRpcFromTransport(roundRobinTransport);
```

##### Sharding 分片

Sharding transport （分片传输）是一种分布式传输方式，它根据请求本身的某些特征将请求发送到特定的服务器。以下是一个示例，它根据方法的名称将请求发送到不同的服务器：

```ts
import {
  createDefaultRpcTransport,
  createSolanaRpcFromTransport,
  type RpcTransport,
} from "@solana/web3.js";

// Create multiple transports.
const transportA = createDefaultRpcTransport({
  url: "https://mainnet-beta.my-server-1.com",
});
const transportB = createDefaultRpcTransport({
  url: "https://mainnet-beta.my-server-2.com",
});
const transportC = createDefaultRpcTransport({
  url: "https://mainnet-beta.my-server-3.com",
});
const transportD = createDefaultRpcTransport({
  url: "https://mainnet-beta.my-server-4.com",
});

// Function to determine which shard to use based on the request method.
function selectShard(method: string): RpcTransport {
  switch (method) {
    case "getAccountInfo":
    case "getBalance":
      return transportA;
    case "getTransaction":
    case "getRecentBlockhash":
      return transportB;
    case "sendTransaction":
      return transportC;
    default:
      return transportD;
  }
}

// Create a transport that selects the correct transport given the request method name.
async function shardingTransport<TResponse>(
  ...args: Parameters<RpcTransport>
): Promise<TResponse> {
  const payload = args[0].payload as { method: string };
  const selectedTransport = selectShard(payload.method);
  return (await selectedTransport(...args)) as TResponse;
}

// Create an RPC client using the sharding transport.
const rpc = createSolanaRpcFromTransport(shardingTransport);
```

##### 重试 Retry

自定义传输是实现每个请求的全局重试逻辑的好地方：

```ts
import {
  createDefaultRpcTransport,
  createSolanaRpcFromTransport,
  type RpcTransport,
} from "@solana/web3.js";

// Set the maximum number of attempts to retry a request.
const MAX_ATTEMPTS = 4;

// Create the default transport.
const defaultTransport = createDefaultRpcTransport({
  url: "https://mainnet-beta.my-server-1.com",
});

// Sleep function to wait for a given number of milliseconds.
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Calculate the delay for a given attempt.
function calculateRetryDelay(attempt: number): number {
  // Exponential backoff with a maximum of 1.5 seconds.
  return Math.min(100 * Math.pow(2, attempt), 1500);
}

// A retrying transport that will retry up to MAX_ATTEMPTS times before failing.
async function retryingTransport<TResponse>(
  ...args: Parameters<RpcTransport>
): Promise<TResponse> {
  let requestError;
  for (let attempts = 0; attempts < MAX_ATTEMPTS; attempts++) {
    try {
      return await defaultTransport(...args);
    } catch (err) {
      requestError = err;
      // Only sleep if we have more attempts remaining.
      if (attempts < MAX_ATTEMPTS - 1) {
        const retryDelay = calculateRetryDelay(attempts);
        await sleep(retryDelay);
      }
    }
  }
  throw requestError;
}

// Create the RPC client using the retrying transport.
const rpc = createSolanaRpcFromTransport(retryingTransport);
```

##### 故障转移 Failover

支持处理网络故障的功能可以在传输 transport 本身中实现。以下是一些集成到传输 transport 中的故障转移逻辑的示例：

```ts
// TODO: Your turn; send us a pull request with an example.
```

#### 增强/约束 RPC API

使用 `createSolanaRpc` 或 `createSolanaRpcFromTransport` 方法，我们总是得到相同的 API，其中包括 Solana RPC API 方法。由于 RPC API 仅使用类型进行描述，因此可以增强这些类型以添加您自己的方法。

在约束 API 范围时，请记住类型不会影响包大小。您可能仍然希望出于各种原因约束类型规范，包括减少 TypeScript 噪音。

##### 通过 Cluster 进行约束

如果你正在使用一个特定的 cluster，你可以将你的 RPC URL 包装在一个像 `mainnet` 或 `devnet` 这样的辅助函数中，以将该信息注入到 RPC 类型系统中。

```ts
import { createSolanaRpc, mainnet, devnet } from "@solana/web3.js";

const mainnetRpc = createSolanaRpc(
  mainnet("https://api.mainnet-beta.solana.com"),
);
//    ^? RpcMainnet<SolanaRpcApiMainnet>

const devnetRpc = createSolanaRpc(devnet("https://api.devnet.solana.com"));
//    ^? RpcDevnet<SolanaRpcApiDevnet>
```

在上面的例子中，`devnetRpc.requestAirdrop(..)` 会工作，但 `mainnetRpc.requestAirdrop(..)` 会引发一个 TypeScript 错误，因为 `requestAirdrop` 不是 mainnet cluster 的有效方法。

##### 挑选 API 方法 Cherry-Picking API Methods

你可以进一步约束 API 的类型规范，这样你只会得到你需要的方法。最简单的方法是将创建的 RPC 客户端转换为仅包含所需方法的类型。

```ts
import {
  createSolanaRpc,
  type Rpc,
  type GetAccountInfoApi,
  type GetMultipleAccountsApi,
} from "@solana/web3.js";

const rpc = createSolanaRpc("http://127.0.0.1:8899") as Rpc<
  GetAccountInfoApi & GetMultipleAccountsApi
>;
```

或者，您可以使用 `createSolanaRpcApi` 函数显式地创建 RPC API。您需要创建自己的 transport 并使用 `createRpc` 函数将两者绑定在一起。

```ts
import {
  createDefaultRpcTransport,
  createRpc,
  createSolanaRpcApi,
  DEFAULT_RPC_CONFIG,
  type GetAccountInfoApi,
  type GetMultipleAccountsApi,
} from "@solana/web3.js";

const api = createSolanaRpcApi<GetAccountInfoApi & GetMultipleAccountsApi>(
  DEFAULT_RPC_CONFIG,
);
const transport = createDefaultRpcTransport({ url: "http:127.0.0.1:8899" });

const rpc = createRpc({ api, transport });
```

注意，`createSolanaRpcApi` 函数是 `createRpcApi` 函数的一个包装器，它添加了一些特定于 Solana 的转换器，例如在所有方法上设置默认的 commitment 或在检测到整数溢出时抛出错误。

##### 创建你自己的 API 方法

The new library’s RPC specification 支持 _无限_ 数量的 JSON-RPC 方法，并且 **零增加** bundle 大小。

这意味着该 library 可以支持官方 [Solana JSON RPC](https://docs.solana.com/api) 的未来扩展，或者由某些 RPC 提供者定义的 [custom RPC methods](https://docs.helius.dev/compression-and-das-api/digital-asset-standard-das-api/get-asset)。

这里有一个例子，展示了一个开发者如何为一个 RPC 提供者的 Metaplex Digital Asset Standard 的 `getAsset` 方法实现构建一个 custom RPC 类型规范：

```ts
import { RpcApiMethods } from "@solana/web3.js";

// Define the method's response payload.
type GetAssetApiResponse = Readonly<{
  interface: DasApiAssetInterface;
  id: Address;
  content: Readonly<{
    files?: readonly {
      mime?: string;
      uri?: string;
      [key: string]: unknown;
    }[];
    json_uri: string;
    links?: readonly {
      [key: string]: unknown;
    }[];
    metadata: DasApiMetadata;
  }>;
  /* ...etc... */
}>;

// Set up a type spec for the request method.
type GetAssetApi = {
  // Define the method's name, parameters and response type
  getAsset(args: { id: Address }): GetAssetApiResponse;
};

// Export the type spec for downstream users.
export type MetaplexDASApi = GetAssetApi;
```

这里是一个开发者可能会使用它的方式：

```ts
import {
  createDefaultRpcTransport,
  createRpc,
  createRpcApi,
} from "@solana/web3.js";

// Create the custom API.
const api = createRpcApi<MetaplexDASApi>();

// Set up an HTTP transport to a server that supports the custom API.
const transport = createDefaultRpcTransport({
  url: "https://mainnet.helius-rpc.com/?api-key=<api_key>",
});

// Create the RPC client.
const metaplexDASRpc = createRpc({ api, transport });
//    ^? Rpc<MetaplexDASApi>
```

只要一个特定的 JSON RPC 方法遵循 [official JSON RPC specification](https://www.jsonrpc.org/specification)，它将会被 version 2.0 支持。

#### 终止 RPC 请求

RPC requests 现在可以使用现代的 `AbortControllers` 进行终止。当调用一个 RPC 方法比如 `getSlot` 时，它将返回一个 `PendingRpcRequest` 代理对象，该对象包含一个 `send` 方法来将请求发送到服务器。

```ts
const pendingRequest: PendingRpcRequest<Slot> = rpc.getSlot();

const slot: Slot = await pendingRequest.send();
```

`getSlot` 方法的参数是为请求负载保留的，但 `send` 方法是可以在请求上下文中接受额外参数的地方，比如 `AbortSignal`。

终止 RPC 请求在多种情况下是有用的，比如在请求上设置超时，或者当用户离开页面时取消请求。

```ts
import { createSolanaRpc } from "@solana/web3.js";

const rpc = createSolanaRpc("http://127.0.0.1:8900");

// Create a new AbortController.
const abortController = new AbortController();

// Abort the request when the user navigates away from the current page.
function onUserNavigateAway() {
  abortController.abort();
}

// The request will be aborted if and only if the user navigates away from the page.
const slot = await rpc.getSlot().send({ abortSignal: abortController.signal });
```

了解更多关于 `AbortController` 的信息：

- [Mozilla Developer Docs: `AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [Mozilla Developer Docs: `AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
- [JavaScript.info: Fetch: Abort](https://javascript.info/fetch-abort)

### RPC 订阅

旧版库中的订阅不允许自定义重试逻辑，也不允许您从可能错过的消息中恢复。新版本取消了静默重试，将传输错误暴露给您的应用程序，并为您提供从间隙事件中恢复的机会。

负责管理 RPC 订阅通信的主要包是 `@solana/rpc-subscriptions`。然而，与 `@solana/rpc` 类似，这个包也使用了更细粒度的包。这些包是：

- `@solana/rpc-subscriptions`：包含所有与订阅 Solana RPC 通知相关的逻辑。
- `@solana/rpc-subscriptions-api`：使用类型描述所有 Solana RPC 订阅。
- `@solana/rpc-subscriptions-transport-websocket`：提供使用 WebSockets 的 RPC 订阅传输的具体实现。
- `@solana/rpc-subscriptions-spec`：定义订阅 RPC 通知的 JSON RPC 规范。
- `@solana/rpc-spec-types`：共享的 JSON RPC 规范类型和助手，供 `@solana/rpc` 和 `@solana/rpc-subscriptions` 使用。
- `@solana/rpc-types`：共享的 Solana RPC 类型和助手，供 `@solana/rpc` 和 `@solana/rpc-subscriptions` 使用。

由于主要的 `@solana/web3.js` 库也重新导出了 `@solana/rpc-subscriptions` 包，我们将来会直接从主库导入 RPC 订阅类型和函数。

#### 开始使用 RPC 订阅

要开始使用 RPC 订阅，您可以使用 `createSolanaRpcSubscriptions` 函数，并提供一个 Solana JSON RPC 服务器的 WebSocket URL。这将创建一个默认客户端，用于与 Solana RPC 订阅进行交互。

```ts
import { createSolanaRpcSubscriptions } from "@solana/web3.js";

// Create an RPC Subscriptions client.
const rpcSubscriptions = createSolanaRpcSubscriptions("ws://127.0.0.1:8900");
//    ^? RpcSubscriptions<SolanaRpcSubscriptionsApi>
```

#### 订阅作为 `AsyncIterators`

新的订阅 API 以 `AsyncIterator` 的形式提供订阅通知。`AsyncIterator` 符合 [async iterator protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols)，这允许开发人员使用 `for await...of` 循环来消费消息。

以下是使用新库中的订阅的示例：

```ts
import {
  address,
  createSolanaRpcSubscriptions,
  createDefaultRpcSubscriptionsTransport,
} from "@solana/web3.js";

// Create the RPC Subscriptions client.
const rpcSubscriptions = createSolanaRpcSubscriptions("ws://127.0.0.1:8900");

// Set up an abort controller.
const abortController = new AbortController();

// Subscribe to account notifications.
const accountNotifications = await rpcSubscriptions
  .accountNotifications(
    address("AxZfZWeqztBCL37Mkjkd4b8Hf6J13WCcfozrBY6vZzv3"),
    { commitment: "confirmed" },
  )
  .subscribe({ abortSignal: abortController.signal });

try {
  // Consume messages.
  for await (const notification of accountNotifications) {
    console.log("New balance", notification.value.lamports);
  }
} catch (e) {
  // The subscription went down.
  // Retry it and then recover from potentially having missed
  // a balance update, here (eg. by making a `getBalance()` call).
}
```

您可以在以下链接中阅读更多关于 `AsyncIterator` 的内容：

- [Mozilla Developer Docs: `AsyncIterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator)
- [Luciano Mammino (Blog): JavaScript Async Iterators](https://www.nodejsdesignpatterns.com/blog/javascript-async-iterators/)

#### 终止 RPC Subscriptions

与 RPC 调用类似，应用程序可以使用 `subscribe` 方法上的 `AbortController` 属性终止活动订阅。事实上，这个参数是订阅所必需的，以鼓励您清理应用程序不再需要的订阅。

让我们来看一些具体的示例，演示如何终止订阅。

##### 订阅超时

这是一个 `AbortController` 用于在 5 秒超时后中止订阅的示例:

```ts
import { createSolanaRpcSubscriptions } from "@solana/web3.js";

const rpcSubscriptions = createSolanaRpcSubscriptions("ws://127.0.0.1:8900");

// Subscribe for slot notifications using an AbortSignal that times out after 5 seconds.
const slotNotifications = await rpcSubscriptions
  .slotNotifications()
  .subscribe({ abortSignal: AbortSignal.timeout(5000) });

// Log slot notifications.
for await (const notification of slotNotifications) {
  console.log("Slot notification", notification);
}

console.log("Done.");
```

阅读更多关于 `AbortController` 的内容在以下链接：

- [Mozilla Developer Docs: `AbortController` ](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [Mozilla Developer Docs: `AbortSignal` ](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
- [JavaScript.info: Fetch: Abort](https://javascript.info/fetch-abort)

##### 取消订阅

也可以在 `for await...of` 循环中中止订阅。这使我们能够根据某些条件取消订阅，例如账户状态的变化。例如，以下示例在账户所有者更改时取消订阅：

```ts
// Subscribe to account notifications.
const accountNotifications = await rpc
  .accountNotifications(
    address("AxZfZWeqztBCL37Mkjkd4b8Hf6J13WCcfozrBY6vZzv3"),
    { commitment: "confirmed" },
  )
  .subscribe({ abortSignal });

// Consume messages.
let previousOwner = null;
for await (const notification of accountNotifications) {
  const {
    value: { owner },
  } = notification;
  // Check the owner to see if it has changed
  if (previousOwner && owner !== previousOwner) {
    // If so, abort the subscription
    abortController.abort();
  } else {
    console.log(notification);
  }
  previousOwner = owner;
}
```

#### 订阅失败与中止

需要注意的是，订阅失败与订阅中止的行为是不同的。当订阅失败时，会抛出一个错误，可以在 `try/catch` 中捕获。然而，当订阅中止时，不会抛出错误，而是会退出 `for await...of` 循环。

```ts
try {
  for await (const notification of notifications) {
    // Consume messages.
  }
  // [ABORTED] Reaching this line means the subscription was aborted — i.e. unsubscribed.
} catch (e) {
  // [FAILED] Reaching this line means the subscription went down.
  // Retry it, then recover from potential missed messages.
} finally {
  // [ABORTED or FAILED] Whether the subscription failed or was aborted, you can run cleanup code here.
}
```

#### 消息间隙恢复

任何订阅 API 的一个最关键方面是管理潜在的丢失消息。丢失消息，例如账户状态更新，可能会对应用程序造成灾难性的影响。这就是为什么新库提供了使用 `AsyncIterator` 恢复丢失消息的原生支持。

当连接意外失败时，您在断开连接期间错过的任何消息都可能导致您的 UI 落后或变得不一致。由于订阅失败现在在新 API 中被明确表示，您可以在重新建立订阅后实现“追赶”逻辑。

以下是此类逻辑的示例：

```ts
try {
  for await (const notif of accountNotifications) {
    updateAccountBalance(notif.lamports);
  }
} catch (e) {
  // The subscription failed.
  // First, re-establish the subscription.
  await setupAccountBalanceSubscription(address);
  // Then make a one-shot request to 'catch up' on any missed balance changes.
  const { value: lamports } = await rpc.getBalance(address).send();
  updateAccountBalance(lamports);
}
```

#### 使用自定义 RPC 订阅传输

`createSolanaRpcSubscriptions` 函数使用默认的 WebSocket 传输与 RPC 服务器通信，这应该满足大多数用例。然而，您也可以提供自己的传输方式或装饰现有的传输方式，以任何您认为合适的方式与 RPC 服务器通信。在下面的示例中，我们显式创建了一个 WebSocket 传输，并使用它通过 `createSolanaRpcSubscriptionsFromTransport` 函数创建一个新的 RPC 订阅客户端。

```ts
import {
  createDefaultRpcSubscriptionsTransport,
  createSolanaRpcSubscriptionsFromTransport,
} from "@solana/web3.js";

// Create a WebSocket transport or any custom transport of your choice.
const transport = createDefaultRpcSubscriptionsTransport({
  url: "ws://127.0.0.1:8900",
});

// Create an RPC client using that transport.
const rpcSubscriptions = createSolanaRpcSubscriptionsFromTransport(transport);
//    ^? RpcSubscriptions<SolanaRpcSubscriptionsApi>
```

#### 增强/约束 RPC 订阅 API

使用 `createSolanaRpcSubscriptions` 或 `createSolanaRpcSubscriptionsFromTransport` 函数，我们总是获得相同的 RPC 订阅 API，包括所有 Solana RPC 稳定订阅。然而，由于 RPC 订阅 API 仅使用类型进行描述，因此可以将 API 约束到特定的订阅集合，甚至添加您自己的自定义订阅。

##### 按集群约束

如果您正在使用特定的集群，您可以将 RPC URL 包装在像 `mainnet` 或 `devnet` 这样的辅助函数中，以将该信息注入到 RPC 类型系统中。

```ts
import { createSolanaRpcSubscriptions, mainnet, devnet } from "@solana/web3.js";

const mainnetRpc = createSolanaRpcSubscriptions(
  mainnet("https://api.mainnet-beta.solana.com"),
);
//    ^? RpcSubscriptionsMainnet<SolanaRpcSubscriptionsApi>

const devnetRpc = createSolanaRpcSubscriptions(
  devnet("https://api.devnet.solana.com"),
);
//    ^? RpcSubscriptionsDevnet<SolanaRpcSubscriptionsApi>
```

##### 包含不稳定的订阅

如果您的应用程序需要访问[不稳定的 RPC 订阅](https://docs.solana.com/api/websocket#blocksubscribe) — 例如 `BlockNotificationsApi` 或 `SlotsUpdatesNotificationsApi` — 并且您的 RPC 服务器支持它们，您可以使用 `createSolanaRpcSubscriptions_UNSTABLE` 和 `createSolanaRpcSubscriptionsFromTransport_UNSTABLE` 函数来创建包含这些订阅的 RPC 订阅客户端。

```ts
import {
  createSolanaRpcSubscriptions_UNSTABLE,
  createSolanaRpcSubscriptionsFromTransport_UNSTABLE,
} from "@solana/web3.js";

// Using the default WebSocket transport.
const rpcSubscriptions = createSolanaRpcSubscriptions_UNSTABLE(
  "ws://127.0.0.1:8900",
);
//    ^? RpcSubscriptions<SolanaRpcSubscriptionsApi & SolanaRpcSubscriptionsApiUnstable>

// Using a custom transport.
const transport = createDefaultRpcSubscriptionsTransport({
  url: "ws://127.0.0.1:8900",
});
const rpcSubscriptions =
  createSolanaRpcSubscriptionsFromTransport_UNSTABLE(transport);
//    ^? RpcSubscriptions<SolanaRpcSubscriptionsApi & SolanaRpcSubscriptionsApiUnstable>
```

##### 挑选 API 方法

您可以进一步约束订阅 API 的范围，以便只保留您需要的订阅。最简单的方法是将创建的 RPC 客户端转换为仅包含您需要的方法的类型。

```ts
import {
  createSolanaRpcSubscriptions,
  type RpcSubscriptions,
  type AccountNotificationsApi,
  type SlotNotificationsApi,
} from "@solana/web3.js";

const rpc = createSolanaRpcSubscriptions(
  "ws://127.0.0.1:8900",
) as RpcSubscriptions<AccountNotificationsApi & SlotNotificationsApi>;
```

或者，您可以使用 `createSolanaRpcSubscriptionsApi` 函数显式创建 RPC 订阅 API。然后，您需要显式创建自己的传输，并使用 `createSubscriptionRpc` 函数将两者绑定在一起。

```ts
import {
  createDefaultRpcSubscriptionsTransport,
  createSubscriptionRpc,
  createSolanaRpcSubscriptionsApi,
  DEFAULT_RPC_CONFIG,
  type AccountNotificationsApi,
  type SlotNotificationsApi,
} from "@solana/web3.js";

const api = createSolanaRpcSubscriptionsApi<
  AccountNotificationsApi & SlotNotificationsApi
>(DEFAULT_RPC_CONFIG);
const transport = createDefaultRpcSubscriptionsTransport({
  url: "ws://127.0.0.1:8900",
});
const rpcSubscriptions = createSubscriptionRpc({ api, transport });
```

请注意，`createSolanaRpcSubscriptionsApi` 函数是 `createRpcSubscriptionsApi` 函数的包装器，它添加了一些 Solana 特定的转换器，例如在所有方法上设置默认承诺或在检测到整数溢出时抛出错误。

### 密钥

新库采用了一种全新的方法来处理 Solana 密钥对和地址，这与 1.x 版本中的 `PublicKey` 和 `Keypair` 类有很大不同。

#### Web Crypto API

所有密钥操作现在都使用 JavaScript 的 Web Crypto API 中的本地 Ed25519 实现。

该 API 本身旨在成为一种更可靠的安全方式来管理高度敏感的密钥信息，但**开发人员在处理应用程序中的密钥字节时仍应格外小心**。

需要注意的一点是，Web Crypto 的许多操作——例如导入、生成、签名和验证现在都是**异步**的。

以下是使用 Web Crypto API 生成 `CryptoKeyPair` 并签名消息的示例：

```ts
import { generateKeyPair, signBytes, verifySignature } from "@solana/web3.js";

const keyPair: CryptoKeyPair = await generateKeyPair();

const message = new Uint8Array(8).fill(0);

const signedMessage = await signBytes(keyPair.privateKey, message);
//    ^? Signature

const verified = await verifySignature(
  keyPair.publicKey,
  signedMessage,
  message,
);
```

#### Web Crypto Polyfill

在不支持 Ed25519 的地方，我们提供了 Web Crypto 的 Ed25519 API 的 polyfill。

这个 polyfill 可以在 `@solana/webcrypto-ed25519-polyfill` 中找到，它使用我们在 web3.js 1.x 中使用的相同用户空间实现来模拟 Web Crypto API 的 Ed25519 密钥对功能。它不会 polyfill 其他算法。

确定您的目标运行时是否支持 Ed25519，如果不支持，请安装 polyfill：

```ts
import { install } from "@solana/webcrypto-ed25519-polyfill";
import { generateKeyPair, signBytes, verifySignature } from "@solana/web3.js";

install();
const keyPair: CryptoKeyPair = await generateKeyPair();

/* Remaining logic */
```

您可以在 Web Crypto 仓库的[这个 GitHub issue](https://github.com/WICG/webcrypto-secure-curves/issues/20)中查看 Ed25519 当前的支持情况。在决定是否向浏览器提供 polyfill 时，请考虑嗅探用户代理。

使用 Web Crypto API 或 polyfill 对 `CryptoKey` 对象的操作主要由 `@solana/keys` 包处理。

#### 字符串地址

所有地址现在都是 JavaScript 字符串。它们由不透明类型 `Address` 表示，该类型准确描述了 Solana 地址的实际含义。

因此，不再使用 `PublicKey`。

以下是它们在开发中的样子：

```ts
import {
  Address,
  address,
  getAddressFromPublicKey,
  generateKeyPair,
} from "@solana/web3.js";

// Coerce a string to an `Address`
const myOtherAddress = address("AxZfZWeqztBCL37Mkjkd4b8Hf6J13WCcfozrBY6vZzv3");

// Typecast it instead
const myAddress =
  "AxZfZWeqztBCL37Mkjkd4b8Hf6J13WCcfozrBY6vZzv3" as Address<"AxZfZWeqztBCL37Mkjkd4b8Hf6J13WCcfozrBY6vZzv3">;

// From CryptoKey
const keyPair = await generateKeyPair();
const myPublicKeyAsAddress = await getAddressFromPublicKey(keyPair.publicKey);
```

一些用于处理 base58 编码地址的工具可以在 `@solana/addresses` 包中找到。

### 交易

#### 创建交易消息

与 1.0 版本库的许多其他熟悉方面一样，交易也进行了改造。

首先，所有交易消息现在都支持版本，因此不再需要处理两种不同类型（例如 `Transaction` 和 `VersionedTransaction`）。

地址查找现在完全在交易消息指令中描述，因此您不再需要实现 `addressTableLookups`。

这里有一个创建交易消息的简单示例 &ndash; 注意它的类型在每一步过程中是如何细化的：

```ts
import {
  address,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  Blockhash,
} from "@solana/web3.js";

const recentBlockhash = {
  blockhash: "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY" as Blockhash,
  lastValidBlockHeight: 196055492n,
};
const feePayer = address("AxZfZWeqztBCL37Mkjkd4b8Hf6J13WCcfozrBY6vZzv3");

// Create a new transaction message
const transactionMessage = createTransactionMessage({ version: 0 });
//    ^? V0TransactionMessage

// Set the fee payer
const transactionMessageWithFeePayer = setTransactionMessageFeePayer(
  feePayer,
  transactionMessage,
);
//    ^? V0TransactionMessage & ITransactionMessageWithFeePayer

const transactionMessageWithFeePayerAndLifetime =
  setTransactionMessageLifetimeUsingBlockhash(
    // ^? V0TransactionMessage & ITransactionMessageWithFeePayer & TransactionMessageWithBlockhashLifetime
    recentBlockhash,
    transactionMessageWithFeePayer,
  );
```

如你所见，每次修改交易消息时，类型都会反映其新形态。如果你添加一个费用支付者，你将获得一个表示包含费用支付者的交易消息的类型，依此类推。

交易消息对象也会被这些函数**冻结**，以防止它们被就地修改。

#### 签署交易消息

如果你的交易消息尚未配备费用支付者和生命周期，`signTransaction(..)` 函数将引发类型错误。这有助于你在编写时而不是在运行时捕捉错误。

```ts
const feePayer = address("AxZfZWeqztBCL37Mkjkd4b8Hf6J13WCcfozrBY6vZzv3");
const signer = await generateKeyPair();

const transactionMessage = createTransactionMessage({ version: "legacy" });
const transactionMessageWithFeePayer = setTransactionMessageFeePayer(
  feePayer,
  transactionMessage,
);

// Attempting to sign the transaction message without a lifetime will throw a type error
const signedTransaction = await signTransaction(
  [signer],
  transactionMessageWithFeePayer,
);
// => "Property 'lifetimeConstraint' is missing in type"
```

#### 校准交易消息的计算单元预算

正确预算交易消息的计算单元限制可以增加交易被处理接受的概率。如果你没有在交易中声明计算单元限制，验证者将假定每条指令的上限为 200K 计算单元（CU）。

由于验证者有动机在每个区块中尽可能多地打包交易，他们可能会选择包含那些他们知道可以适应当前区块剩余计算预算的交易，而不是那些可能不适应的交易。因此，你应尽可能在每个交易消息中设置计算单元限制。

使用此工具来估算给定交易消息的实际计算单元成本。

```ts
import { getSetComputeUnitLimitInstruction } from "@solana-program/compute-budget";
import {
  createSolanaRpc,
  getComputeUnitEstimateForTransactionMessageFactory,
  pipe,
} from "@solana/web3.js";

// Create an estimator function.
const rpc = createSolanaRpc("http://127.0.0.1:8899");
const getComputeUnitEstimateForTransactionMessage =
  getComputeUnitEstimateForTransactionMessageFactory({
    rpc,
  });

// Create your transaction message.
const transactionMessage = pipe(
  createTransactionMessage({ version: "legacy" }),
  /* ... */
);

// Request an estimate of the actual compute units this message will consume.
const computeUnitsEstimate =
  await getComputeUnitEstimateForTransactionMessage(transactionMessage);

// Set the transaction message's compute unit budget.
const transactionMessageWithComputeUnitLimit =
  prependTransactionMessageInstruction(
    getSetComputeUnitLimitInstruction({ units: computeUnitsEstimate }),
    transactionMessage,
  );
```

> [!WARNING]
> 计算单元估算值仅仅是一个估算值。实际交易的计算单元消耗可能高于或低于模拟中观察到的值。除非你确信你的特定交易消息将消耗与估算值相同或更少的计算单元，否则你可能需要通过固定数量的计算单元或乘数来增加估算值。

> [!NOTE]
> 如果你正在准备一个未签名的交易，打算由钱包签名并提交到网络，你可以考虑让钱包来决定计算单元限制。考虑到钱包可能对某些类型的交易消耗的计算单元有更全面的了解，并且可能能够更好地估算出适当的计算单元预算。

#### 构建交易消息的辅助

以这种方式构建交易消息可能会让你感到不同于你习惯的方式。此外，我们当然不希望你在每一步都将转换后的交易消息绑定到一个新变量，因此我们发布了一个名为 `@solana/functional` 的函数式编程库，它允许你在**管道**中构建交易消息。以下是它的使用方法：

```ts
import { pipe } from "@solana/functional";
import {
  address,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  Blockhash,
} from "@solana/web3.js";

// Use `pipe(..)` to create a pipeline of transaction message transformation operations
const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  tx => setTransactionMessageFeePayer(feePayer, tx),
  tx => setTransactionMessageLifetimeUsingBlockhash(recentBlockhash, tx),
);
```

请注意，`pipe(..)` 是通用的，因此它可以用于管道化任何函数式转换。

### 编解码器

我们已经采取了一些措施，使编写数据（反）序列化器变得更容易，特别是当它们涉及到 Rust 数据类型和字节缓冲区时。

Solana 的编解码器库被分解成模块化组件，因此您只需要导入所需的部分。它们是：

- `@solana/codecs-core`：用于处理编解码器序列化器和创建自定义序列化器的核心编解码器库
- `@solana/codecs-numbers`：用于数字的序列化（小端和大端字节等）
- `@solana/codecs-strings`：用于字符串的序列化
- `@solana/codecs-data-structures`：用于结构体的编解码器和序列化器
- `@solana/options`：设计用于构建类似于 Rust 枚举类型的编解码器和序列化器，这些枚举类型的变体中可以包含嵌入的数据，如值、元组和结构体

这些包包含在主要的 `@solana/web3.js` 库中，但如果您只需要编解码器，也可以从 `@solana/codecs` 中导入它们。

以下是一个包含一些字符串和数字的自定义结构体的编码和解码示例：

```ts
import { addCodecSizePrefix } from "@solana/codecs-core";
import { getStructCodec } from "@solana/codecs-data-structures";
import { getU32Codec, getU64Codec, getU8Codec } from "@solana/codecs-numbers";
import { getUtf8Codec } from "@solana/codecs-strings";

// Equivalent in Rust:
// struct {
//     amount: u64,
//     decimals: u8,
//     name: String,
// }
const structCodec = getStructCodec([
  ["amount", getU64Codec()],
  ["decimals", getU8Codec()],
  ["name", addCodecSizePrefix(getUtf8Codec(), getU32Codec())],
]);

const myToken = {
  amount: 1000000000000000n, // `bigint` or `number` is supported
  decimals: 2,
  name: "My Token",
};

const myEncodedToken: Uint8Array = structCodec.encode(myToken);
const myDecodedToken = structCodec.decode(myEncodedToken);

myDecodedToken satisfies {
  amount: bigint;
  decimals: number;
  name: string;
};
```

您可能只需要编码或解码数据，而不是两者都需要。仅导入其中一个可以让您的优化编译器将另一个实现树摇优化掉：

```ts
import {
  Codec,
  combineCodec,
  Decoder,
  Encoder,
  addDecoderSizePrefix,
  addEncoderSizePrefix,
} from "@solana/codecs-core";
import {
  getStructDecoder,
  getStructEncoder,
} from "@solana/codecs-data-structures";
import {
  getU8Decoder,
  getU8Encoder,
  getU32Decoder,
  getU32Encoder,
  getU64Decoder,
  getU64Encoder,
} from "@solana/codecs-numbers";
import { getUtf8Decoder, getUtf8Encoder } from "@solana/codecs-strings";

export type MyToken = {
  amount: bigint;
  decimals: number;
  name: string;
};

export type MyTokenArgs = {
  amount: number | bigint;
  decimals: number;
  name: string;
};

export const getMyTokenEncoder = (): Encoder<MyTokenArgs> =>
  getStructEncoder([
    ["amount", getU64Encoder()],
    ["decimals", getU8Encoder()],
    ["name", addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder())],
  ]);

export const getMyTokenDecoder = (): Decoder<MyToken> =>
  getStructDecoder([
    ["amount", getU64Decoder()],
    ["decimals", getU8Decoder()],
    ["name", addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
  ]);

export const getMyTokenCodec = (): Codec<MyTokenArgs, MyToken> =>
  combineCodec(getMyTokenEncoder(), getMyTokenDecoder());
```

你可以在[官方编解码器文档](https://github.com/solana-labs/solana-web3.js/blob/master/packages/codecs/README.md)中阅读有关编解码器的信息。

### 类型安全

这个新库使用了一些高级的 TypeScript 特性，包括泛型、条件类型、`Parameters<..>`、`ReturnType<..>` 等等。

我们详细描述了 RPC API，以便 TypeScript 可以根据特定的输入确定您将从服务器接收到的结果的确切类型。更改输入的类型，您将看到返回类型也会相应地发生变化。

#### RPC 类型

RPC 方法——包括 HTTP 和订阅——是通过多重重载和条件类型构建的。当您在代码中提供输入时，预期的 HTTP 响应负载或订阅消息格式将反映在您正在使用的函数的返回类型中。

以下是一个实际示例：

```ts
// Provide one set of parameters, get a certain type
// These parameters resolve to return type:
// {
//     blockhash: Blockhash;
//     blockHeight: bigint;
//     blockTime: UnixTimestampUnsafeBeyond2Pow53Minus1;
//     parentSlot: bigint;
//     previousBlockhash: Blockhash;
// }
const blockResponse = await rpc
  .getBlock(0n, {
    rewards: false,
    transactionDetails: "none",
  })
  .send();

// Switch `rewards` to `true`, get `rewards` in the return type
// {
//     /* ... Previous response */
//     rewards: Reward[];
// }
const blockWithRewardsResponse = await rpc
  .getBlock(0n, {
    rewards: true,
    transactionDetails: "none",
  })
  .send();

// Switch `transactionDetails` to `full`, get `transactions` in the return type
// {
//     /* ... Previous response */
//     transactions: TransactionResponse[];
// }
const blockWithRewardsAndTransactionsResponse = await rpc
  .getBlock(0n, {
    rewards: true,
    transactionDetails: "full",
  })
  .send();
```

#### 使用 TypeScript 捕捉编译时错误

如前所述，2.0 版本中的类型覆盖允许开发人员在编译时捕捉常见错误，而不是在运行时。

在下面的示例中，创建了一个交易消息，然后在未设置费用支付者的情况下尝试签名。这将导致来自 RPC 的运行时错误，但相反，您将在输入时看到来自 TypeScript 的类型错误：

```ts
const transactionMessage = pipe(createTransactionMessage({ version: 0 }), tx =>
  setTransactionMessageLifetimeUsingBlockhash(recentBlockhash, tx),
);
const signedTransaction = await signTransaction([keyPair], transactionMessage); // ERROR: Property 'feePayer' is missing in type
```

考虑另一个示例，其中开发人员尝试发送尚未完全签名的交易。同样，TypeScript 编译器将抛出类型错误：

```ts
const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  tx => setTransactionMessageFeePayer(feePayerAddress, tx),
  tx => setTransactionMessageLifetimeUsingBlockhash(recentBlockhash, tx),
);

const signedTransaction = await signTransaction([], transactionMessage);

// Asserts the transaction is a `FullySignedTransaction`
// Throws an error if any signatures are missing!
assertTransactionIsFullySigned(signedTransaction);

await sendAndConfirmTransaction(signedTransaction);
```

你是否在构建一个 nonce 交易时忘记将 `AdvanceNonce` 作为第一个指令？这是一个类型错误：

```ts
const feePayer = await generateKeyPair();
const feePayerAddress = await getAddressFromPublicKey(feePayer.publicKey);

const notNonceTransactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  tx => setTransactionMessageFeePayer(feePayerAddress, tx),
);

notNonceTransactionMessage satisfies TransactionMessageWithDurableNonceLifetime;
// => Property 'lifetimeConstraint' is missing in type

const nonceConfig = {
  nonce: "nonce" as Nonce,
  nonceAccountAddress: address("5tLU66bxQ35so2bReGcyf3GfMMAAauZdNA1N4uRnKQu4"),
  nonceAuthorityAddress: address(
    "GDhj8paPg8woUzp9n8fj7eAMocN5P7Ej3A7T9F5gotTX",
  ),
};

const stillNotNonceTransactionMessage = {
  lifetimeConstraint: nonceConfig,
  ...notNonceTransactionMessage,
};

stillNotNonceTransactionMessage satisfies TransactionMessageWithDurableNonceLifetime;
// => 'readonly IInstruction<string>[]' is not assignable to type 'readonly [AdvanceNonceAccountInstruction<string, string>, ...IInstruction<string>[]]'

const validNonceTransactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  tx => setTransactionMessageFeePayer(feePayerAddress, tx),
  tx => setTransactionMessageLifetimeUsingDurableNonce(nonceConfig, tx), // Adds the instruction!
);

validNonceTransactionMessage satisfies TransactionMessageWithDurableNonceLifetime; // OK
```

该库的类型检查甚至可以捕获你使用 lamports 而不是 SOL 作为值的情况：

```ts
const airdropAmount = 1n; // SOL
const signature = rpc.requestAirdrop(myAddress, airdropAmount).send();
```

它会强制你使用 `lamports()` 来转换你的空投（或转账等）金额的数值，这应该是一个很好的提醒！

```ts
const airdropAmount = lamports(1000000000n);
const signature = rpc.requestAirdrop(myAddress, airdropAmount).send();
```

### 兼容性层

到目前为止，您可能已经注意到 web3.js 相对于 1.x 版本是一个完全的破坏性变更。我们想为您提供一种策略，让您在使用 2.0 构建应用程序的同时能够与 1.x API 进行交互。您需要一个工具来在 1.x 和 2.0 数据类型之间进行转换。

`@solana/compat` 库允许在旧库的函数和类对象（如 `VersionedTransaction`、`PublicKey` 和 `Keypair`）与新库的函数和类型（如 `Address`、`Transaction` 和 `CryptoKeyPair`）之间进行互操作。

以下是如何使用 `@solana/compat` 将旧版 `PublicKey` 转换为 `Address` 的示例：

```ts
import { fromLegacyPublicKey } from "@solana/compat";

const publicKey = new PublicKey("B3piXWBQLLRuk56XG5VihxR4oe2PSsDM8nTF6s1DeVF5");
const address: Address = fromLegacyPublicKey(publicKey);
```

以下是如何将旧版 `Keypair` 转换为 `CryptoKeyPair`：

```ts
import { fromLegacyKeypair } from "@solana/compat";

const keypairLegacy = Keypair.generate();
const cryptoKeyPair: CryptoKeyPair = fromLegacyKeypair(keypair);
```

以下是如何将旧版交易对象转换为新库的交易类型：

```ts
// Note that you can only convert `VersionedTransaction` objects
const modernTransaction = fromVersionedTransaction(classicTransaction);
```

要查看 `@solana/compat` 支持的更多转换，您可以查看该包在 GitHub 上的 [README](https://github.com/solana-labs/solana-web3.js/blob/master/packages/compat/README.md)。

### 程序客户端

到目前为止，为链上程序编写 JavaScript 客户端一直是手动完成的。由于某些原生程序缺乏 IDL，这个过程必然是手动的，导致客户端的功能落后于程序本身的实际能力。

我们认为程序客户端应该是被"生成"而不是编写的。开发者应该能够编写 Rust 程序，编译程序代码，并生成所有与程序交互的 JavaScript 客户端代码。

我们使用 [Kinobi](https://github.com/metaplex-foundation/kinobi) 来表示 Solana 程序并为它们生成客户端。这包括一个与本库兼容的 JavaScript 客户端。例如，以下是如何构造一个由三个不同核心程序的指令组成的交易消息。

```ts
import {
  appendTransactionMessageInstructions,
  createTransactionMessage,
  pipe,
} from "@solana/web3.js";
import { getAddMemoInstruction } from "@solana-program/memo";
import { getSetComputeUnitLimitInstruction } from "@solana-program/compute-budget";
import { getTransferSolInstruction } from "@solana-program/system";

const instructions = [
  getSetComputeUnitLimitInstruction({ units: 600_000 }),
  getTransferSolInstruction({ source, destination, amount: 1_000_000_000 }),
  getAddMemoInstruction({ memo: "I'm transferring some SOL!" }),
];

// Creates a V0 transaction message with 3 instructions inside.
const transactionMessage = pipe(createTransactionMessage({ version: 0 }), tx =>
  appendTransactionMessageInstructions(instructions, tx),
);
```

正如您所见，每个程序现在都生成自己的库，允许您精确选择所需的依赖项。

请注意，某些指令可能提供异步版本，这使它们能够代您解析更多输入 — 例如 PDA 派生。比如，`CreateLookupTable` 指令提供了一个异步构建器，它为我们派生了 `address` 账户和 `bump` 参数。

```ts
const rpc = createSolanaRpc("http://127.0.0.1:8899");
const [authority, recentSlot] = await Promise.all([
  generateKeyPairSigner(),
  rpc.getSlot({ commitment: "finalized" }).send(),
]);

const instruction = await getCreateLookupTableInstructionAsync({
  authority,
  recentSlot,
});
```

或者，如果您已经准备好所有必需的输入，您也可以使用同步构建器。

```ts
const [address, bump] = await findAddressLookupTablePda({
  authority: authority.address,
  recentSlot,
});

const instruction = getCreateLookupTableInstruction({
  address,
  authority,
  bump,
  recentSlot,
});
```

除了指令构建器之外，这些客户端还提供了各种实用工具，例如：

- 指令编解码器 — 例如 `getTransferSolInstructionDataCodec`。
- 账户类型 — 例如 `AddressLookupTable`。
- 账户编解码器 — 例如 `getAddressLookupTableAccountDataCodec`。
- 账户辅助函数 — 例如 `fetchAddressLookupTable`。
- PDA 辅助函数 — 例如 `findAddressLookupTablePda`，`fetchAddressLookupTableFromSeeds`。
- 定义的类型及其编解码器 — 例如 `NonceState`，`getNonceStateCodec`。
- 程序辅助函数 — 例如 `SYSTEM_PROGRAM_ADDRESS`，`SystemAccount` 枚举，`identifySystemInstruction`。
- 以及更多！

以下是另一个从其种子获取 `AddressLookupTable` PDA 的示例。

```ts
const account = await fetchAddressLookupTableFromSeeds(rpc, {
  authority: authority.address,
  recentSlot,
});

account.address; // Address
account.lamports; // LamportsUnsafeBeyond2Pow53Minus1
account.data.addresses; // Address[]
account.data.authority; // Some<Address>
account.data.deactivationSlot; // Slot
account.data.lastExtendedSlot; // Slot
account.data.lastExtendedSlotStartIndex; // number
```

#### 这是如何工作的？

所有这些代码都是由 Kinobi 从代表我们程序的标准化节点树中 100% 自动生成的。它包含了明显的节点，如 `AccountNode`，但也包含更具体的节点，如 `ConditionalValueNode`，它允许我们有条件地解析账户或参数的默认值。

Kinobi 允许我们从 IDL 中填充节点树，这些 IDL 通常由程序框架如 [Anchor](https://github.com/coral-xyz/anchor) 或 [Shank](https://github.com/metaplex-foundation/shank) 生成。此外，访问器可以用于我们的节点，以扩展我们程序的知识，因为 IDL 本身还不包含那个级别的信息。最后，称为"渲染器"的特殊访问器访问我们的树来生成客户端，比如这个 JavaScript 客户端。

目前，还有另一个渲染器可以生成 Rust 客户端，但这仅仅是个开始。在未来，你可以期待自动生成 Python 客户端、文档、CLI 等的渲染器。

### 创建 Solana 程序

我们相信整个生态系统都可以从生成的程序客户端中受益。这就是为什么我们引入了一个新的 NPM 二进制文件，它允许您快速创建 Solana 程序并为其生成客户端。只需运行以下命令并按照提示操作即可开始。

```sh
pnpm create solana-program
```

这个 [`create-solana-program`](https://github.com/solana-program/create-solana-program) 安装程序将创建一个新的仓库，包括：

- 一个使用您选择的框架的示例程序（Anchor 即将推出）。
- 为任何选定的客户端生成的客户端代码。
- 一组允许您执行以下操作的脚本：
  - 启动一个本地验证器，包括您依赖的所有程序和账户。
  - 构建、lint 和测试您的程序。
  - 从您的程序生成 IDL。
  - 从生成的 IDL 生成客户端。
  - 构建和测试每个客户端。
- GitHub Actions 流水线，用于测试您的程序、测试您的客户端，甚至手动发布客户端的新包或 crate。（即将推出）

当选择 JavaScript 客户端时，您将获得一个完全生成的库，与新的 web3.js 兼容，就像上面展示的 `@solana-program` 包一样。

### GraphQL

虽然与 web3.js 没有直接关系，但我们想借此机会向您展示我们正在开发的另一个项目，这对前端开发者来说特别有兴趣。这是一个用于与 RPC 交互的新 API：GraphQL API。

`@solana/rpc-graphql` 包可以用来向 Solana RPC 端点发送 GraphQL 查询，使用上面描述的相同传输方式（包括任何自定义设置）。

以下是使用 GraphQL 检索账户数据的示例：

```ts
const source = `
    query myQuery($address: String!) {
        account(address: $address) {
            dataBase58: data(encoding: BASE_58)
            dataBase64: data(encoding: BASE_64)
            lamports
        }
    }
`;

const variableValues = {
  address: "AyGCwnwxQMCqaU4ixReHt8h5W4dwmxU7eM3BEQBdWVca",
};

const result = await rpcGraphQL.query(source, variableValues);

expect(result).toMatchObject({
  data: {
    account: {
      dataBase58: "2Uw1bpnsXxu3e",
      dataBase64: "dGVzdCBkYXRh",
      lamports: 10290815n,
    },
  },
});
```

使用 GraphQL 允许开发者只指定他们实际需要的字段，并摒弃响应中的其余部分。

然而，GraphQL 在**嵌套查询**方面也非常强大，这在某些情况下特别有用。例如，如果你想获取每个代币账户的**所有者的所有者**的每个 lamports 余额的**总和**，同时排除任何铸币账户。

```ts
const source = `
    query getLamportsOfOwnersOfOwnersOfTokenAccounts {
        programAccounts(programAddress: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") {
            ... on TokenAccount {
                owner {
                    ownerProgram {
                        lamports
                    }
                }
            }
        }
    }
`;

const result = await rpcGraphQL.query(source);

const sumOfAllLamportsOfOwnersOfOwnersOfTokenAccounts = result
  .map(o => o.account.owner.ownerProgram.lamports)
  .reduce((acc, lamports) => acc + lamports, 0);
```

新的 GraphQL 包支持对交易和区块进行相同风格的嵌套查询。

```ts
const source = `
    query myQuery($signature: String!, $commitment: Commitment) {
        transaction(signature: $signature, commitment: $commitment) {
            message {
                instructions {
                    ... on CreateAccountInstruction {
                        lamports
                        programId
                        space
                    }
                }
            }
        }
    }
`;

const variableValues = {
  signature:
    "63zkpxATgAwXRGFQZPDESTw2m4uZQ99sX338ibgKtTcgG6v34E3MSS3zckCwJHrimS71cvei6h1Bn1K1De53BNWC",
  commitment: "confirmed",
};

const result = await rpcGraphQL.query(source, variableValues);

expect(result).toMatchObject({
  data: {
    transaction: {
      message: {
        instructions: expect.arrayContaining([
          {
            lamports: expect.any(BigInt),
            programId: "11111111111111111111111111111111",
            space: expect.any(BigInt),
          },
        ]),
      },
    },
  },
});
```

在 GitHub 上的包 [README](https://github.com/solana-labs/solana-web3.js/tree/master/packages/rpc-graphql) 中查看更多信息。

## 开发

你可以在 GitHub 上的 web3.js 仓库中查看此库及相关 GraphQL 工具的所有开发内容。

- https://github.com/solana-labs/solana-web3.js

你可以在 `@solana-program` 组织和 `@kinobi-so/kinobi` 仓库中跟进程序客户端生成器的开发。

- https://github.com/solana-program/
- https://github.com/kinobi-so/kinobi

Solana Labs 以开源的方式公开开发这些工具。我们鼓励所有希望参与这些工具开发的开发者为代码库做出贡献。

## 感谢

我们非常感谢您阅读到这里。如果您有兴趣将现有应用程序迁移到新的 web3.js 以利用我们所展示的一些优势，我们希望为您提供直接支持。请通过 Telegram 联系 [@steveluscher](https://t.me/steveluscher/) 开始对话。
