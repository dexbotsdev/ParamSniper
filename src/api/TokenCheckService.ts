import { Connection, PublicKey } from '@solana/web3.js';
import { RAYDIUM, } from '../config';
import logger from '../service/Logger';
import { Metaplex } from '@metaplex-foundation/js';
import { WSOL ,LIQUIDITY_STATE_LAYOUT_V4} from '@raydium-io/raydium-sdk';
import axios from 'axios';
import { connectionD as connection } from '../settings';

class TokenCheckService {
    private async _analyseMarket(result: any, i: number): Promise<any> {
        //@ts-ignore
        this.markets[i].data = LIQUIDITY_STATE_LAYOUT_V4.decode(this.markets[i].account.data);
        const validMints = {
            "So11111111111111111111111111111111111111112": true,
            "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": true,
        }
        validMints[this.mint] = true
        //@ts-ignore
        const md = this.markets[i].data


        this.result.poolOpenTime=md.poolOpenTime.toString();

        
        //@ts-ignore
        this.markets[i].lp = await this._analyseLP(result, md.baseVault, md.quoteVault, md.baseMint, md.quoteMint, md.lpMint, md.lpReserve)

    }
    private async _analyseLP(result: { totalLPLiquidity: number; transferFee: { pct: any; maxAmount: any; authority: any; }; tokenSupply: string; freezeAuth: boolean; mintAuthority: boolean; tokenName: string; tokenSymbol: string; tokenDecimals: number; quoteMint: string; quoteSymbol: string; quoteDecimals: number; ammLiquidityPct: number; ammLiquidity: string; base: string; liquidityUSDC: number; liquiditySOL: number; holdersCount: number; largeHolderPct: number; mutable: boolean; }, baseVault: any, quoteVault: any, baseMint: any, quoteMint: any, lpMint: any, lpReserve: any): Promise<any> {
        const quoteLiq = await this.connection.getTokenAccountBalance(quoteVault, "confirmed")
        const baseLiq = await this.connection.getTokenAccountBalance(baseVault, "confirmed")
        const quotePrice = await this.getPrice(quoteMint, result)

        const holders = await this.connection.getTokenLargestAccounts(lpMint, "confirmed")

        const topHolders = holders.value
        //this.result.holdersCount = topHolders.length;
        this.result.quoteMint = quoteMint.toString(),
            this.result.liquidityToken = baseLiq.value.uiAmount!,
            this.result.liquidityUSDC = (quoteLiq.value.uiAmount! * quotePrice);
        this.result.liquiditySOL = quoteLiq.value.uiAmount;
    }
    async getPrice(quoteMint: any, result: { totalLPLiquidity: number; transferFee: { pct: any; maxAmount: any; authority: any; }; tokenSupply: string; freezeAuth: boolean; mintAuthority: boolean; tokenName: string; tokenSymbol: string; tokenDecimals: number; quoteMint: string; quoteSymbol: string; quoteDecimals: number; ammLiquidityPct: number; ammLiquidity: string; base: string; liquidityUSDC: number; liquiditySOL: number; holdersCount: number; largeHolderPct: number; mutable: boolean; }) {
        if (quoteMint.toString() === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v") {
            this.result.quoteSymbol = 'USDC';
            return 1;
        } else if (quoteMint.toString() == WSOL.mint) {
            this.result.quoteSymbol ='SOL';
            this.result.quoteDecimals = WSOL.decimals;
        }

        const resp = await axios.get(`https://price.jup.ag/v4/price?ids=${quoteMint}`)
        const priceData: any = resp.data;
        if (!priceData?.data[quoteMint.toString()]?.price) {
            return 0
        }
        return priceData.data[quoteMint.toString()].price
    }

    tokenType: any;
    token: any;
    tokenMint: string;
    formatter: any;
    mint: any;
    knownAccounts: any;
    connection: Connection;

    result: {
        poolOpenTime: any;
        feeModifiable: boolean;
        totalLPLiquidity: number;
        tokenSupply: string;
        freezeaBle: boolean;
        mintable: boolean;
        tokenName: string;
        tokenSymbol: string;
        tokenDecimals: number;
        quoteMint: string;
        quoteSymbol: string;
        quoteDecimals: number;
        ammLiquidityPct: number;
        ammLiquidity: string;
        tokenAddress: string;
        liquidityUSDC: number;
        liquiditySOL: number;
        liquidityToken: number;
        holdersCount: number;
        largeHolderPct: number;
        mutable: boolean;
        tokenLinks:number;

    }
    lockerOwners: Map<string, boolean> = new Map([
        ["vestwXyjHjcaqbTwNXSyn5HKMt6U3D5NcfdjQHJWVyG", true],
        ["beamazjPnFT3JQoe16HjUxkpmHFfsHY6dTqf3VwBXzq", true],
        ["1ockKL5chR89E4K576QfJP6jeW9v5cNoPjxKyZmJ7us", true],
        ["USRfPB8M8pfbrFnEt3FDf3Y8ZmU4G17wcRsWBUK416m", true],
        ["RESWbt45deYa8F7mQ53pGGJ3XECYC15EGK7cM738mrN", true]
    ]);
    topHolders: any;
    markets: Readonly<{ account: import("@solana/web3.js").AccountInfo<Buffer>; pubkey: PublicKey; }>[];
    totalLPLiquidity = 0;


