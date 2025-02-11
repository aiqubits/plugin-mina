# @elizaos/plugin-mina

MINA protocol integration plugin for ElizaOS that enables wallet management, transfer and batch transfer capabilities, check one address balances, get faucet, deploy any token, and so on.

## Overview

This plugin provides functionality to:

- Manage wallet interactions with the Mina network
- Execute secure token transfers and batch transfer to multiple addresses
- Get test tokens from the Mina faucet
- Query the balance of a certain address and wallet balances
- Track token prices and valuations
- Format and cache transaction data
- Interface with MINA blockchain via RPC endpoints
- Deploy and interact with smart contracts(FT, NFT...) on the Mina network

## Installation

```bash
pnpm install @elizaos/plugin-mina
```

## Configuration

The plugin requires environment variables or runtime settings:

```env
MINA_PRIVATE_KEY=your_wallet_private_key        # Required - wallet private key
MINA_NETWORK=mainnet|devnet|testnet|localnet    # Optional - defaults to devnet
MINA_RPC_URL=your_rpc_endpoint                  # Optional - defaults to devnet RPC. if provided, will override MINA_NETWORK
MINA_PUBLIC_KEY=your_wallet_public_key          # Optional - defaults to public key derived from private key
```

## Usage

### Registering the Plugin

Import and register the plugin in your Eliza configuration:

```typescript
import { minaPlugin } from "@elizaos/plugin-mina";

export default {
    plugins: [minaPlugin],
    // ... other configuration
};
```

### WalletProvider

The `WalletProvider` manages wallet interactions with the Mina network, including balance queries and portfolio tracking

```typescript
import { WalletProvider } from "@elizaos/plugin-mina";

// Initialize the provider
const provider = await initWalletProvider(runtime);

// Get formatted portfolio
const portfolio = await provider.getFormattedPortfolio(runtime);

// Get wallet balance
const balance = await provider.getBalances(publicKey, tokenId);

// Get basic transaction URL
const txUrl = provider.getTransactionURL(runtime);

// Get basic account URL
const txUrl = provider.getBaseAccountUrl(runtime);

// Get network name
const netName = provider.getNetName(runtime);
```

### TransferAction

The `TransferAction` handles token transfers:

```typescript
import { TransferAction } from "@elizaos/plugin-mina";

// Initialize transfer action
const action = new TransferAction(walletProvider);

// Execute transfer
const hash = await action.transfer({
    recipient: "B62qoK2E55aZKaCjVRGxwJ2XJUoZduq8xphTDLEEK7hTZpLHXBa48b3",
    amount: "5",
});
```

### Send Mina Token

Transfer MINA tokens to another address:

```typescript
// Example conversation
User: "Send 5 MINA to B62qoK2E55aZKaCjVRGxwJ2XJUoZduq8xphTDLEEK7hTZpLHXBa48b3";
Assistant: "I'll send 1 MINA token now...";
```

### Check Balances

Query wallet balance and portfolio value:

```typescript
// Example conversation
User: "Check MINA balance of B62qqfDuhWCLDUp4qjiaE5PfM76qbyJcEbyZWnZ5fb7ZMbxzo1SUgF1";
Assistant: "The balance of B62qqffDuhWCLDUp4qjiaE5PfM76qbyJcEbyZWnZ5fb7ZMbxzo1SUgF1 is 200.00";
```

### Get Faucet

Request test tokens from the Mina faucet:

```typescript
// Example conversation
User: "Get some MINA Tokens from the faucet to B62qpfDuhWCLDUp4qjiaE5PfM76qbyJcEbyZWnZ5fb7ZMbxzo1SUgF1";
Assistant: "Sure, I can provide you with 300 test tokens...";
```

### Batch Transactions

Transfer tokens from the agent's wallet to multiple recipients:

