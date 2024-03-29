import { ENDPOINT as _ENDPOINT, MAINNET_PROGRAM_ID, RAYDIUM_MAINNET, TxVersion, LOOKUP_TABLE_CACHE, Token, TOKEN_PROGRAM_ID, WSOL } from "@raydium-io/raydium-sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import { AxiosRequestConfig } from "axios";
export const PROGRAMIDS = MAINNET_PROGRAM_ID;
export const ENDPOINT = _ENDPOINT;
export const RAYDIUM_MAINNET_API = RAYDIUM_MAINNET;
export const makeTxVersion = TxVersion.V0; // LEGACY 
export const addLookupTableInfo = LOOKUP_TABLE_CACHE
const httpTimeout = 30_000


export const DEFAULT_TOKEN = {
    'USDC': new Token(TOKEN_PROGRAM_ID, new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), 6, 'USDC', 'USDC'),
    'SOL': new Token(TOKEN_PROGRAM_ID, new PublicKey(WSOL.mint), 9, 'SOL', 'SOL'),
}
export const RAYDIUM = new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8")
export const OPENBOOK = new PublicKey("srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX") 
export const requestConfig: AxiosRequestConfig = {
    timeout: httpTimeout,
}
 



