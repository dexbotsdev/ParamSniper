import axios from 'axios'
import { Wallet, ethers ,parseUnits,JsonRpcProvider ,Interface} from 'ethers'
import moment from 'moment' 




export const processMessage = async(message: { message: any })=>{

    if(message && message.message){
            const text = message.message;

 
            const addressInmessage = parseAddress(text); 

            if(addressInmessage){

                const data = await getPairData(addressInmessage);
 
                if(data.tokenAddress && data.tokenAge && data.currPrice && data.tokenSymbol && data.tokenMC){ 
                    return data;
                }
            } else return null;

    }
    

}


export const parseAddress= (text: any)=>{
    const ethereumAddressRegex = /0x[a-fA-F0-9]{40}/g;

    // Extract Ethereum addresses using the regular expression
    const ethereumAddresses = text.match(ethereumAddressRegex);
    

    if(ethereumAddresses)
    return ethereumAddresses[0];
    else return null;

}


export const getPairData = async (address: any)=>{

    const url = `https://api.dexscreener.com/latest/dex/search?q=${address}`; 
    const result = await axios.get(url).then(res=>res).catch(()=>null);

    if(result && result.data && result.data.pairs){

        const resp = {
            tokenAddress : result.data.pairs[0]?.baseToken.address,
            baseAddress : result.data.pairs[0]?.quoteToken.address,
            pairAddress : result.data.pairs[0]?.pairAddress, 
            tokenSymbol: result.data.pairs[0]?.baseToken.symbol,
            tokenName: result.data.pairs[0]?.baseToken.name,
            tokenAge: result.data.pairs[0]?.pairCreatedAt,
            tokenMC:result.data.pairs[0]?.fdv,
            liquidity:result.data.pairs[0]?.liquidity.quote,
            currPrice: result.data.pairs[0]?.priceNative,
            chainId: result.data.pairs[0]?.chainId,
            dex: result.data.pairs[0]?.dexId, 
            pairCreatedAt: result.data.pairs[0]?.pairCreatedAt,
            priceChange: result.data.pairs[0]?.priceChange,     
        }
  

        return resp;
    } else return null;
}