```typescript
// Example conversation
User: "Send 1 MINA tokens to [B62qnzai52aKJQFjmfwSRaAHCJWPRpbQmczrEp6T5r7tjwn6RcUvapi,B62qoK2E55aZKaCjVRGxwJ2XJUoZduq8xphTDLEEK7hTZpLHXBa48b3]";
Assistant: "Sure, I can do that for you...";
```

### Deploy Token

Deploy a new Token on the Mina network:

```typescript
// Example conversation
User: "Deploy a new Token on the Mina network";
Assistant: "Sure, what's the name of the Token?";
User: "MyToken";
Assistant: "What's the symbol of the Token?";
User: "MYT";
Assistant: "What's the decimal places of the Token?";
User: "9";
Assistant: "What's the initial supply of the Token?";
User: "100000000";
Assistant: "I'll deploy the Token now...";
```

### Deploy NFT

Deploy a new NFT on the Mina network:

```typescript
// Example conversation
User: "Deploy a new NFT on the Mina network";
Assistant: "Sure, what's the name of the NFT?";
User: "MyNFT";
Assistant: "What's the symbol of the NFT?";
User: "MNFT";
Assistant: "I'll deploy the NFT now...";
```

### Swap Mina Token

Swap one token for another using a defi contract:

```typescript
// Example conversation
User: "Swap 100 MINA for USDT";
Assistant: "I'll swap 100 MINA for USDT...";
```

## Features

### `SEND_MINA_TOKEN`

Transfers MINA native tokens to another account.

```typescript
{
  action: 'SEND_MINA_TOKEN',
  content: {
    recipient: string,    // Required - recipient's MINA account (e.g., "B62qoK2E55aZKaCjVRGxwJ2XJUoZduq8xphTDLEEK7hTZpLHXBa48b3")
    amount: string,       // Required - to send (in Token)
    tokenAddress?: string // Optional - default to Mina native token if not provided
  }
}
```

### `CHECK_BALANCES`

Queries the balance of a wallet address.

```typescript
{
  action: 'CHECK_BALANCES',
  content: {
    address: string, // Optional - wallet address, defaults to agent's wallet
    token: string    // Optional - token contract address, defaults to Mina native token
  }
}
```

### `GET_FAUCET`

Requests test tokens from the Mina faucet.

```typescript
{
  action: 'GET_FAUCET',
  content: {
    address: string, // Optional - wallet address, defaults to agent's wallet
    network: string, // Optional - network name, defaults to devnet
  }
}
```

### `SEND_BATCH_MINA_TOKEN`

Transfer tokens from the agent's wallet to multiple recipients.

```typescript
{
  action: 'SEND_BATCH_MINA_TOKEN',
  content: {
    recipient: Array<string>; // Required - array of addresses objects
    amount: string | number;  // Required - to send (in Token)
  }
}
```

### `DEPLOY_TOKEN`

Deploys a new token on the Mina network.

```typescript
{
  action: 'DEPLOY_TOKEN',
  content: {
    name: string,         // Required - token name
    symbol: string,       // Required - token symbol
    decimals: number,     // Required - token decimal places
    initialSupply: string // Required - token initial supply
  }
}
```

### `DEPLOY_NFT`

Deploys a new NFT on the Mina network.

```typescript
{
  action: 'DEPLOY_NFT',
  content: {
    name: string,         // Required - NFT name
    symbol: string        // Required - NFT symbol
  }
}
```

### `SWAP_MINA_TOKEN`

Executes a token swap using one defi contract.

```typescript
{
  action: 'SWAP_MINA_TOKEN',
  content: {
    inputTokenId: string,  // Required - input token contract
    outputTokenId: string, // Required - output token contract
    amount: string         // Required - amount to swap
  }
}
```

## API Reference

### Actions

