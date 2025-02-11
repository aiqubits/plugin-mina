export const checkBalancesTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested check balance:
- Address to check balance for. Optional, must be a valid Mina address starting with "B62". If not provided, use the Mina Wallet Address.

Respond with a JSON markdown block containing only the extracted values. If no default value is specified, use null.:

Example response:
\`\`\`json
{
    "recipient": string | null
}
\`\`\`
`;

export const getfaucetTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested faucet request:
- Recipient address. Optional, must be a valid Mina address starting with "B62". If any field is not provided,  use the default Wallet Address.

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

Example response:
\`\`\`json
{
    "toAddress": string | null
}
\`\`\`
`;

export const transferTemplate = `Given the recent messages, extract the following information about the requested token transfer:

{{recentMessages}}

- Recipient wallet address
- Amount to transfer

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "recipient": "B62qoK2E55aZKaCjVRGxwJ2XJUoZduq8xphTDLEEK7hTZpLHXBa48b3",
    "amount": "1"
}
\`\`\`
`;

export const batchTransferTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "recipient": "[B62qoK2E55aZKaCjVRGxwJ2XJUoZduq8xphTDLEEK7hTZpLHXBa48b3, B62qnzai52aKJQFjmfwSRaAHCJWPRpbQmczrEp6T5r7tjwn6RcUvapi]",
    "amount": "1"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested token transfer:
- Recipient wallet array address
- Amount to transfer

Respond with a JSON markdown block containing only the extracted values.
`;

export const deployTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "symbol": "TokenFounder",
    "decimal": "9",
    "recipient": "B62qoK2E55aZKaCjVRGxwJ2XJUoZduq8xphTDLEEK7hTZpLHXBa48b3",
    "tokenSecretkey": "EKE0000000000000000000000000000000000000000000000000"
    "adminSecretkey": "EKE0000000000000000000000000000000000000000000000000"
    "initialSupply": "100000000",
    "codeUrl": "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
}
\`\`\`

{{recentMessages}}

Extract the following information about the requested token deployment:
- Token Symbol
- Token Decimal
- Token Recipient
- Token Initial Supply
- Token Code URL
- Token Admin Secret Key
- Token Secret Key

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.
`;
