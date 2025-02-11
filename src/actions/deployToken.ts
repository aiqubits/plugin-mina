import {
    type Action,
    type ActionExample,
    composeContext,
    Content,
    elizaLogger,
    generateObject,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    ModelClass,
    type State,
} from "@elizaos/core";
import { z } from "zod";
import { AccountUpdate, Bool, fetchAccount, Mina, PrivateKey, PublicKey, TokenId, UInt64, UInt8 } from "o1js"
import { equal } from "node:assert"

import { initWalletProvider } from "../providers/wallet";
import { transactionFee, tokenCodeUrl } from "../environment";
import { deployTemplate } from "../utils/templates";

import { FungibleToken } from "../utils/minaFungibleToken";
import { FungibleTokenAdmin } from "../utils/minaFungibleTokenAdmin";

export { deployTemplate };

interface DeployTokenContent extends Content {
    symbol: string;
    decimal: string;
    recipient: string;
    src: string;
    tokenSecretkey: string;
    adminSecretkey: string;
    initialSupply: string
}

export function isDeployTokenContent(content: DeployTokenContent) {
    // Validate types
    const validTypes =
        typeof content.symbol === "string" &&
        typeof content.decimal === "string" &&
        typeof content.src === "string" &&
        typeof content.recipient === "string" &&
        typeof content.initialSupply === "string";
    if (!validTypes) {
        return false;
    }

    // Validate addresses (must be 32-bytes long with 0x prefix)
    const validAddresses =
        content.symbol.length > 2 &&
        Number.parseInt(content.initialSupply) > 0 &&
        content.recipient.startsWith("B6") &&
        content.recipient.length === 55;

    return validAddresses;
}

