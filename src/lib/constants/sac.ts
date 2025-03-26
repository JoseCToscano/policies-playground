// Stellar Asset Contract (SAC) Interface Definition
// Based on the standard TokenInterface trait

import { ContractFunction, ContractFunctionParam } from '~/types/contracts';

export const SAC_FUNCTIONS: ContractFunction[] = [
    {
        name: "allowance",
        parameters: [
            { name: "from", type: "address" },
            { name: "spender", type: "address" }
        ]
    },
    {
        name: "approve",
        parameters: [
            { name: "from", type: "address" },
            { name: "spender", type: "address" },
            { name: "amount", type: "i128" },
            { name: "expiration_ledger", type: "u32" }
        ]
    },
    {
        name: "balance",
        parameters: [
            { name: "id", type: "address" }
        ]
    },
    {
        name: "transfer",
        parameters: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "amount", type: "i128" }
        ]
    },
    {
        name: "transfer_from",
        parameters: [
            { name: "spender", type: "address" },
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "amount", type: "i128" }
        ]
    },
    {
        name: "burn",
        parameters: [
            { name: "from", type: "address" },
            { name: "amount", type: "i128" }
        ]
    },
    {
        name: "burn_from",
        parameters: [
            { name: "spender", type: "address" },
            { name: "from", type: "address" },
            { name: "amount", type: "i128" }
        ]
    },
    {
        name: "decimals",
        parameters: []
    },
    {
        name: "name",
        parameters: []
    },
    {
        name: "symbol",
        parameters: []
    }
];

// Documentation for each function
export const SAC_FUNCTION_DOCS: Record<string, string> = {
    allowance: "Returns the allowance for 'spender' to transfer from 'from'.",
    approve: "Set the allowance by 'amount' for 'spender' to transfer/burn from 'from'. The expiration_ledger specifies when this allowance expires.",
    balance: "Returns the balance of 'id'. If the address has no existing balance, returns 0.",
    transfer: "Transfer 'amount' from 'from' to 'to'.",
    transfer_from: "Transfer 'amount' from 'from' to 'to', consuming the allowance of 'spender'. Authorized by spender.",
    burn: "Burn 'amount' from 'from'.",
    burn_from: "Burn 'amount' from 'from', consuming the allowance of 'spender'.",
    decimals: "Returns the number of decimals used to represent amounts of this token.",
    name: "Returns the name for this token.",
    symbol: "Returns the symbol for this token."
}; 