    constructor(tokenAddress: string) {
        this.tokenMint = tokenAddress;
        this.connection = connection;
        this.mint = new PublicKey(tokenAddress);
        this.knownAccounts = JSON.parse('{"5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1":{"name":"Raydium AMM","type":"AMM"},"CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK":{"name":"Raydium CLAMM","type":"AMM"},"CPK8fQYShAmERZmysQRAGWPvV5qs3AvazQsiR9ctC6ED":{"name":"Raydium CLAMM LP","type":"AMM"},"whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc":{"name":"Orca Whirlpool","type":"AMM"},"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v":{"name":"USDC","type":"token"},"USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX":{"name":"USDH","type":"token"},"So11111111111111111111111111111111111111112":{"name":"SOL","type":"token"},"4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R":{"name":"Raydium","type":"token"},"beamazjPnFT3JQoe16HjUxkpmHFfsHY6dTqf3VwBXzq":{"name":"FluxBeam LP","type":"AMM"},"USRfPB8M8pfbrFnEt3FDf3Y8ZmU4G17wcRsWBUK416m":{"name":"FluxBot User Rewards","type":"AMM"},"RESWbt45deYa8F7mQ53pGGJ3XECYC15EGK7cM738mrN":{"name":"FluxBot Reserves","type":"AMM"}}')
        this.result = {
            totalLPLiquidity: 0,
            tokenSupply: '',
            freezeaBle: true,
            mintable: true,
            tokenName: '',
            tokenSymbol: '',
            tokenDecimals: 0,
            quoteMint: '',
            quoteSymbol: '',
            quoteDecimals: 0,
            ammLiquidityPct: 0,
            ammLiquidity: '',
            tokenAddress: this.tokenMint,
            liquidityUSDC: 0,
            liquiditySOL: 0,
            liquidityToken: 0,
            holdersCount: 0,
            largeHolderPct: 0,
            mutable: true,
            feeModifiable: false,
            poolOpenTime:0,
            tokenLinks:0
        };

    }

    async analyseToken() {
        if (!this.token) {
            logger.error("No token found on chain");
            return
        }

        if (this.token.freezeAuthority !== null && this.token.freezeAuthority.toString() !== "11111111111111111111111111111111") {
            this.result.freezeaBle = true;
        } else if (this.token.freezeAuthority == null) {
            this.result.freezeaBle = false;
        }
        if (this.token.mintAuthority !== null && this.token.mintAuthority.toString() !== "11111111111111111111111111111111") {
            const authority = await this.connection.getParsedAccountInfo(new PublicKey(this.token.mintAuthority), "confirmed")
            if (!authority.value) {
                logger.error("Authority account does not exist")
            } else if (this.lockerOwners.get(authority.value!.owner!.toString())) {
                //@ts-ignore
                this.result.mintable = false
            } else {
                this.result.mintable = true;
            }
        } else if (this.token.mintAuthority == null) {
            this.result.mintable = false;
        }


        const metaplex = Metaplex.make(this.connection);
        const token = await metaplex.nfts().findByMint({ mintAddress: this.mint }); 
 
        if(token.json){
            const extensions:any = token.json.extensions
            if(extensions){
                if(extensions.twitter)this.result.tokenLinks++;
                if(extensions.telegram)this.result.tokenLinks++;
                if(extensions.website)this.result.tokenLinks++;
            }
        }

        const desc= token.json ? token.json.description :''; 
        if(desc.indexOf('t.me'))this.result.tokenLinks++;
        if(desc.indexOf('.com'))this.result.tokenLinks++; 
        if(desc.indexOf('.xyz'))this.result.tokenLinks++; 
        if(desc.indexOf('.wtf'))this.result.tokenLinks++; 
        if(desc.indexOf('x.com'))this.result.tokenLinks++; 
 
        this.result.tokenName = token.name; 
        this.result.tokenSymbol = token.symbol;
        this.result.tokenSupply = token.mint.supply.basisPoints.toString();
        this.result.tokenDecimals = token.mint.decimals;

        return this.result;

    }

    getToken(mint: any) {
        return this.connection.getParsedAccountInfo(mint, "confirmed");
    }


