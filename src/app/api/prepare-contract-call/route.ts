import { NextResponse } from 'next/server';
import {
    Address,
    Contract,
    Keypair,
    Networks,
    Operation,
    Soroban,
    Transaction,
    TransactionBuilder,
    scValToNative,
    rpc, contract,
    nativeToScVal
} from '@stellar/stellar-sdk';
import { account } from '~/lib/utils';
import { env } from '~/env';
import { getContractMetadata } from '~/lib/getContractMetadat';

const server = new rpc.Server(env.NEXT_PUBLIC_RPC_URL);

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { contractAddress, method, args, isReadOnly } = data as { contractAddress: string, method: string, args: any[], isReadOnly: boolean };

        console.log('Preparing contract call:', {
            contractAddress,
            method,
            argsCount: args.length,
            isReadOnly
        });

        // Basic validation
        if (!contractAddress || !method) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // Create a transaction for the contract call+
        const contractClient = contract.Client.from({
            contractId: contractAddress,
            rpcUrl: env.NEXT_PUBLIC_RPC_URL,
            networkPassphrase: env.NEXT_PUBLIC_NETWORK_PASSPHRASE
        });
        const { functions } = await getContractMetadata(contractAddress);
        const functionParams = functions.find(f => f.name === method)?.parameters;


        // Ensure parameters are in the correct order as defined in the contract
        const orderedParams = ['from', 'spender', 'to', 'requests'];
        const scValParams = orderedParams.map(paramName => {
            const value = functionParams[paramName as keyof typeof functionParams];
            if (value === undefined) {
                throw new Error(`Missing required parameter: ${paramName}`);
            }
            // Use appropriate conversion based on parameter type
            switch (paramName) {
                case 'from':
                    return addressToScVal(value as string);
                case 'spender':
                    return addressToScVal(value as string);
                case 'to':
                    return addressToScVal(value as string);
                case 'requests':
                    return nativeToScVal(value as any);
                default:
                    return nativeToScVal(value);
            }
        });

        // Get the account
        const account = await server.getAccount(publicKey);
        const transaction = new TransactionBuilder(account, {
            networkPassphrase: config.networkPassphrase,
            fee: BASE_FEE,
        })
            .addOperation(contract.call("submit", ...scValParams))
            .setTimeout(30)
            .build();

        if (!simulate) {
            return {
                content: [
                    { type: "text", text: "Transaction XDR:" },
                    { type: "text", text: transaction.toXDR() }
                ]
            };
        }

        // Prepare the transaction
        const preparedTx = await server.prepareTransaction(transaction);
        const preparedXdr = preparedTx.toXDR();

        // Simulate the transaction using the server
        const simulateResult = await server.simulateTransaction(preparedTx);
        if (!signAndSubmit) {
            return {
                content: [
                    { type: "text", text: "Transaction XDR" },
                    { type: "text", text: preparedXdr }
                ]
            };
        }

        if (!secretKey) {
            throw new Error("secretKey is required when signAndSubmit is true");
        }

        const keypair = Keypair.fromSecret(secretKey);
        const tx = TransactionBuilder.fromXDR(preparedXdr, config.networkPassphrase);
        tx.sign(keypair);

        try {
            const result = await submitTransaction(tx.toXDR(), {
                server,
                networkPassphrase: config.networkPassphrase
            });

            if (result.status === 'SUCCESS') {
                return {
                    content: [
                        { type: "text", text: "Transaction completed successfully!" },
                        { type: "text", text: `Transaction hash: ${result.hash}` },
                        { type: "text", text: "Full response:" },
                        { type: "text", text: JSON.stringify(result.response, null, 2) }
                    ]
                };
            } else if (result.status === 'FAILED') {
                throw new Error(`Transaction failed: ${result.resultXdr}`);
            } else {
                // Instead of throwing an error on timeout, return a message with explorer link
                return {
                    content: [
                        { type: "text", text: "Transaction submitted but still processing." },
                        { type: "text", text: `Transaction hash: ${result.hash}` },
                        { type: "text", text: `You can view the transaction status at: https://stellar.expert/explorer/${config.network === 'testnet' ? 'testnet' : 'public'}/tx/${result.hash}` }
                    ]
                };
            }

        } catch (error: any) {
            return {
                content: [
                    { type: "text", text: "Transaction failed!" },
                    { type: "text", text: error.message },
                    { type: "text", text: "Please check the transaction hash on the network explorer." }
                ]
            };
        }
    } catch (error: any) {
        return {
            content: [{
                type: "text",
                text: `Error executing submit: ${error.message}${error.cause ? `\nCause: ${error.cause}` : ''}`
            }]
        };
    }
}
  );






const source = server.getAccount(account)
let transaction: Transaction;

// Use network passphrase for Testnet
const networkPassphrase = Networks.TESTNET;

try {
    // Build a simple transaction for demo purposes
    // In production, you would build a proper contract invocation transaction
    transaction = new TransactionBuilder(source, {
        fee: "100",
        networkPassphrase,
    })
        .setTimeout(30)
        .build();

    // Return the XDR for the client to sign and submit
    return NextResponse.json({
        xdr: transaction.toXDR(),
        simulation: "success"
    });
} catch (e) {
    console.error("Contract call preparation error:", e);
    return NextResponse.json({ error: 'Failed to prepare contract call' }, { status: 500 });
}
    } catch (error) {
    console.error('Error in /api/prepare-contract-call:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
} 