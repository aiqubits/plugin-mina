export const MINA_DECIMALS = 9;
export const transactionFee = 0.01 * 1e9; // 0.01 MINA fee
export const fetchMinaUsdtUrl = "https://www.okx.com/api/v5/market/ticker?instId=MINA-USDT"
export const tokenCodeUrl = "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts"
export type MinaNetwork = "mainnet" | "devnet" | "zekonet" | "localnet" | "";

export function getMinaNeworkCconfig(
    netName: string
) {
    switch (netName) {
        case 'devnet':
        case '':
            return {
                baseUrl: 'https://api.minascan.io/node/devnet/v1/graphql',
                archive: 'https://api.minascan.io/archive/devnet/v1/graphql',
                explorerAccountUrl: "https://minascan.io/devnet/account/",
                explorerTransactionUrl: "https://minascan.io/devnet/tx/",
                explorerTokenUrl: "https://minascan.io/devnet/token/"
                };
        case 'mainnet':
            return {
                baseUrl: 'https://api.minascan.io/node/mainnet/v1/graphql',
                archive: 'https://api.minascan.io/archive/mainnet/v1/graphql',
                explorerAccountUrl: "https://minascan.io/mainnet/account/",
                explorerTransactionUrl: "https://minascan.io/mainnet/tx/",
                explorerTokenUrl: "https://minascan.io/mainnet/token/"
                };
        case 'zekonet':
            return {
                baseUrl: 'https://devnet.zeko.io/graphql',
                archive: 'https://devnet.zeko.io/graphql',
                explorerAccountUrl: "https://zekoscan.xyz/testnet/account/",
                explorerTransactionUrl: "https://zekoscan.xyz/testnet/tx/",
                explorerTokenUrl: "https://zekoscan.xyz/testnet/token/"
            };
        case 'localnet':
            return {
                baseUrl: 'http://localhost:3085/graphql',
                archive: 'http://localhost:3085/graphql',
                explorerAccountUrl: 'http://localhost:3085/account/',
                explorerTransactionUrl: 'http://localhost:3085/tx/',
                explorerTokenUrl: 'http://localhost:3085/token/'
            };
        default:
            throw new Error('Invalid MINA_NETWORK');
    }
};
export const DEFAULT_NETWORK = 'devnet';
