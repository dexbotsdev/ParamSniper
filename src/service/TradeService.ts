import { HttpProvider } from "@bloxroute/solana-trader-client-ts";
import { Wallet } from "@project-serum/anchor";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import logger from "./Logger";
import { connection } from "../settings";
import { Config } from "types/type";
import { clearInterval } from "timers";

class TradeService {

    provider: HttpProvider;
    c: Config;
    w: Keypair;

    constructor(_config: any, provider: HttpProvider, wallet: Keypair) {

        this.provider = provider;
        this.c = _config;
        this.w = wallet;
    }

    getBuyPrice = async (_tokenAddress: any, inAmount: number, slippage: number) => {

        const response = await this.provider.postRaydiumSwap({
            ownerAddress: this.w.publicKey.toBase58(),
            inToken: "SOL",
            outToken: _tokenAddress,
            inAmount: inAmount,
            slippage: slippage,
        })
        return response;

    }

    getSellAmount = async (_tokenAddress: any, inAmount: number, slippage: number) => {

        const response = await this.provider.postRaydiumSwap({
            ownerAddress: this.w.publicKey.toBase58(),
            inToken: _tokenAddress,
            outToken: "SOL",
            inAmount: inAmount,
            slippage: slippage,
        }).catch((error) => { 
            return null;
        }) 
        return response;

    }

    getSellPrice = async (_tokenAddress: any, slippage: number) => {


        const response = await this.provider.getRaydiumQuotes({
            inToken: _tokenAddress,
            outToken: "SOL",
            inAmount: 1,
            slippage: slippage,
        }).catch((error) => {
            console.log(String(error));
            return null;
        })
        return response;

    }
    buyToken = async (_tokenAddress: any, _buyInputAmount: number, _slippage: number, testMode: Boolean) => {


        if (Boolean(testMode)) return 'true';

        const response = await this.provider.postRaydiumSwap({
            ownerAddress: this.w.publicKey.toBase58(),
            outToken: _tokenAddress,
            inToken: "SOL",
            inAmount: _buyInputAmount,
            slippage: _slippage,
        })

        const buff = Buffer.from(response.transactions[0].content, "base64");
        const solanaTx = VersionedTransaction.deserialize(buff)
        // Deserialize the transaction
        solanaTx.sign([this.w]);
        const sendm = await connection.sendTransaction(solanaTx, {
            skipPreflight: false,
            preflightCommitment: 'recent',
        });

        console.log(sendm);


        return sendm;

    }




    monitorToken(monitor: any) {

        const buyTime = monitor.buyTime;
        let sellAmnts = [];
        sellAmnts[0] = monitor.tokenBalance * this.c.takeProfit[0].percentage / 100;
        sellAmnts[1] = monitor.tokenBalance * this.c.takeProfit[1]?.percentage / 100;
        sellAmnts[2] = monitor.tokenBalance * this.c.takeProfit[2]?.percentage / 100;

        const runId = setInterval(async () => {
            try {
                logger.info('Balance Of Token   is ' + Number(monitor.tokenBalance).toFixed(2));

                const sellbalance = Number(monitor.tokenBalance) / (10 ** monitor.decimals)
                const possibleAmnt = await this.getSellPrice(monitor.tokenAddress, this.c.slippageFixed);

                if (!possibleAmnt) {
                    logger.error(' Possible Error getting Quotes, sell it Privately')
                    clearInterval(runId);
                    return;
                }

                logger.warning('Token Price of ' + monitor.tokenSymbol + " : " + possibleAmnt.routes[0].outAmount)
                const returns = Number(possibleAmnt.routes[0].outAmount) * sellbalance
                logger.info('Current Return Value ' + returns.toFixed(6))

                const profit = (Number(returns) - Number(this.c.buyInputAmount)) * 100 / Number(this.c.buyInputAmount);

                logger.info(' Running Profits/Losses for Token ' + monitor.tokenSymbol + ' is ' + Number(profit).toFixed(2) + ' %');

                if (Number(profit) > Number(this.c.takeProfit) || Number(profit) <= -Number(this.c.stopLoss)) {
                    let tokenSell = false;

                    let sellAmnt = 0;
                    let sellPct = 0;
                    if (Number(profit) <= -Number(this.c.stopLoss)) {
                        logger.info('SELLING TOKEN FOR MEETING STOPLOSS');
                        tokenSell = true;
                        sellPct = 100;
                    }

                    if (Number(profit) > Number(this.c.takeProfit[0].riseOnProfit)) {
                        logger.info('SELLING TOKEN FOR MEETING TAKEPROFIT');

                        tokenSell = true;
                        sellAmnt = sellAmnts[0]
                    }
                    if (Number(profit) > Number(this.c.takeProfit[1].riseOnProfit)) {
                        logger.info('SELLING TOKEN FOR MEETING TAKEPROFIT');

                        tokenSell = true;
                        sellAmnt = sellAmnts[1]
                    }
                    if (Number(profit) > Number(this.c.takeProfit[2].riseOnProfit)) {
                        logger.info('SELLING TOKEN FOR MEETING TAKEPROFIT');

                        tokenSell = true;
                        sellAmnt = sellAmnts[2]
                    }

                    if (tokenSell && !this.c.testMode) {
                        const sellTokenAmnt = await this.getSellAmount(monitor.tokenAddress, sellAmnt, this.c.slippageFixed);

                        if (sellAmnt) {
                            const buff = Buffer.from(sellTokenAmnt.transactions[0].content, "base64");
                            const solanaTx = VersionedTransaction.deserialize(buff)

                            // Deserialize the transaction
                            solanaTx.sign([this.w]);
                            const sendm = await connection.sendTransaction(solanaTx, {
                                skipPreflight: false,
                                preflightCommitment: 'recent',
                            });
                            console.log(sendm);
                        }

                    }

                    if (this.c.testMode) {
                        tokenSell = true;
                        sellAmnt = sellAmnts[2]
                    }

                    if (tokenSell && sellAmnt == sellAmnts[2]) {
                        clearInterval(runId)
                    }

                }


            } catch (error) {
                console.log(error);
            }


        }, this.c.priceRefreshInterval * 1000);




    }





}


export default TradeService;