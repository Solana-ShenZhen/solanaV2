## 初始化 Solana 客户端

### 1. 创建 Signer

```typescript
const PRIVATE_KEY_BYTES = new Uint8Array([
  // 在此插入您的私钥字节数组
  // 示例: 2, 194, 94, 194, 31, 15, 34, 248, ...
]);

const accountSigner = await createKeyPairSignerFromBytes(PRIVATE_KEY_BYTES);
```

### 2. 声明地址

```typescript
const accountAddress = address("your_address_in_bs58_format");
```

### 3. 创建 RPC 连接

```typescript
const rpc = createSolanaRpc("YOUR_RPC_URL");
const rpcSubscriptions = createSolanaRpcSubscriptions("YOUR_WEBSOCKET_URL");
```

可重用的交易发送函数

```typescript
const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
  rpc, // 发送交易
  rpcSubscriptions, // 订阅交易状态，包括确认，出现错误，或者交易过期
});
```

获取区块哈希作为交易生命周期

```typescript
const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
```
