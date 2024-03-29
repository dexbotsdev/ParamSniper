import {web3} from "@project-serum/anchor";
import {blob, struct, u8} from "@solana/buffer-layout";
import {publicKey, u64} from "@solana/buffer-layout-utils";

export interface FluxbeamPool {
	version: number;
	isInitialized: number;
	bumpSeed: number;
	poolTokenProgramId: web3.PublicKey;
	tokenAccountA: web3.PublicKey;
	tokenAccountB: web3.PublicKey;
	lpMint: web3.PublicKey;
	baseMint: web3.PublicKey;
	quoteMint: web3.PublicKey;
	feeAccount: web3.PublicKey;
	tradeFeeNumerator: bigint,
	tradeFeeDenominator: bigint,
	ownerTradeFeeNumerator: bigint,
	ownerTradeFeeDenominator: bigint,
	ownerWithdrawFeeNumerator: bigint,
	ownerWithdrawFeeDenominator: bigint,
	hostFeeNumerator: bigint,
	hostFeeDenominator: bigint,
	curveType: number,
	curveParameters: Uint8Array,
}

export const FluxbeamPoolLayout = struct<FluxbeamPool>([
	u8('version'),
	u8('isInitialized'),
	u8('bumpSeed'),
	publicKey('poolTokenProgramId'),
	publicKey('tokenAccountA'),
	publicKey('tokenAccountB'),
	publicKey('lpMint'),
	publicKey('baseMint'),
	publicKey('quoteMint'),
	publicKey('feeAccount'),
	u64('tradeFeeNumerator'),
	u64('tradeFeeDenominator'),
	u64('ownerTradeFeeNumerator'),
	u64('ownerTradeFeeDenominator'),
	u64('ownerWithdrawFeeNumerator'),
	u64('ownerWithdrawFeeDenominator'),
	u64('hostFeeNumerator'),
	u64('hostFeeDenominator'),
	u8('curveType'),
	blob(32, 'curveParameters'),
]);