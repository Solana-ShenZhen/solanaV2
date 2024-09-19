import { RpcClientBase } from "./RpcClientBase";
import type { RpcTransport } from "@solana/web3.js";

export class ShardedRpcClient extends RpcClientBase {
  private methodMap: { [key: string]: number };

  constructor() {
    super();
    this.methodMap = {
      getAccountInfo: 0,
      getBalance: 0,
      getTransaction: 1,
      getLatestBlockhash: 1,
      sendTransaction: 2,
    };
  }

  protected selectTransport(payload: { method: string }): RpcTransport {
    return this.transports[this.methodMap[payload.method] ?? 3];
  }
}
