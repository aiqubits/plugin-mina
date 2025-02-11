// It should transfer tokens from the agent's wallet to multiple recipients.
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

import * as path from "path";
import { z } from "zod";
import { AccountUpdate, fetchAccount, Mina, PublicKey, UInt64 } from "o1js";

import { walletProvider, initWalletProvider } from "../providers/wallet";
import { transactionFee, MINA_DECIMALS } from "../environment";
import { batchTransferTemplate } from "../utils/templates";

export { batchTransferTemplate };

export interface TransferContent extends Content {
    recipient: Array<string>;
    amount: string | number;
}

function isTransferContent(content: Content): content is TransferContent {
    elizaLogger.log("Content for batch transfer", content);
    return (
        typeof content.recipient === "object" &&
        (typeof content.amount === "string" ||
            typeof content.amount === "number")
    );
}

function retainFirstConsecutiveNumbers(input: string): string {
    const match = input.match(/^\d+/);
    return match ? match[0] : "";
}

export default {
    name: "SEND_BATCH_MINA_TOKEN",
    similes: [
        "TRANSFER_BATCH_TOKEN",
        "TRANSFER_BATCH_TOKENS",
        "SEND_BATCH_TOKEN",
        "SEND_BATCH_TOKENS",
        "SEND_BATCH_MINA",
        "BATCH_PAY",
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        elizaLogger.log("Validating Mina token batch transfer from user:", message.userId);
        //add custom validate logic here
        /*
            const adminIds = runtime.getSetting("ADMIN_USER_IDS")?.split(",") || [];
            //elizaLogger.log("Admin IDs from settings:", adminIds);

            const isAdmin = adminIds.includes(message.userId);

            if (isAdmin) {
                //elizaLogger.log(`Authorized transfer from user: ${message.userId}`);
                return true;
            }
            else
            {
                //elizaLogger.log(`Unauthorized transfer attempt from user: ${message.userId}`);
                return false;
            }
            */
        return true;
    },
    description: "Transfer tokens from the agent's wallet to multiple addresses",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log("Starting SEND_BATCH_MINA_TOKEN handler...");

        const walletInfo = await walletProvider.get(runtime, message, state);
        state.walletInfo = walletInfo;

        // Initialize or update state
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        // Define the schema for the expected output
        const transferSchema = z.object({
            recipient: z.array(z.string()),
            amount: z.string() || z.number(),
        });

        // Compose transfer context
        const transferContext = composeContext({
            state,
            template: batchTransferTemplate,
        });

        // Generate transfer content with the schema
        const content = await generateObject({
            runtime,
            context: transferContext,
            schema: transferSchema,
            modelClass: ModelClass.SMALL,
        });

        const transferContent = content.object as TransferContent;

        // Validate transfer content
        if (!isTransferContent(transferContent)) {
            elizaLogger.error("Invalid content for TRANSFER_BATCH_MINA_TOKEN action.");
            if (callback) {
                callback({
                    text: "Unable to process batch transfer requests. Invalid content provided.",
                    content: { error: "Invalid batch transfer content" },
                });
            }
            return false;
        }

        try {
            const provider = initWalletProvider(runtime);
            const privateKey = provider.privateKey;
            const publicKey = provider.publicKey;
            const senderAddress = provider.address;

            const senderAccount = await fetchAccount({ publicKey: publicKey });
            if (senderAccount.error && senderAccount.error.statusCode != 404) {
                elizaLogger.error(`network issue when fetchAccount: ${senderAddress}, please check your network connection!`);
                throw new Error("network issue when fetchAccount: ${senderAddress},please check your network connection!");
            }
            let nonce = Number(senderAccount.account!.nonce.toString());
            const recipientAddress: string[] = transferContent.recipient;
            const amountNumber = retainFirstConsecutiveNumbers(transferContent.amount.toString()).trim();

            for (let i = 0; i < recipientAddress.length; i++) {
                const recipient = PublicKey.fromBase58(recipientAddress[i]);
                const recipientAccount = await fetchAccount({ publicKey: recipient });

                if (recipientAccount.error && recipientAccount.error.statusCode != 404) {
                    elizaLogger.error(`network issue when fetchAccount: ${recipientAddress}, please check your network connection!`);
                    throw new Error(`network issue when fetchAccount: ${recipientAddress}, please check your network connection!`);
                }

                const sendAmount = UInt64.from(amountNumber).mul(Math.pow(10, MINA_DECIMALS));
                let fee: number;
                if (await provider.getNetName(runtime) == "devnet") {
                    fee = Math.imul(transactionFee, 90);
                }
                const tx = await Mina.transaction({
                    sender: publicKey,
                    fee: fee,
                    memo: 'ElizaOS Mina Plugin @aiqubits',
                    nonce: nonce
                }, async () => {
                    if (!recipientAccount.account) {
                        throw new Error(`recipient account not found: ${recipientAddress}, you need to create the account first!`);
                        // AccountUpdate.fundNewAccount(publicKey);// 需要为新账户创建而花费1MINA
                    }
                    const senderAcctUpt = AccountUpdate.createSigned(publicKey);
                    senderAcctUpt.send({ to: recipient, amount: sendAmount });
                });

                const signTx = tx.sign([privateKey]);
                const hashTx = await signTx.send();
                elizaLogger.log("Transfer successful:", hashTx.hash);

                nonce++
            }

            const zktxsUrl = path.join(await provider.getBaseAccountUrl(runtime), provider.address, "/zk-txs");
            elizaLogger.log(`zktxsUrl: ${zktxsUrl}`);
            if (callback) {
                callback({
                    text: `Successfully transferred ${transferContent.amount} to ${recipientAddress}, Click to view historical transactions: ${zktxsUrl}`,
                    content: {
                        success: true,
                        zktxsUrl: zktxsUrl,
                        amount: transferContent.amount,
                        recipient: recipientAddress,
                    },
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error during token batch transfer:", error);
            if (callback) {
                callback({
                    text: `Error batch transferring tokens: ${error.message}`,
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
                    text: "Send 1 MINA tokens to [B62qnzai52aKJQFjmfwSRaAHCJWPRpbQmczrEp6T5r7tjwn6RcUvapi,B62qoK2E55aZKaCjVRGxwJ2XJUoZduq8xphTDLEEK7hTZpLHXBa48b3]",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll now send 1 MINA tokens to multiple addresses...",
                    action: "SEND_BATCH_MINA_TOKEN",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Successfully sent 1 MINA tokens to multiple addresses, Transaction record: https://minascan.io/devnet/account/B62qpfDuhWCLDUp4qjiaE5PfM76qbyJcEbyZWnZ5fb7ZMbxzo1SUgF1/zk-txs",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