- `SEND_MINA_TOKEN`: Transfer MINA tokens to another address
- `SEND_TOKEN`: Alias for SEND_MINA_TOKEN
- `TRANSFER_TOKEN`: Alias for SEND_MINA_TOKEN
- `SEND_MINA`: Alias for SEND_MINA_TOKEN
- `PAY`: Alias for SEND_MINA_TOKEN
- `CHECK_BALANCES`: Query wallet balance and portfolio value
- `GET_FAUCET`: Request test tokens from the Mina faucet
- `SEND_BATCH_MINA_TOKEN`: Transfer tokens from the agent's wallet to multiple recipients
- `SWAP_MINA_TOKEN`: Swap one token for another using a defi contract
- `SWAP_TOKEN`: Alias for SWAP_MINA_TOKEN
- `DEPLOY_TOKEN`: Deploy a new Token on the Mina network
- `DEPLOY_ERC20`: Alias for DEPLOY_TOKEN
- `DEPLOY_NFT`: Deploy a new NFT on the Mina network
- `DEPLOY_ERC721`: Alias for DEPLOY_NFT

## Development

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Build the plugin:

```bash
pnpm run build
```

4. Run linting:

```bash
pnpm run lint
```

5. Run tests:

```bash
pnpm run test
```

## Dependencies

- o1js
- `bignumber.js`: Precise number handling
- `node-cache`: Caching functionality
- @elizaos/core: workspace:\*
- Other standard dependencies listed in package.json

## Troubleshooting

### Balance Fetching Failure

- **Cause**: Incorrect RPC endpoint or network connectivity issues
- **Solution**: Verify `MINA_RPC_URL` and network connection

### Transfer Fails

- **Cause**: Insufficient balance or invalid recipient address
- **Solution**: Ensure sufficient funds and valid recipient address format

### Get faucet response slowly

- **Cause**: Activating a new account takes a long time, there are many users of the faucet, and there are restrictions on faucet usage
- **Solution**: Observe wallet changes and Elizaos client response results to confirm that the network is usually updated in real-time with account balance

### Network connectivity issues

- **Cause**: Network connectivity issues
- **Solution**: Verify network connectivity and retry

### Token Deployment Fails

- **Cause**: Invalid token parameters
- **Solution**: Verify token parameters and retry

### NFT Deployment Fails

- **Cause**: Invalid NFT parameters
- **Solution**: Verify NFT parameters and retry

### Swap Fails

- **Cause**: Insufficient balance or invalid token pairs
- **Solution**: Ensure sufficient funds, verify token pairs exist and check liquidity pools

## Security Best Practices

- Store private keys securely using environment variables
- Use secure RPC endpoints
- Validate all input addresses and amounts
- Use proper error handling for blockchain operations
- Keep dependencies updated for security patches
- Log all transaction attempts and errors

## Future Enhancements

1. **Wallet Management**

    - Multi-wallet support
    - Hardware wallet integration
    - Recovery options

2. **Transaction Management**

    - Batch transaction processing
    - Transaction simulation
    - Advanced error handling

3. **Token Operations**

    - Token metadata handling

4. **Smart Contract**

    - Customized contract deployment tool
    - Smart contract interaction tools
    - Smart contract event handling

5. **DeFi Features**

    - DEX integration
    - Liquidity management
    - Swap optimization
    - Portfolio tracking

6. **Developer Tools**

    - Enhanced debugging capabilities
    - Testing framework improvements
    - Plugin development templates
    - Documentation generator
    - Performance profiling tools

We welcome community feedback and contributions to help prioritize these enhancements.

## Contributing

Contributions are welcome! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for more information.

## Credits

This plugin integrates with and builds upon several key technologies:

- [Mina Protocol](https://docs.minaprotocol.com/): The Mina protocol docs
- [o1js](https://github.com/o1-labs/o1js): The o1js utility library
- [bignumber.js](https://github.com/MikeMcl/bignumber.js/): Precise number handling
- [node-cache](https://www.npmjs.com/package/node-cache): Caching implementation

Special thanks to:

- The Mina team for their excellent work on the Mina network
- The o1-labs for their excellent work on the o1js library
- The Eliza Core development team
- The Eliza community for their contributions and feedback

## License

This plugin is part of the Eliza project. See the main project repository for license information.
