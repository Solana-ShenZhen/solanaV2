import { createDefaultRpcTransport, createSolanaRpcFromTransport, type RpcTransport } from "@solana/web3.js";

function createTransports() {
  const urls = [
    "https://devnet.helius-rpc.com/?api-key=f4c86c47-1d8b-4148-9dc6-d9aa6496f788",
    "https://devnet.helius-rpc.com/?api-key=0422440e-2b28-48a5-8683-fb4de54ee525",
    "https://devnet.helius-rpc.com/?api-key=51c5eb15-f385-4db4-a069-afab91e3f6f5",
    "https://devnet.helius-rpc.com/?api-key=a25f7a3a-ea08-4c29-a7ff-8e34fc201be3"
  ];
  return {
    urls,
    transports: urls.map(url => createDefaultRpcTransport({ url })),
  };
}

function selectShard(method: string, transports: RpcTransport[]): RpcTransport {
  const methodMap: { [key: string]: number } = {
    getAccountInfo: 0,
    getBalance: 0,
    getTransaction: 1,
    getRecentBlockhash: 1,
    sendTransaction: 2
  };
  return transports[methodMap[method] ?? 3];
}

export function createRoundRobinRpcClient() {
  const { urls, transports } = createTransports();
  let nextTransport = 0;

  async function roundRobinTransport<TResponse>(...args: Parameters<RpcTransport>): Promise<TResponse> {
    const transport = transports[nextTransport];
    const currentUrl = urls[nextTransport];
    console.log(`Using URL: ${currentUrl}`);
    nextTransport = (nextTransport + 1) % transports.length;
    return await transport(...args);
  }

  return createSolanaRpcFromTransport(roundRobinTransport);
}

export function createShardedRpcClient() {
  const { urls, transports } = createTransports();

  async function shardingTransport<TResponse>(...args: Parameters<RpcTransport>): Promise<TResponse> {
    const payload = args[0].payload as { method: string };
    const selectedTransport = selectShard(payload.method, transports);
    const currentUrl = urls[transports.indexOf(selectedTransport)];
    console.log(`Using URL: ${currentUrl} for method: ${payload.method}`);
    return await selectedTransport(...args) as TResponse;
  }

  return createSolanaRpcFromTransport(shardingTransport);
}