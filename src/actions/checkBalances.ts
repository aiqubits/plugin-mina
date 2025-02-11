// It should get the balance of the the wallet address or specify address.
import {
    type Action,
    ActionExample,
    composeContext,
    Content,
    elizaLogger,
    generateObject,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
} from "@elizaos/core";

import { z } from "zod";
import { TokenId, PublicKey } from "o1js";

import { checkBalancesTemplate } from "../utils/templates";
import { walletProvider, initWalletProvider } from "../providers/wallet";

export { checkBalancesTemplate };

export interface BalanceContent extends Content {
    address: string;
    token: string | null;
}

function isBalanceContent(content: Content): content is BalanceContent {
    elizaLogger.log("Content for Balance", content);
    return typeof content.address === "string";
}

// const BalanceTemplate = `Given the recent messages and wallet information below:

// Example response:
// \`\`\`json
// {
//     "address": "B62qkGSBuLmqYApYoWTmAzUtwFVx6Fe9ZStJVPzCwLjWZ5NQDYTiqEU",
// }
// \`\`\`

// {{recentMessages}}

// {{walletInfo}}

// Extract the following information about the requested Balance request:
// - Address to check balance for.

// Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.`;

export default {
    name: "CHECK_BALANCES",
    similes: ["BALANCE", "GET_BALANCE", "CHECK_BALANCE", "CHECK_BALANCES_AMOUNT"],
    validate: async (_runtime: IAgentRuntime, message: Memory) => {
        elizaLogger.log("Validating mina Balance from user:", message.userId);
        return true;
    },
    description: "Check the balance of the wallet or specify address",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback,
    ): Promise<boolean> => {
        elizaLogger.log("Starting Check Balance handler...");

        const walletInfo = await walletProvider.get(runtime, message, state);
        state.walletInfo = walletInfo;

        // Initialize or update state
        let currentState: State;
        if (!state) {
            currentState = (await runtime.composeState(message)) as State;
        } else {
            currentState = await runtime.updateRecentMessageState(state);
        }

        // Define the schema for the expected output
        const BalanceSchema = z.object({
            address: z.string(),
            token: z.union([z.string(), z.null()]),
        });

        // Compose Balance context
        const BalanceContext = composeContext({
            state: currentState,
            template: checkBalancesTemplate,
        });

        // Generate Balance content with the schema
        const content = await generateObject({
            runtime,
            context: BalanceContext,
            schema: BalanceSchema,
            modelClass: ModelClass.SMALL,
        });

        const BalanceContent = content.object as BalanceContent;

        // Validate Balance content
        if (!isBalanceContent(BalanceContent)) {
            elizaLogger.error("Invalid content for CHECK_BALANCES action.");
            if (callback) {
                callback({
                    text: "Unable to process Balance request. Invalid content provided.",
                    content: { error: "Invalid Balance content" },
                });
            }
            return false;
        }

        try {
            const provider = initWalletProvider(runtime);
            const publicKey = PublicKey.fromBase58(BalanceContent.address);
            let balances: string;
            if (!BalanceContent.token) {
                balances = await provider.getBalances(publicKey);
            } else {
                const tokenId = TokenId.fromBase58(BalanceContent.token);
                balances = await provider.getBalances(publicKey, tokenId);
            }

            elizaLogger.log("Balance successful: ", balances);

            if (callback) {
                if (!BalanceContent.token) {
                    BalanceContent.token = "MINA";
                }

                callback({
                    text: `Balance of ${BalanceContent.address} token: ${BalanceContent.token} is ${balances.toString()}`,
                    content: {
                        success: true,
                        address: BalanceContent.address,
                        balance: balances.toString(),
                    },
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error during token Balance:", error);
            if (callback) {
                callback({
                    text: `Error Balance tokens: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check MINA balance of B62qqfDuhWCLDUp4qjiaE5PfM76qbyJcEbyZWnZ5fb7ZMbxzo1SUgF1",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll help you check MINA balance of B62qqfDuhWCLDUp4qjiaE5PfM76qbyJcEbyZWnZ5fb7ZMbxzo1SUgF1",
                    action: "CHECK_BALANCES",
                    content: {
                        address: "B62qqfDuhWCLDUp4qjiaE5PfM76qbyJcEbyZWnZ5fb7ZMbxzo1SUgF1",
                        token: "mina",
                    },
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "The balance of B62qqffDuhWCLDUp4qjiaE5PfM76qbyJcEbyZWnZ5fb7ZMbxzo1SUgF1 is 200.00",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check my wallet balance on MINA",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll help you check your wallet balance on MINA",
                    action: "CHECK_BALANCES",
                    content: {
                        address: "{{walletAddress}}",
                    },
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "The balance of your wallet on MINA is 200.00",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
