import { EventEmitter } from 'emitter'
import fs from 'fs'
import logger from './service/Logger';
import { sequelize, TradeLogs } from './database/db';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { getWalletTokenBalance } from './utils/util';
import NewBurnFinderService from './service/NewBurnFinderService';
import { connection, MAINNET_API_HTTP, MAINNET_AUTH_HEADER } from './settings';
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { HttpProvider } from '@bloxroute/solana-trader-client-ts';
import { requestConfig } from './config';
import TradeService from './service/TradeService';
import { Config } from 'types/type';
import allLogger from './service/allLogger';
import tradeLogger from './service/tradeLogger';

const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(999);

async function start() {
  await sequelize.sync({ force: false, alter: true });
  fs.readFile('./client.config.json', 'utf8', (error: any, data) => {
    if (error) {
      logger.debug(error);
      return;
    }
    let config :Config= JSON.parse(data);
    let testmode = Boolean(config.testMode);
    const wallet = Keypair.fromSecretKey(Uint8Array.from(config.privateKey));
    const provider = new HttpProvider(
      MAINNET_AUTH_HEADER,
      bs58.encode(config.privateKey),
      MAINNET_API_HTTP,
      requestConfig
    )

    let openTrades=0;

    if (testmode) logger.warning('RUNNING IN TEST MODE, NO TRADES WILL BE TAKEN');

    config.connection = connection;
    config.wallet = wallet;

    const burnFinder = new NewBurnFinderService(config, eventEmitter);
    const trader = new TradeService(config, provider, wallet);

    burnFinder.start();

    eventEmitter.on('newListener', (event: string, listener: any) => {
      logger.debug(`Added  listener for ${event.toUpperCase()} .`);
    });

    eventEmitter.on('buyOrderCompleted', async (monitor: any) => {

      logger.sponsor(JSON.stringify(monitor,null,0));
      const tokenMint = new PublicKey(monitor.tokenAddress);
      let tokenBalance = await getWalletTokenBalance(connection, wallet.publicKey, tokenMint);

      if(config.testMode==true){
        const resp = await trader.getBuyPrice(monitor.tokenAddress, config.buyInputAmount,config.slippageFixed);
        tokenBalance = resp.outAmount.toFixed();
      }

      logger.info('Current Token Balance is '+ tokenBalance);
      const avgBuyPrice = Number(Number(config.buyInputAmount)/Number(tokenBalance)).toFixed(12);

      monitor.avgBuyPrice = avgBuyPrice;
      monitor.tokenBalance = tokenBalance;
 
      const tokenTrades = new TradeLogs(monitor);
      await tokenTrades.save();
    
       logger.debug(' Keep Polling for Prices and Sell off ')

       trader.monitorToken(monitor)


    })
    eventEmitter.on('newLpBurnedSignal', async (signal: any) => {
      logger.error('Received ');
      const tradeSignal = JSON.parse(signal);

       const oldSignal = await TradeLogs.findOne({
        where: {
          tokenAddress: tradeSignal.tokenAddress
        }
      })
      let tokenTrade = {
        tokenSymbol: tradeSignal.tokenSymbol,
        tokenAddress: tradeSignal.tokenAddress,
        buyTime: Date.now(),
        buyAmount: config.buyInputAmount,
        sellTime: null,
        sellAmount: 0,
        sold: false,
        avgBuyPrice: 0
      }

      allLogger.info('New Token',JSON.stringify(tokenTrade));
      
      if (oldSignal && oldSignal.dataValues && oldSignal.dataValues.tokenAddress && !testmode) {
        logger.error('skipping Duplicates')
      } else {


        try {
          const pot = new Date(Number(tradeSignal.poolOpenTime) * 1000);
          const nowd = Date.now();

          if (nowd < pot.getTime()) {
            logger.debug('Pool is Not Yet Opened for Trading ');
            return;

          }
          const mcCheck = Number(config.minLiquidity) <= Number(tradeSignal.liquiditySOL) ? 'OK' : 'Failed Liquidity Check of ' + Number(config.minLiquidity) + ' SOLS';
          const fdvCheck = Number(tradeSignal.liquidityUSDC) >= Number(config.maxTokenMC) ? 'OK' : ' Failed Mcap check of ' + Number(config.maxTokenMC) + ' ';
          const mintableCheck = !tradeSignal.mintable ? 'OK' : ' Failed Mintable Check : Token is Mintable ';
          const freeZableCheck = !tradeSignal.freezeaBle ? 'OK' : ' Failed Freezable Check : Token is Freezable ';
          const linksCheck = tradeSignal.tokenLinks && tradeSignal.tokenLinks>1 ? 'OK' : ' Failed Token Links Check : Token Doesnt Have Links' ;

          if (mcCheck == 'OK' && fdvCheck == 'OK' && mintableCheck == 'OK' && freeZableCheck == 'OK' && linksCheck=='OK') {
            logger.debug(' Preparing Token Info for Buy/sell ' + tradeSignal.tokenSymbol + ' with 0.01 ' + tradeSignal.quoteSymbol);

            if(openTrades >= config.maxOpenTrades){

              logger.debug('MAX Open Trades Reached cannot Open more trades ');
              return false;

            }

            openTrades++
            logger.debug(' Buying Token ' + tradeSignal.tokenSymbol + ' with ' + config.buyInputAmount);
            try {
              logger.debug(' Buying Token ' + tradeSignal.tokenSymbol + ' with  '+config.buyInputAmount+' ' + tradeSignal.quoteSymbol);

              trader.buyToken(tradeSignal.tokenAddress, config.buyInputAmount, config.slippageFixed,config.testMode).then(async (result) => {



                 logger.debug('Token Bought -- Checking Transaction - Create Websocket and Listen.')

                if(config.testMode){
                  const monitor = {
                    tokenAddress: tradeSignal.tokenAddress,
                    tokenSymbol: tradeSignal.tokenSymbol,
                    decimals: tradeSignal.tokenDecimals,
                    tnxSignature: result
                  }

                 
                  tradeLogger.info('Traded  Token',JSON.stringify(tokenTrade));
                  eventEmitter.emit('buyOrderCompleted', monitor);
                } else

                connection.onSignature(result, (sigresult) => {
                  logger.debug('Listening to Data ')

                  if (sigresult.err == null) {

                    logger.debug('Emitting Token Data for Sell Monitoring ')
                    const monitor = {
                      tokenAddress: tradeSignal.tokenAddress,
                      tokenSymbol: tradeSignal.tokenSymbol,
                      decimals: tradeSignal.tokenDecimals,
                      tnxSignature: result
                    }

                   
                    tradeLogger.info('Traded  Token',JSON.stringify(tokenTrade));
                    eventEmitter.emit('buyOrderCompleted', monitor);
                  }
                })
              }).catch((Error) => {

                console.log('Buy Failed ' + Error);
              })

            } catch (error) {
              logger.error(error)
            }
          } else {

            logger.error('Liquidity Check :- ' + mcCheck + ' Actual ' + Number(tradeSignal.liquiditySOL).toFixed(2));
            logger.error('Mcap check :-  ' + fdvCheck + ' Actual ' + Number(tradeSignal.liquidityUSDC).toFixed(2));
            logger.error('Mintable check :-  ' + mintableCheck + ' Actual ' + tradeSignal.mintable);
            logger.error('Freezable check  :- ' + freeZableCheck + ' Actual ' + tradeSignal.freezeaBle);
            logger.error('Token Links check  :- ' + linksCheck + ' Actual ' + tradeSignal.tokenLinks);
          }
        } catch (error) {
          logger.debug(error)
        }
      }

    });


    eventEmitter.on('Disconnected', (message: string) => {
      logger.debug('Disconnected -- need to restart ' + message.toUpperCase());
      eventEmitter.removeAllListeners();
      start();

    });





  })
}

start();



