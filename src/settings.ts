import {Connection} from '@solana/web3.js';


export const SOL_RPC='https://mango.rpcpool.com/946ef7337da3f5b8d3e4a34e7f88'
export const connection = new Connection(SOL_RPC,{commitment:'confirmed'});

//https://go.getblock.io/7810682975124f6fa51b35867a9a7ee2
//https://go.getblock.io/8f85bb1581c142d39eb4fddb51bdc2e6
//https://mango.rpcpool.com/946ef7337da3f5b8d3e4a34e7f88

export const DECODER_RPC='http://122.176.151.75:8899'
export const connectionD = new Connection(SOL_RPC,{commitment:'confirmed'});

export const MAINNET_API_HTTP = 'https://uk.solana.dex.blxrbdn.com'
export const MAINNET_API_WS = 'wss://uk.solana.dex.blxrbdn.com/ws'
export const MAINNET_API_GRPC_HOST = 'uk.solana.dex.blxrbdn.com'
export const MAINNET_API_GRPC_PORT = 443
export const MAINNET_AUTH_HEADER ='ODAzNjVjNTMtZjI0YS00NDQyLThjZWYtNDQxYWM1ZDk3MmQyOjU3YTkzNGZmMTFlZWQxMzU4YWNhZmFkYjkwMmYzZTJl'
