import { NextResponse } from 'next/server';

// Mock results for standard token methods when using SAC interface
const mockSacResponses = {
    balance: { value: "1000000000" },
    allowance: { value: "500000000" },
    decimals: { value: 7 },
    name: { value: "Token Name" },
    symbol: { value: "TKN" }
};

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { contractAddress, method, args } = data;

        console.log('Querying contract:', {
            contractAddress,
            method,
            args: args ? JSON.stringify(args) : 'none'
        });

        // Basic validation
        if (!contractAddress || !method) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // For SAC tokens or native XLM, use mock responses
        if (contractAddress === 'native' || contractAddress.includes('-')) {
            if (method in mockSacResponses) {
                return NextResponse.json(mockSacResponses[method as keyof typeof mockSacResponses]);
            }

            // For custom token name/symbol, use the token code
            if (method === 'name' || method === 'symbol') {
                const tokenCode = contractAddress === 'native'
                    ? 'XLM'
                    : contractAddress.split('-')[0];

                return NextResponse.json({ value: method === 'name' ? `${tokenCode} Token` : tokenCode });
            }
        }

        // For regular contracts, simulate the contract call
        try {
            // Instead of a true simulation for this demo, we'll return mock data
            // In production, you would use the Soroban RPC to simulate the transaction

            // Return some mock data based on the function name
            const mockData: { value: string | number | boolean } = {
                value: `Result from ${method} call on ${contractAddress}`
            };

            // For numbers, return a number value
            if (method.includes('get') || method.includes('balance') || method.includes('amount')) {
                mockData.value = "12345000000";
            }

            // For booleans, return a boolean value
            if (method.includes('is') || method.includes('has') || method.includes('can')) {
                mockData.value = true;
            }

            return NextResponse.json(mockData);
        } catch (e) {
            console.error("Contract query error:", e);
            return NextResponse.json({ error: 'Failed to query contract' }, { status: 500 });
        }
    } catch (error) {
        console.error('Error in /api/query-contract:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 