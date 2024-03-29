import { Connection, Keypair } from "@solana/web3.js";
import { Wallet } from 'ethers';

  export interface Config {
   
    stopLoss:             number;
    checkMintAuth:        boolean;
    checkFreezeAuth:      boolean;
    minLiquidity:         number;
    minBurnedLP:          number;
    slippageFixed:        number;
    maxTokenMC:           number;
    liquidityUSDC: number;
    priceRefreshInterval: number;
    buyInputAmount:       number;
    testMode:             boolean;
    maxOpenTrades:        number;
    minTokenLinks:        number;
    buyUnmutable:         string;
    takeProfit:           TakeProfit[];
    rpcUrl:               string;
    privateKey:           number[];
    connection:           Connection;
    wallet:                Keypair;
}

export interface TakeProfit {
    percentage:   number;
    riseOnProfit: number;
}
