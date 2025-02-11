import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { WalletProvider } from "../providers/wallet.ts";

import { defaultCharacter } from "@elizaos/core";
import BigNumber from "bignumber.js";

import { fetchAccount, Mina, PrivateKey } from "o1js";
import { getMinaNeworkCconfig, MINA_DECIMALS } from "../environment";

// Mock NodeCache
vi.mock("node-cache", () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            set: vi.fn(),
            get: vi.fn().mockReturnValue(null),
        })),
    };
});

// Mock path module
vi.mock("path", async () => {
    const actual = await vi.importActual("path");
    return {
        ...actual,
        join: vi.fn().mockImplementation((...args) => args.join("/")),
    };
});

// Mock the ICacheManager
const mockCacheManager = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn(),
    delete: vi.fn(),
};

describe("WalletProvider", () => {
    let walletProvider;
    let mockedRuntime;

    beforeEach(() => {
        vi.clearAllMocks();
        mockCacheManager.get.mockResolvedValue(null);
        // B62qpfDuhWCLDUp4qjiaE5PfM76qbyJcEbyZWnZ5fb7ZMbxzo1SUgF1
        const minaPrivatekey = PrivateKey.fromBase58("EKET3uAZbM4Q8aRYbxG9EbJijp6NmNf9uSErdRf9e9w9TjfWcK9W");
        const minaPublickey = minaPrivatekey.toPublicKey();
        const minaAddress = minaPublickey.toBase58();

        const network = Mina.Network({
            mina: getMinaNeworkCconfig("").baseUrl,
            archive: getMinaNeworkCconfig("").archive
        });
        Mina.setActiveInstance(network);

        console.log(`minaAddress: ${minaAddress}`);

        // Create new instance of TokenProvider with mocked dependencies
        walletProvider = new WalletProvider(
            minaPrivatekey,
            mockCacheManager
        );

        mockedRuntime = {
            character: defaultCharacter,
        };
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    describe("Wallet Integration", () => {
        it("should check wallet address", async () => {
            const result =
                await walletProvider.getFormattedPortfolio(mockedRuntime);

            const prices = await walletProvider.fetchPrices();

            const senderAccount = await fetchAccount({ publicKey: walletProvider.publicKey });
            const accountDetails = senderAccount.account;
            const totalMina =  accountDetails?.balance.toString() || "0";
            // const minaAmount = Number.parseInt(totalMina) / Number(MINA_DECIMALS);

            const minaAmount = new BigNumber(Number.parseInt(totalMina))
                .div(new BigNumber(10).pow(MINA_DECIMALS))
                .toFixed(4);

            console.log(
                `Using the fee payer account ${walletProvider.address} with nonce: ${
                    accountDetails?.nonce
                } and balance: ${minaAmount}.`
            );

            const totalUsd = new BigNumber(minaAmount)
                .times(prices.mina.usd)
                .toFixed(4);

            expect(result).toEqual(
                `Eliza\nWallet Address: ${walletProvider.address}\n` +
                    `Total Value: $${totalUsd} (${minaAmount} Mina)\n`
            );
        });
    });
});
