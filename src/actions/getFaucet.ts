// It should call mina.faucet() function to send some test tokens to the recipient.
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
import { Mina, PublicKey } from "o1js";

import { getfaucetTemplate } from "../utils/templates";
import { walletProvider } from "../providers/wallet";
import { MinaNetwork } from "../environment";

export { getfaucetTemplate };

export interface FaucetContent extends Content {
    recipient: string;
    network: string | null;
}

function isFaucetContent(content: Content): content is FaucetContent {
    elizaLogger.log("Content for faucet", content);
    return typeof content.recipient === "string";
}

export default {
    name: "GET_FAUCET_TOKENS",
    similes: [
        "FAUCET",
        "GET_TEST_TOKENS",
        "GET_MINA_FROM_FAUCET",
        "GET_MINA_TESTNET_TOKENS",
        "GET_MINA_DEVNET_FAUCET"
    ],
    validate: async (_runtime: IAgentRuntime, message: Memory) => {
        elizaLogger.log("Validating mina Faucet from user:", message.userId);
        return true;
    },
    description: "Get test tokens from the faucet",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback,
    ): Promise<boolean> => {
        elizaLogger.log("Starting Get FAUCET handler...");

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
        const FaucetSchema = z.object({ recipient: z.string() });

        // Compose Faucet context
        const FaucetContext = composeContext({
            state: currentState,
            template: getfaucetTemplate,
        });

        // Generate Faucet content with the schema
        const content = await generateObject({
            runtime,
            context: FaucetContext,
            schema: FaucetSchema,
            modelClass: ModelClass.SMALL,
        });

        const FaucetContent = content.object as FaucetContent;

        // Validate Faucet content
        if (!isFaucetContent(FaucetContent)) {
            elizaLogger.error("Invalid content for GET_FAUCET_TOKENS action.");
            if (callback) {
                callback({
                    text: "Unable to process Faucet request. Invalid content provided.",
                    content: { error: "Invalid faucet content" },
                });
            }
            return false;
        }

        try {
            const recipient = PublicKey.fromBase58(FaucetContent.recipient);
            let faucetNet = FaucetContent.network as MinaNetwork;
            if (!faucetNet) {
                faucetNet = "devnet"
            }
            await Mina.faucet(recipient, faucetNet);

            elizaLogger.log("Faucet successful");

            if (callback) {
                callback({
                    text: `Successfully Get Faucet 300 MINA to ${FaucetContent.recipient}`,
                    content: {
                        success: true,
                        recipient: FaucetContent.recipient,
                        amount: 300,
                    },
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error during token Faucet:", error);
            if (callback) {
                callback({
                    text: `Error Faucet tokens: ${error.message}`,
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
                    text: "Get some MINA Tokens from the faucet to B62qpfDuhWCLDUp4qjiaE5PfM76qbyJcEbyZWnZ5fb7ZMbxzo1SUgF1",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Sure, I'll request some MINA Tokens from the faucet to B62qpfDuhWCLDUp4qjiaE5PfM76qbyJcEbyZWnZ5fb7ZMbxzo1SUgF1",
                    action: "GET_FAUCET_TOKENS",
                    content: {
                        recipient: "B62qpfDuhWCLDUp4qjiaE5PfM76qbyJcEbyZWnZ5fb7ZMbxzo1SUgF1",
                        network: "devnet",
                    },
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Get some test tokens from the Mina faucet",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Of course, getting MINA from the Mina faucet now.",
                    action: "GET_FAUCET_TOKENS",
                    content: {
                        recipient: "{{walletAddress}}",
                        network: "devnet",
                    },
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
