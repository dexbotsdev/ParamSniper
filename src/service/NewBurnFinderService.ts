import { EventEmitter } from 'emitter'
import { Config } from 'types/type';
import { PublicKey } from '@solana/web3.js';
import { findPool } from '../utils/util';
import logger from './Logger';
import TokenCheckService from '../api/TokenCheckService';

class NewBurnFinderService {

    c: Config;
    em: EventEmitter;

    constructor(config: any, em: EventEmitter) {
        this.c = config;
        this.em = em;
    }

    start = () => {

        const connectionH = this.c.connection;
        const pubtok = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')

        try {
            connectionH.onLogs(pubtok, async (logs, ctx) => {


                if (logs.err !== null) return;
                let inc = '';
                let door = '';

                logs.logs.forEach((element: any) => {

                    if (element.indexOf('Burn') > 0) inc = 'open';
                    if (element.indexOf('Swap') > 0 || element.indexOf('JUP') > 0 || element.indexOf('MintTo') > 0 || element.indexOf('reward') > 0 || element.indexOf('Liquidity') > 0 || element.indexOf('USDC') > 0 || element.indexOf('Collect') > 0) inc = 'X';

                    if (inc == 'open' && element.indexOf('CloseAccount') > 0) inc = 'close';
                    if (element.indexOf("calc_exact len:0") > 0 && door == '') {
                        door = 'open';
                    }
                    if (element.indexOf("CloseAccount") > 0 && door == 'open') {
                        door = 'closed';
                    }

                });


                if (inc == 'close') {

                    const testix = await connectionH.getParsedTransaction(logs.signature, {
                        "maxSupportedTransactionVersion": 0,
                        "commitment": 'confirmed'
                    });
                    const isBurnTx: any = testix?.transaction.message.instructions.filter((ix: any) => ix?.parsed?.type == 'burn')



                    if (isBurnTx && isBurnTx.length > 0) {
                        const burnd = isBurnTx[0];



                        const lpMint = new PublicKey(burnd.parsed.info.mint);
                        const burnedAmount = Number(burnd.parsed.info.amount);
                        const poolAccount = await findPool(lpMint);
                        if (poolAccount) {

                            const openTime = new Date(Number(poolAccount.poolOpenTime.toString()) * 1000).toString();
                            logger.info('LP Burned - ' + burnd.parsed.info.mint); 
                            logger.info('Pool Open Time ' + openTime);

                            const analyser = new TokenCheckService(poolAccount.baseMint.toString())
                            const result = await analyser.analyze();

                            if (result) {

                                const signal = { 
                                    totalLPLiquidity: poolAccount.lpReserve.toString(),
                                    tokenSupply: result.tokenSupply,
                                    freezeaBle: result.freezeaBle,
                                    mintable: result.mintable,
                                    tokenName: result.tokenName,
                                    tokenSymbol: result.tokenSymbol,
                                    tokenDecimals: result.tokenDecimals,
                                    quoteMint: result.quoteMint,
                                    quoteSymbol: result.quoteSymbol,
                                    quoteDecimals: result.quoteDecimals,
                                    ammLiquidityPct: result.ammLiquidityPct,
                                    ammLiquidity: result.ammLiquidity,
                                    tokenAddress: result.tokenAddress,
                                    liquidityUSDC: result.liquidityUSDC,
                                    liquiditySOL: result.liquiditySOL,
                                    liquidityToken: result.liquidityToken,
                                    holdersCount: result.holdersCount,
                                    largeHolderPct: result.largeHolderPct,
                                    mutable: result.mutable,
                                    feeModifiable: result.feeModifiable,
                                    poolOpenTime: result.poolOpenTime,
                                    tokenLinks: result.tokenLinks,
                                 }

                                 const poolInfo = {
                                    ...poolAccount,
                                    ...signal
                                 }

                                this.em.emit('newLpBurnedSignal',JSON.stringify(poolInfo));



                            }
                        }


                    }

                }

            });
        } catch (exception) {
            console.log(exception)
        }



    }




}


export default NewBurnFinderService;