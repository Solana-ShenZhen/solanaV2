import { ShardedRpcClient } from "./ShardedRpcClient";
import { RoundRobinRpcClient } from "./RoundRobinRpcClient";

export const shardedRpcClient = new ShardedRpcClient();
export const roundRobinRpcClient = new RoundRobinRpcClient();

export { ShardedRpcClient, RoundRobinRpcClient };
