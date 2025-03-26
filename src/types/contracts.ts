// Contract function parameter type
export interface ContractFunctionParam {
    name: string;
    type: string;
}

// Contract function type
export interface ContractFunction {
    name: string;
    parameters: ContractFunctionParam[];
}

// Contract metadata type
export interface ContractMetadata {
    name?: string;
    symbol?: string;
    decimals?: number;
    totalSupply?: string;
    version?: string;
    functions: ContractFunction[];
} 