    getResults() {
        return this.result;
    }
    analyze = async () => {
        const tokenData = await this.getToken(this.mint)
        //@ts-ignore
        this.tokenType = tokenData.value?.data?.program
        //@ts-ignore
        this.token = tokenData?.value?.data.parsed?.info as Mint

        await this.analyseToken();

        // this.token?.extensions?.forEach(ext => {
        //      this._analyseExtension(ext, this.result)
        // })

        const topHolders = await this.connection.getTokenLargestAccounts(this.mint, "confirmed")
        this.topHolders = topHolders.value
        // this.mylog("topHolders", this.topHolders)


        const holderKeys:  PublicKey[] = []
        this.topHolders.forEach((h: { address: PublicKey; }) => holderKeys.push(h.address))
        const accountInfo = await this.connection.getMultipleParsedAccounts(holderKeys)

 

        //@ts-ignore
        accountInfo.value.forEach((a, k) => {

            try {
                 // console.log(this.topHolders[k]);
                 //console.log(a.data);
                //@ts-ignore
                this.topHolders[k].data = a.data?.parsed
            } catch (Error) {
                 logger.error('Minor Calculation Error')
            }


        })

        console.log('calling analyze holders ');
        this._analyseHolders()

        const rayMarkets = await this.getRaydiumMarkets(this.mint)


        rayMarkets.forEach((m: any) => {
            //@ts-ignore
            m.marketType = "raydium"
        })
        this.markets = rayMarkets;
        this.result.totalLPLiquidity = 0
        const promises = [];
        for (let i = 0; i < this.markets.length; i++) {
            promises.push(this._analyseMarket(this.result, i))
        }

        const results = await Promise.all(promises);
        for (let i = 0; i < results.length; i++) {
            //@ts-ignore
            this.result.totalLPLiquidity += results[i]
        }
        
        //@ts-ignore
        this.markets = this.markets.filter(f => f.lp)
 
        let totalLPHolders = 0;
        for (let i = 0; i < this.markets.length; i++) {
            const mkt = this.markets[i]
            //@ts-ignore 
            if (!this.markets[i].lp || !mkt.lp?.quoteUSD)
                continue //We dont have market info
            //@ts-ignore 
            this.markets[i].lp.pctSupply = (mkt.lp.quoteUSD / this.result.totalLPLiquidity) * 100
            //@ts-ignore
            totalLPHolders += mkt.lp.holders.length

 
        } 

        return this.result;

    }




    _analyseHolders() {
        const total_supply = Number(this.token.supply)

         let top10 = 0;
        let total = 0;
        let maxpct = 0;
        let maxholder='';
        this.topHolders.forEach(((h, key) => {

            //@ts-ignore
            const pct = (h.amount / total_supply) * 100 

            this.result.holdersCount = this.result.holdersCount+1;

 
            
            //@ts-ignore
            const known = this.knownAccounts[h.data?.info.owner.toString() || h.address.toString()]
             if (known && known.type == 'AMM') {
                this.result.ammLiquidityPct = pct;
                this.result.ammLiquidity = h.amount;
            }    
            if(pct>maxpct){ 
                maxpct= pct;
                maxholder=h.data?.info.owner.toString()  
                this.result.largeHolderPct += Number(maxpct);

            }
            if (key < 10 && (!known || known.type !== 'AMM')) {
                top10 += pct
                total += pct
            }
        }))

        return this.result;
    }


    async getRaydiumMarkets(mint: any) {
        const markets = await this.connection.getProgramAccounts(RAYDIUM, {
            commitment: "confirmed",
            filters: [
                {
                    memcmp: {
                        offset: (30 * 8) + 64 + 32 + 64, //BaseMint
                        bytes: this.tokenMint.toString()
                    }
                }
            ]
        })


        const inverseMarkets = await this.connection.getProgramAccounts(RAYDIUM, {
            commitment: "confirmed",
            filters: [
                {
                    memcmp: {
                        offset: (30 * 8) + 64 + 32 + 64 + 32, //QuoteMint
                        bytes: this.tokenMint.toString()
                    }
                }
            ]
        })


        return markets.concat(...inverseMarkets)
    }
    // _analyseExtension(ext: any, result: any) {
    //     switch (ext.extension) {
    //         case "transferFeeConfig":

    //             this.result.transferFee = {
    //                 pct: ext.state.newerTransferFee.transferFeeBasisPoints,
    //                 maxAmount: ext.state.newerTransferFee.maximumFee,
    //                 authority: ext.state.transferFeeConfigAuthority,
    //             }



    //             if (ext.state.transferFeeConfigAuthority)
    //                 this.result.feeModifiable=true;
    //             break
    //     }
    // }

}


export default TokenCheckService;