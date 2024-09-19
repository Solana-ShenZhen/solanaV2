import { createDefaultRpcTransport, createSolanaRpcFromTransport, type RpcTransport } from "@solana/web3.js";

export abstract class RpcClientBase {
  protected urls: string[];
  protected transports: RpcTransport[];

  constructor() {
    const { urls, transports } = this.createTransports();
    this.urls = urls;
    this.transports = transports;
  }

  private createTransports() {
    const urls = [
      "https://devnet.helius-rpc.com/?api-key=f4c86c47-1d8b-4148-9dc6-d9aa6496f788",
      "https://devnet.helius-rpc.com/?api-key=0422440e-2b28-48a5-8683-fb4de54ee525",
      "https://devnet.helius-rpc.com/?api-key=51c5eb15-f385-4db4-a069-afab91e3f6f5",
      "https://devnet.helius-rpc.com/?api-key=a25f7a3a-ea08-4c29-a7ff-8e34fc201be3",
    ];
    return {
      urls,
      transports: urls.map(url => createDefaultRpcTransport({ url })),
    };
  }

  protected abstract selectTransport(payload: { method: string }): RpcTransport;

  public createClient() {
    const customTransport = async <TResponse>(...args: Parameters<RpcTransport>): Promise<TResponse> => {
      const payload = args[0].payload as { method: string };
      const selectedTransport = this.selectTransport(payload);
      const currentUrl = this.urls[this.transports.indexOf(selectedTransport)];
      console.log(`Using URL: ${currentUrl} for method: ${payload.method}`);
      return (await selectedTransport(...args)) as TResponse;
    };

    return createSolanaRpcFromTransport(customTransport);
  }
}
