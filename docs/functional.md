# @solana/functional

这个包包含了通用的函数式编程辅助工具和特定于 Solana 应用组件的函数式辅助工具。它可以独立使用，但也作为 Solana JavaScript SDK [`@solana/web3.js@rc`](https://github.com/solana-labs/solana-web3.js/tree/master/packages/library) 的一部分导出。

## 函数

### `pipe()`

在 [pipe 操作符](https://github.com/tc39/proposal-pipeline-operator) 成为 JavaScript 的一部分之前，你可以使用这个工具来创建管道。

```ts
const add = (a, b) => a + b;
const add10 = x => add(x, 10);
const add100 = x => add(x, 100);
const sum = pipe(1, add10, add100);
sum === 111; // true
```

管道是对一个值使用函数执行连续操作的一种解决方案，例如在构建交易时你会这样做。

```ts
const transferTransactionMessage = pipe(
  // 第一个表达式的结果...
  createTransactionMessage({ version: 0 }),
  // ...作为唯一参数传递给管道中的下一个函数。
  tx => setTransactionMessageFeePayer(myAddress, tx),
  // 该函数的返回值传递给下一个...
  tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  // ...以此类推。
  tx =>
    appendTransactionMessageInstruction(
      createTransferInstruction(myAddress, toAddress, amountInLamports),
      tx,
    ),
);
```
