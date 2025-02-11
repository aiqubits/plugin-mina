import type { Plugin } from "@elizaos/core";
import  transferToken  from "./actions/transfer.ts";
import  getFaucet  from "./actions/getFaucet.ts";
import  checkBalances  from "./actions/checkBalances.ts";
import  batchTransfer  from "./actions/batchTransfer.ts";
import { WalletProvider, walletProvider } from "./providers/wallet.ts";

export {
    WalletProvider,
    transferToken as TransferMinaToken,
    getFaucet as GetMinaFaucet,
    checkBalances as CheckMinaBalances,
    batchTransfer as BatchTransferMinaTokens,
};

export const minaPlugin: Plugin = {
    name: "mina",
    description: "MINA protocol integration plugin for ElizaOS",
    actions: [
        transferToken,
        getFaucet,
        checkBalances,
        batchTransfer,
    ],
    evaluators: [],
    providers: [walletProvider],
};
export default minaPlugin;
