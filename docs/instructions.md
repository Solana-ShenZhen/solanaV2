# @solana/instructions

这个包包含了创建交易指令的类型。它可以独立使用，但也作为 Solana JavaScript SDK [`@solana/web3.js@rc`](https://github.com/solana-labs/solana-web3.js/tree/master/packages/library) 的一部分导出。

## 类型

### `AccountRole`

账户参与交易的目的由 `AccountRole` 类型描述。参与交易的每个账户都可以被读取，但只有标记为可写的账户才能被写入，只有指定必须签名的账户才能在运行时获得与签名者相关的特权。

|                               | `isSigner` | `isWritable` |
| ----------------------------- | ---------- | ------------ |
| `AccountRole.READONLY`        | &#x274c;   | &#x274c;     |
| `AccountRole.WRITABLE`        | &#x274c;   | &#x2705;     |
| `AccountRole.READONLY_SIGNER` | &#x2705;   | &#x274c;     |
| `AccountRole.WRITABLE_SIGNER` | &#x2705;   | &#x2705;     |

### `IAccountMeta<TAddress>`

这个类型表示一个账户的地址以及关于其可变性和是否必须是交易签名者的元数据。

通常，你会使用它的子类型之一。

|                                   | `role`                        | `isSigner` | `isWritable` |
| --------------------------------- | ----------------------------- | ---------- | ------------ |
| `ReadonlyAccount<TAddress>`       | `AccountRole.READONLY`        | &#x274c;   | &#x274c;     |
| `WritableAccount<TAddress>`       | `AccountRole.WRITABLE`        | &#x274c;   | &#x2705;     |
| `ReadonlySignerAccount<TAddress>` | `AccountRole.READONLY_SIGNER` | &#x2705;   | &#x274c;     |
| `WritableSignerAccount<TAddress>` | `AccountRole.WRITABLE_SIGNER` | &#x2705;   | &#x2705;     |

例如，你可以这样定义租金系统变量账户的类型：

```ts
type RentSysvar =
  ReadonlyAccount<"SysvarRent111111111111111111111111111111111">;
```

### `IAccountLookupMeta<TAddress, TLookupTableAddress>`

这个类型表示在地址查找表中查找账户地址。它指定了在哪个查找表账户中执行查找，所需账户地址在该表中的索引，以及关于其可变性的元数据。值得注意的是，通过查找获得的账户地址不能作为签名者。

通常，你会使用它的子类型之一。

|                                                        | `role`                 | `isSigner` | `isWritable` |
| ------------------------------------------------------ | ---------------------- | ---------- | ------------ |
| `ReadonlyLookupAccount<TAddress, TLookupTableAddress>` | `AccountRole.READONLY` | &#x274c;   | &#x274c;     |
| `WritableLookupAccount<TAddress, TLookupTableAddress>` | `AccountRole.WRITABLE` | &#x274c;   | &#x2705;     |

例如，你可以这样定义在查找表中查找的租金系统变量账户的类型：

```ts
type RentSysvar = ReadonlyLookupAccount<
  "SysvarRent111111111111111111111111111111111",
  "MyLookupTable111111111111111111111111111111"
>;
```

### `IInstruction<TProgramAddress>`

使用这个类型来指定发送给特定程序的指令。

```ts
type StakeProgramInstruction =
  IInstruction<"StakeConfig11111111111111111111111111111111">;
```

### `IInstructionWithAccounts<TAccounts>`

使用这个类型来指定包含特定账户的指令。

```ts
type InstructionWithTwoAccounts = IInstructionWithAccounts<
  [
    WritableAccount, // 第一个账户
    RentSysvar, // 第二个账户
  ]
>;
```

### `IInstructionWithData<TData>`

使用这个类型来指定数据符合特定类型的指令。这在你有一个代表特定指令的品牌化 `Uint8Array` 时最有用。

例如，这里是 `AdvanceNonce` 指令的类型定义方式。

```ts
type AdvanceNonceAccountInstruction<
  TNonceAccountAddress extends string = string,
  TNonceAuthorityAddress extends string = string,
> = IInstruction<"11111111111111111111111111111111"> &
  IInstructionWithAccounts<
    [
      WritableAccount<TNonceAccountAddress>,
      ReadonlyAccount<"SysvarRecentB1ockHashes11111111111111111111">,
      ReadonlySignerAccount<TNonceAuthorityAddress>,
    ]
  > &
  IInstructionWithData<AdvanceNonceAccountInstructionData>;
```

## 函数

### `isSignerRole(role: AccountRole)`

如果给定的 `AccountRole` 表示签名者的角色，则返回 `true`。同时还会细化所提供角色的 TypeScript 类型。

### `isWritable(role: AccountRole)`

如果给定的 `AccountRole` 表示可写账户的角色，则返回 `true`。同时还会细化所提供角色的 TypeScript 类型。

### `mergeRoles(roleA: AccountRole, roleB: AccountRole)`

给定两个 `AccountRoles`，将返回授予两者最高权限的 `AccountRole`。

示例：

```ts
// 返回 `AccountRole.WRITABLE_SIGNER`
mergeRoles(AccountRole.READONLY_SIGNER, AccountRole.WRITABLE);
```

### `downgradeRoleToNonSigner(role: AccountRole)`

返回表示所提供角色的非签名者变体的 `AccountRole`。

### `downgradeRoleToReadonly(role: AccountRole)`

返回表示所提供角色的非可写变体的 `AccountRole`。

### `upgradeRoleToSigner(role: AccountRole)`

返回表示所提供角色的签名者变体的 `AccountRole`。

### `upgradeRoleToWritable(role: AccountRole)`

返回表示所提供角色的可写变体的 `AccountRole`。