export const deployToken: Action = {
    name: "DEPLOY_MINA_TOKEN",
    similes: [
        "DEPLOY_MINA_MEME_TOKEN",
        "DEPLOY_MINA_COIN",
        "CREATE_MINA_COIN",
        "DEPLOY_MEME_COIN",
        "CREATE_MEME_COIN",
        "DEPLOY_FUNGIBLE_TOKEN",
        "CREATE_FUNGIBLE_TOKEN",
        "CREATE_TOKEN",
        "DEPLOY_TOKEN",
        "DEPLOY_COIN",
        "CREATE_COIN",
    ],
    // validate: async (runtime: IAgentRuntime, _message: Memory) => {
    //     await verifyWalletParams(runtime);
    //     return true;
    // },
    description:
        "Deploy a Meme Coin on MINA. Use this action when a user asks you to deploy a new token on MINA.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log(
            "Starting DEPLOY_MINA_TOKEN handler..."
        );
        // Fix: Create new variable instead of reassigning parameter
        let currentState = state;
        if (!currentState) {
            currentState = (await runtime.composeState(message)) as State;
        } else {
            currentState = await runtime.updateRecentMessageState(currentState);
        }

        // Define the schema for the expected output
        const transferSchema = z.object({
            symbol: z.string(),
            decimal: z.string(),
            recipient: z.string(),
            initialSupply: z.string(),
            tokenCodeURL: z.string(),
            tokenAdminSecretKey: z.string(),
            tokenSecretKey: z.string()
        });

        const deployContext = composeContext({
            state: currentState,
            template: deployTemplate,
        });

        // Generate transfer content with the schema
        const response = await generateObject({
            runtime,
            context: deployContext,
            schema: transferSchema,
            modelClass: ModelClass.MEDIUM,
        });

        const deployTokenContent = response.object as DeployTokenContent;

        elizaLogger.log(`init supply. ${deployTokenContent.initialSupply}`);

        if (!isDeployTokenContent(deployTokenContent)) {
            callback?.({
                text: "Invalid deployment content, please try again.",
            });
            return false;
        }

        try {

            const provider = initWalletProvider(runtime);
            const feePayerPrivateKey = provider.privateKey;
            const feePayerPublicKey = provider.publicKey;
            const recipientPublicKey = PublicKey.fromBase58(deployTokenContent.recipient);

            elizaLogger.log("FungibleTokenAdmin.compile...")
            await FungibleTokenAdmin.compile();
            elizaLogger.log("FungibleToken.compile...")
            await FungibleToken.compile();

            // Generate a new key pair as the token Key
            const tokenContractKey = PrivateKey.randomKeypair();
            const adminContractKey = PrivateKey.randomKeypair();
            elizaLogger.log('tokenContractKey: ', tokenContractKey, 'tokenContract addr:', tokenContractKey.publicKey);
            elizaLogger.log('adminContractKey: ', adminContractKey, 'adminContract addr:', adminContractKey.publicKey);

            const token = new FungibleToken(tokenContractKey.publicKey)
            const tokenId = TokenId.derive(tokenContractKey.publicKey);// 计算出tokenId
            const tokenAddress = tokenId.toString();

            const adminContract = new FungibleTokenAdmin(adminContractKey.publicKey)

            let fee: number;
            if (await provider.getNetName(runtime) == "devnet") {
                fee = Math.imul(transactionFee, 90);
            }
            elizaLogger.log("Deploying token contract...")
            const deployTx = await Mina.transaction({
                sender: feePayerPublicKey,
                fee: transactionFee,
            }, async () => {
                AccountUpdate.fundNewAccount(feePayerPublicKey, 3)
                await adminContract.deploy({ adminPublicKey: adminContractKey.publicKey })//!! make adminContract account as the token Manager !!
                await token.deploy({
                    symbol: deployTokenContent.symbol,
                    src: tokenCodeUrl,
                    allowUpdates: true,
                })
                await token.initialize(
                    adminContractKey.publicKey,
                    UInt8.from(Number(deployTokenContent.decimal)),
                    // We can set `startPaused` to `Bool(false)` here, because we are doing an atomic deployment
                    // If you are not deploying the admin and token contracts in the same transaction,
                    // it is safer to start the tokens paused, and resume them only after verifying that
                    // the admin contract has been deployed
                    Bool(false),
                )
            })

            await deployTx.prove()
            deployTx.sign([feePayerPrivateKey, tokenContractKey.privateKey, adminContractKey.privateKey])
            const deployTxResult = await deployTx.send().then((v) => v.wait())
            elizaLogger.log("Deploy tx result:", deployTxResult.toPretty())
            equal(deployTxResult.status, "included")

            await fetchAccount({ publicKey: feePayerPublicKey });
            await fetchAccount({ publicKey: tokenContractKey.publicKey });
            await fetchAccount({ publicKey: tokenContractKey.publicKey, tokenId });
            await fetchAccount({ publicKey: adminContractKey.publicKey });

            elizaLogger.log("Minting tokens to recipientAddress")
            const mintTx = await Mina.transaction({
                sender: feePayerPublicKey,
                fee,
            }, async () => {
                AccountUpdate.fundNewAccount(feePayerPublicKey, 1)
                await token.mint(recipientPublicKey, new UInt64(deployTokenContent.initialSupply))
            })
            await mintTx.prove()
            mintTx.sign([feePayerPrivateKey, adminContractKey.privateKey])
            const mintTxResult = await mintTx.send().then((v) => v.wait())
            elizaLogger.log("Mint tx result:", mintTxResult.toPretty())
            equal(mintTxResult.status, "included")

            await fetchAccount({ publicKey: feePayerPublicKey });
            await fetchAccount({ publicKey: tokenContractKey.publicKey });
            await fetchAccount({ publicKey: tokenContractKey.publicKey, tokenId });
            await fetchAccount({ publicKey: adminContractKey.publicKey });
            await fetchAccount({ publicKey: recipientPublicKey, tokenId });

            elizaLogger.log(
                `Token deployment initiated for: ${deployTokenContent.symbol} at address: ${tokenAddress}`
            );

            callback?.({
                text: `Token Deployment completed successfully! ${deployTokenContent.symbol} at address: ${tokenAddress}`,
            });

            return true;
        } catch (error) {
            elizaLogger.error("Error during token deployment:", error);
            callback?.({
                text: `Error during deployment: ${error.message}`,
                content: { error: error.message },
            });
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Deploy a new token called TokenFounder, with the recipient being B62qoK2E55aZKaCjVRGxwJ2XJUoZduq8xphTDLEEK7hTZpLHXBa48b3, with an initial supply of 100000000 on Mina",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Ok, I'll deploy the Lords token to Mina...",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Deploy the MEME coin to Mina",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Ok, I'll deploy your coin on Mina...",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Create a new coin on Mina",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Ok, I'll create a new coin for you on Mina...",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;