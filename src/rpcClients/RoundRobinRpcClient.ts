import { RpcClientBase } from "./RpcClientBase";
import type { RpcTransport } from "@solana/web3.js";

export class RoundRobinRpcClient extends RpcClientBase {
  private nextTransport: number = 0;

  protected selectTransport(): RpcTransport {
    const transport = this.transports[this.nextTransport];
    this.nextTransport = (this.nextTransport + 1) % this.transports.length;
    return transport;
  }
}
