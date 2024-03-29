import { QueryTypes } from "sequelize";
import {   sequelize } from "./db";
import { EventEmitter } from 'emitter'
import { getPairData } from "../processor/TokenProcessor";


export const callUniqueTokens24HrsMoreThanOneCall=async (eventEmitter: EventEmitter)=>{

    const result=[];
   const data =  await sequelize.query(
         `SELECT tokenAddress, count(tokenAddress) as tcx
         from TokenCalls tc 
         group by tokenAddress 
         having createdAt >=datetime("now" , "-24 hours")  
         and count(tokenAddress)>1`,
        { 
          type: QueryTypes.SELECT
        }
      );

 
      data.forEach(async (item : any)=>{

        let response={

            tokenName: item.tokenName,
            tokenAddress:item.tokenAddress,
            symbol:item.tokenSymbol,
            callCount:0,
            calls:[]


        }
        const tokenAddress = item.tokenAddress;

        const tokenDetails = await sequelize.query(
            `select callerTG , tokenName,tokenSymbol, tokenAddress, min(tokenMC) as mcap,count(*) as calls 
            from TokenCalls tc 
            group by callerTG ,tokenAddress
            having tokenAddress =?`,
            {
                replacements:[tokenAddress],
                type:QueryTypes.SELECT
            }
        )

        response.calls=tokenDetails; 

        tokenDetails.forEach((x:any)=>{
            response.callCount+=Number(x.calls);
        })
 
        eventEmitter.emit('24hourlyStats',JSON.stringify(response));


      })



}

export const getTokenStats=async (tradingSignal:any)=>{
 
      let response={ 
          callCount:0,
          calls:[]  
      }

     
      

      const tokenDetails:any = await sequelize.query(
          `select callerTG ,channelName,isAlpha,athROI, callerPostId, tokenName,tokenSymbol,callerPostId, tokenAddress,currPrice,callTime, min(tokenMC) as mcap,count(*) as calls 
          from TokenCalls tc 
          group by callerTG ,tokenAddress
          having tokenAddress =? order by mcap `,
          {
              replacements:[tradingSignal.tokenAddress],
              type:QueryTypes.SELECT
          }
      )

      tokenDetails.url = tradingSignal.url; 


      response.calls=tokenDetails; 

      tokenDetails.forEach((x:any)=>{
          response.callCount+=Number(x.calls); 

          if(Number(tradingSignal.currPrice)>Number(x.currPrice))
            {
                const roi= Number(((tradingSignal.currPrice-x.currPrice)/x.currPrice)*100).toFixed(2)
                x.athROI = roi;

                // TokenCalls.update({ athROI: roi }, {
                //     where: {
                //         tokenAddress: x.tokenAddress,
                //     },
                //   });

            }  
      })
 

      return response;


}