import { useState, useCallback, useEffect } from "react";
import { account, fundSigner, native, server, fundPubkey, fundKeypair } from "~/lib/utils";
import base64url from "base64url";
import { Address, Keypair, Operation, scValToNative, rpc as SorobanRpc, TransactionBuilder, xdr } from "@stellar/stellar-sdk";
import { SignerStore } from "passkey-kit";
import { useSearchParams } from "./useSearchParams";
import { env } from "~/env";
import { Client, Contract as ZafeguardContract } from "zafegard-policy-sdk";
const ADMIN_KEY = "AAAAEAAAAAEAAAABAAAAEQAAAAEAAAAA"; // TODO very rough until we're actually parsing the limits object

export const useSmartWallet = () => {
    const [keyId, setKeyId] = useState<string | null>(null);
    const [contractId, setContractId] = useState<string | null>(null);
    const [contract, setContract] = useState<Client | null>(null);
    const [adminSigner, setAdminSigner] = useState<string | null>(null);
    const [balance, setBalance] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [signers, setSigners] = useState<any[]>([]);
    const [isFunding, setIsFunding] = useState<boolean>(false);
    const [zafeguardPolicy, setZafeguardPolicy] = useState<string | null>(null);
    const [subWallets, setSubWallets] = useState<Map<string, [string, number, number]> | null>(null);

    const { getParam, setParams } = useSearchParams();

    useEffect(() => {
        const _keyId = getParam('keyId');
        if (_keyId) {
            setKeyId(_keyId);
            connect(_keyId);
        }
    }, [getParam]);

    useEffect(() => {
        if (contractId) {
            Promise.all([getWalletSigners(), getWalletBalance(contractId)]);
        }
    }, [contractId]);

        async function initWallet(contractId_: string) {
            try {
                const rpc = new SorobanRpc.Server(env.NEXT_PUBLIC_RPC_URL);
                const source = await rpc.getAccount(fundPubkey);
                const transaction_before = new TransactionBuilder(source, {
                    fee: "0",
                    networkPassphrase: env.NEXT_PUBLIC_NETWORK_PASSPHRASE
                })
                    .addOperation(
                        Operation.createCustomContract({
                            address: Address.fromString(fundPubkey),
                            wasmHash: Buffer.from(
                                env.NEXT_PUBLIC_ZAFEGARD_WASM_HASH,
                                "hex",
                            ),
                            salt: Address.fromString(contractId_).toBuffer(),
                        }),
                    )
                    .setTimeout(300)
                    .build();
    
                const sim = await rpc.simulateTransaction(transaction_before);
    
                if (!SorobanRpc.Api.isSimulationSuccess(sim))
                    throw new Error("Simulation failed");
    
                const transaction_after = TransactionBuilder.cloneFrom(
                    transaction_before,
                    {
                        fee: (Number(sim.minResourceFee) + 10_000_000).toString(),
                        sorobanData: sim.transactionData.build(),
                    },
                ).build();
    
                const op = transaction_after
                    .operations[0] as Operation.InvokeHostFunction;
    
                op.auth![0] = sim.result!.auth[0]!;
    
                transaction_after.sign(await fundKeypair);
    
                const res1 = await rpc._sendTransaction(transaction_after);
    
                if (res1.status !== "PENDING")
                    return alert("Transaction send failed");
    
                await new Promise((resolve) => setTimeout(resolve, 6000));
    
                const res2 = await rpc.getTransaction(res1.hash);
    
                if (res2.status !== "SUCCESS") return alert("Transaction failed");
    
                console.log('res2', res2);
    
                const _zafeguardPolicy = Address.contract(
                    res2.returnValue!.address().contractId(),
                ).toString();
                console.log('zafeguardPolicy', _zafeguardPolicy);
                setZafeguardPolicy(_zafeguardPolicy);
                const _contract = new Client({
                    rpcUrl: env.NEXT_PUBLIC_RPC_URL,
                    contractId: _zafeguardPolicy!,
                    networkPassphrase: env.NEXT_PUBLIC_NETWORK_PASSPHRASE,
                });
                setContract(_contract);
                console.log('contract: ', _contract);
                const instance = await account.rpc.getContractData(
                    _zafeguardPolicy!,
                    xdr.ScVal.scvLedgerKeyContractInstance(),
                );
                const admin = instance.val
                .contractData()
                .val()
                .instance()
                .storage()
                ?.filter((item) => {
                    if (scValToNative(item.key())?.[0] === "Admin") {
                        return true;
                    }
                });
                
                if (admin?.length) return;
                
                const at = await _contract.init({
                    admin: contractId_,
                });
                
                await account.sign(at, { keyId });
                
                const res = await server.send(at.built!);
                console.log('Init response:', res);
            } catch (error) {
                console.error('Error initializing wallet:', error);
            }
        }

    const create = async () => {
    try {
            const user = prompt("Give this passkey a name");
    
            if (!user) return;
    
            console.log('Creating wallet with user:', user);
            
            const result = await account.createWallet("Super Peach", user);
            console.log('Create wallet result:', result);
    
            const {
                keyId: kid,
                contractId: cid,
                signedTx,
            } = result;
            
            const res = await server.send(signedTx);
    
            console.log(res, kid, cid);
    
            const b64KeyId = base64url(kid);
            setKeyId(b64KeyId);
            localStorage.setItem("sp:keyId", b64KeyId);
    
            setContractId(cid);
            console.log('setting keyId', b64KeyId);
            setParams({ keyId: b64KeyId });
            
            // Run getWalletSigners and fundWallet in parallel
            await Promise.all([
                getWalletSigners(),
                fundWallet(cid),
                initWallet(cid)
            ]);
            console.log('initWallet done', cid);
            
            // initWallet needs to run after funding, so keep it sequential
    } catch (error) {
        console.error('Detailed error:', {
            message: error.message,
            stack: error.stack,
            response: error.response // If it's an API error
        });
        alert((error as Error)?.message ?? "Unknown error");
    }
    }

    const getWalletSigners = useCallback(async () => {
        console.log('Getting signers for:', { contractId, keyId });
        if (!contractId || !keyId) return;
        
        try {
            // Add logging for the request
            console.log('Making request to server.getSigners');
            
            // Wrap the getSigners call in a try-catch to see the raw response
            let rawResponse;
            try {
                rawResponse = await server.getSigners(contractId);
                console.log('Raw response:', rawResponse);
            } catch (fetchError) {
                console.error('Fetch error:', {
                    error: fetchError,
                    status: fetchError?.response?.status,
                    statusText: fetchError?.response?.statusText,
                    raw: await fetchError?.response?.text?.(),
                });
                throw fetchError;
            }

            // If we get here, parse the response
            console.log('Raw response:', rawResponse, typeof rawResponse);
            const _signers = Array.isArray(rawResponse) ? rawResponse : [];
            console.log('Parsed signers:', _signers);
            setSigners(_signers);

            const sudoSigner = (
                _signers.find(({ key }) => key === keyId)
            )?.key;

            if (sudoSigner) {
                console.log('Found sudo signer:', sudoSigner);
                setAdminSigner(sudoSigner);
            } else {
                console.warn('No sudo signer found in admin keys');
            }
        } catch (error) {
            console.error('getWalletSigners error:', {
                error,
                contractId,
                keyId,
                errorName: error.name,
                errorMessage: error.message,
                // Try to get more details from the response
                response: error.response,
                responseStatus: error.response?.status,
                responseHeaders: error.response?.headers,
                // Try to get the raw response text
                responseText: await error.response?.text?.()
            });
            throw error;
        }
    }, [contractId, keyId]);

    const fundWallet = async (id: string): Promise<void> => {
        console.log('funding wallet', id);
        setIsFunding(true);
        try {
		const { built, ...transfer } = await native.transfer({
			to: id,
			from: fundPubkey,
			amount: BigInt(100 * 10_000_000),
		});

		await transfer.signAuthEntries({
			address: fundPubkey,
			signAuthEntry: fundSigner.signAuthEntry,
		});

		const res = await server.send(built!);

		console.log('wallet fund', res);

		await getWalletBalance(id);
	} catch (error) {
		console.error(error);
		alert((error as Error)?.message ?? "Unknown error");
        } finally {
            setIsFunding(false);
        }
    }

    const getWalletBalance = async (id: string) => {
		const { result } = await native.balance({ id });
		setBalance(result.toString())
		console.log('balance: ', result.toString());
	}

    const addSigner_Ed25519 = async (): Promise<{publicKey: string | null}> => {
        try {
            console.log("Adding signer", keyId);
            if (!keyId) {
                alert("No keyId found");
                return { publicKey: null };
            }
            setLoading(true);

            const keypair = Keypair.random();
            const at = await account.addEd25519(keypair.publicKey(), new Map(), SignerStore.Temporary);

            await account.sign(at, { keyId });
            const res = await server.send(at.built!);

            console.log(res);
            return { publicKey: keypair.publicKey() };
        } catch (error) {
            console.error(error);
            alert((error as Error)?.message ?? "Unknown error");
            return { publicKey: null };
        } finally {
            setLoading(false);
        }
    }

    const connect = async (_keyId: string) => {
        const { keyIdBase64, contractId } = await account.connectWallet({ keyId: _keyId });

        setContractId(contractId);
    
        
    }

// Option 2: Just include the function
useEffect(() => {
    console.log("Triggering getWalletSigners through useEffect");
    if (contractId && keyId) {
        getWalletSigners();
    }
}, [getWalletSigners]);

async function ed25519Transfer() {
    const secret = SECRET; // prompt('Enter secret key');

    if (secret) {
        const keypair = Keypair.fromSecret(secret);
        const at = await native.transfer({
            to: fundPubkey,
            from: contractId,
            amount: BigInt(10_000_000),
        });

        await account.sign(at, { keypair });

        // NOTE won't work if the ed25519 signer has a policy signer_key restriction
        // If you want this to work you need to remove the policy restriction from the ed25519 signer first
        // (though that will make the policy transfer less interesting)
        const res = await server.send(at.built!);

        console.log(res);

        await getWalletBalance();
    }
}

////
async function policyTransfer() {
    const keypair = Keypair.fromSecret(SECRET);

    let at = await native.transfer({
        to: fundPubkey,
        from: contractId,
        amount: BigInt(10_000_000),
    });

    await account.sign(at, { keypair });
    await account.sign(at, { policy: SAMPLE_POLICY });

    console.log(at.built!.toXDR());

    const res = await server.send(at.built!);

    console.log(res);

    await getWalletBalance();
}

async function walletTransfer(signer: string, kind: string) {
    if (kind === "Policy") {
        return policyTransfer();
    } else if (kind === "Ed25519") {
        return ed25519Transfer();
    }

    const at = await native.transfer({
        to: fundPubkey,
        from: contractId!,
        amount: BigInt(10_000_000),
    });

    await account.sign(at, { keyId: signer });
    const res = await server.send(at.built!);

    console.log(res);

    await getWalletBalance(contractId!);
}

const transfer_Ed25519 = async (from: string, to: string, amount: number) => {
    try {

        const at = await native.transfer({
            from,
            to,
            amount: BigInt(1),
        })

        // await account.sign(at, { keypair });
        const res = await server.send(at.built!);

        console.log(res);

        alert("😱 Transfer complete");
    } catch {
        alert("❌ Failed to transfer");
    } finally {
    }
}

async function addSubWallet() {
    try {
        setLoading(true);
        if (!contract || !keyId || !contractId || !zafeguardPolicy) {
            throw new Error('Contract or wallet not initialized');
        }

        const keypair = Keypair.random();
        const interval = 10;
        const amount = 100;

        console.log('Adding subwallet with:', {
            smartWallet: contractId,
            zafeguardPolicy,
            keyId
        });

        const at = await contract.add_wallet({
            user: keypair.rawPublicKey(),
            sac: env.NEXT_PUBLIC_NATIVE_CONTRACT_ID,
            interval,
            amount: BigInt(amount),
        });

        // Sign the transaction and wait for it to complete
        console.log('Signing transaction', at.built?.signatures);
        const signedTx = await account.sign(at, { keyId });
        console.log('Signatures after signing:', signedTx.built?.signatures);
        
        const res = await server.send(signedTx);
        console.log('Transaction response:', res);

        localStorage.setItem(
            "zg:subwallets",
            JSON.stringify({
                ...JSON.parse(
                    localStorage.getItem("zg:subwallets") || "{}",
                ),
                [keypair.publicKey()]: [keypair.secret(), interval, amount],
            }),
        );

        const _subwallets = new Map<string, [string, number, number]>(
            Object.entries(
                JSON.parse(localStorage.getItem("zg:subwallets") || "{}") as Record<string, [string, number, number]>
            )
        );

        setSubWallets(_subwallets);
    } catch (error) {
        console.error('Add subwallet error:', error);
        throw error;
    } finally {
        setLoading(false);
    }
}

    return {
        create,
        adminSigner,
        getWalletSigners,
        getWalletBalance,
        balance,
        fundWallet,
        contractId,
        addSigner_Ed25519,
        loading,
        signers,
        connect,
        isFunding,
        subWallets,
        addSubWallet,
    }
}