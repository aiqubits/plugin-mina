import {
    IAgentRuntime,
} from "@elizaos/core";
import { PrivateKey } from "o1js";
import { MinaNetwork, DEFAULT_NETWORK } from "../environment";

export function verifyWalletParams(runtime: IAgentRuntime): [string, string, PrivateKey] {
    const privateKey = runtime.getSetting("MINA_PRIVATE_KEY");
    if (!privateKey) {
        throw new Error("MINA_PRIMATE_KEY is not configured");
    }

    if (!privateKey.startsWith("EK") || privateKey.length !== 52) {
        throw new Error("Invalid MINA_PRIMATE_KEY format");
    }
    let minaNetName: string;
    if (!runtime.getSetting("MINA_NETWORK")) {
        minaNetName = DEFAULT_NETWORK;
    } else {
        minaNetName = runtime.getSetting("MINA_NETWORK") as MinaNetwork;
    }

    let minaRpcUrl = runtime.getSetting("MINA_RPC_URL");

    if (minaRpcUrl) {
        minaNetName = "localnet";
    } else {
        minaRpcUrl = "ptth";
    }

    const pk = PrivateKey.fromBase58(privateKey);

    return [minaNetName, minaRpcUrl, pk];
}
