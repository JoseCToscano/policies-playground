"use client"

import { useState, useCallback, useEffect } from "react";
import { account, fundSigner, native, server, fundPubkey, fundKeypair } from "~/lib/utils";
import base64url from "base64url";
import { Address, hash, Keypair, Operation, scValToNative, StrKey, rpc as SorobanRpc, TransactionBuilder, xdr, Transaction } from "@stellar/stellar-sdk";
import { SignerStore, type SignerLimits, SignerKey } from "passkey-kit";
import { useSearchParams } from "./useSearchParams";
import { env } from "~/env";
import toast from "react-hot-toast";
import { AssembledTransaction } from "@stellar/stellar-sdk/contract";
const ADMIN_KEY = "AAAAEAAAAAEAAAABAAAAEQAAAAEAAAAA"; // TODO very rough until we're actually parsing the limits object

export const useSmartWallet = () => {
    const [keyId, setKeyId] = useState<string | null>(null);
    const [contractId, setContractId] = useState<string | null>(null);
    const [adminSigner, setAdminSigner] = useState<string | null>(null);
    const [balance, setBalance] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [signers, setSigners] = useState<any[]>([]);
    const [isFunding, setIsFunding] = useState<boolean>(false);
    const [zafeguardPolicy, setZafeguardPolicy] = useState<string | null>(null);
    const [subWallets, setSubWallets] = useState<Map<string, { secret: string, email: string, name: string, limitPerTransaction: number }> | null>(null);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);

    const { getParam, setParams } = useSearchParams();

    // Poll for wallet balance every 5 seconds
    useEffect(() => {
        if (contractId) {
            const interval = setInterval(() => {
                getWalletBalance(contractId);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [contractId]);

    useEffect(() => {
        const _keyId = getParam('keyId');
        if (_keyId) {
            setKeyId(_keyId);
            setIsConnecting(true);
            connect(_keyId).then((_contractId) => {
                setIsConnecting(false);
            });
        } else if (localStorage.hasOwnProperty("zg:subwallets")) {
            localStorage.removeItem("zg:subwallets");
            setSubWallets(null);
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
                return toast.error("Transaction send failed");

            await new Promise((resolve) => setTimeout(resolve, 6000));

            const res2 = await rpc.getTransaction(res1.hash);

            if (res2.status !== "SUCCESS") return toast.error("Transaction failed");

            console.log('res2', res2);
        } catch (error) {
            console.error('Error initializing wallet:', error);
        }
    }



    const create = async () => {
        try {
            const user = prompt("Give this passkey a name");

            if (!user) return;

            console.log('Creating wallet with user:', user);

            const result = await account.createWallet("Policies Playground", user);
            console.log('Create wallet result:', result);

            const {
                keyId: kid,
                contractId: cid,
                signedTx,
                keyIdBase64
            } = result;

            const res = await server.send(signedTx);

            console.log(res, kid, cid);

            setKeyId(keyIdBase64);
            setContractId(cid);
            setParams({ keyId: keyIdBase64 });

            await initWallet(cid)
            await fundWallet(cid)
            await getWalletSigners()

        } catch (error) {
            console.error(error);
            toast.error((error as Error)?.message ?? "Unknown error");
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
                console.error(fetchError);
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
            console.error('getWalletSigners error:', error);
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
            toast.error((error as Error)?.message ?? "Unknown error");
        } finally {
            setIsFunding(false);
        }
    }

    const getWalletBalance = useCallback(async (id: string) => {
        const { result } = await native.balance({ id });
        setBalance(result.toString())
        console.log('balance: ', result.toString());
    }, []);

    const addSigner_Ed25519 = async (): Promise<{ keypair: Keypair }> => {
        console.log("Adding signer", keyId);
        if (!keyId) {
            throw new Error("No keyId found");
        }
        setLoading(true);

        try {
            const keypair = Keypair.random();
            const at = await account.addEd25519(keypair.publicKey(), new Map(), SignerStore.Temporary);

            const signedTx = await account.sign(at, { keyId });
            const res = await server.send(signedTx);

            // Store the secret key in localStorage
            localStorage.setItem(
                "zg:ed25519_signers",
                JSON.stringify({
                    ...JSON.parse(
                        localStorage.getItem("zg:ed25519_signers") || "{}"
                    ),
                    [keypair.publicKey()]: keypair.secret(),
                })
            );

            console.log('Transaction response:', res);
            return { keypair };
        } catch (error) {
            console.error('Add signer error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }

    const connect = async (_keyId: string): Promise<string> => {
        const { keyIdBase64, contractId } = await account.connectWallet({ keyId: _keyId });
        setContractId(contractId);
        return contractId;
    }

    // Option 2: Just include the function
    useEffect(() => {
        console.log("Triggering getWalletSigners through useEffect");
        if (contractId && keyId) {
            getWalletSigners();
        }
    }, [getWalletSigners]);

    async function transfer({ keypair, to, amount, keyId }: { keyId?: string | null, keypair?: Keypair, to: string, amount: number }) {
        if (!contractId) return;

        const at = await native.transfer({
            from: contractId,
            to: fundPubkey,
            amount: BigInt(amount),
        });

        let signedTx;
        if (keypair) {
            signedTx = await account.sign(at, { keypair });
        } else if (keyId) {
            signedTx = await account.sign(at, { keyId });
        } else {
            throw new Error('No keypair or keyId found');
        }

        try {
            const res = await server.send(signedTx);
            console.log(res);
        } catch (error: any) {
            console.error('Transfer error:', {
                message: error.message,
                code: error.response?.status,
                details: error.response?.data?.extras,
                raw: error
            });

            // Extract meaningful error message
            let errorMessage = "Transaction failed: ";
            if ((error?.error as string).includes("InvalidAction")) {
                errorMessage += 'Invalid action'
            } else if (error.message) {
                errorMessage += error.message;
            } else {
                errorMessage += "Unknown error occurred";
            }

            toast.error(errorMessage);
        }

        await getWalletBalance(contractId);
    }


    function getSignerSecret(publicKey: string) {
        const signers = JSON.parse(localStorage.getItem("zg:ed25519_signers") || "{}");
        return signers[publicKey];
    }


    const signXDR = async (xdrString: string, signerType: 'Ed25519' | 'Secp256r1', publicKey?: string) => {
        if (signerType.includes('Ed25519')) {
            if (!publicKey) throw new Error('No public key found');
            const secret = getSignerSecret(publicKey);
            if (!secret) throw new Error('No secret found');
            console.log('Signing from signXDR:', xdrString, signerType, publicKey, secret);
            const keypair = Keypair.fromSecret(secret);
            console.log('keypair', keypair);
            try {
                return account.sign(xdrString, { keypair });
            } catch (error) {
                console.error('XDR parsing error:', {
                    xdrString,
                    error,
                    type: typeof xdrString
                });
                throw error;
            }
        } else if (signerType === 'Secp256r1') {
            if (!keyId) throw new Error('No public key found');
            return account.sign(xdrString, { keyId });
        } else {
            throw new Error('Invalid signer type');
        }
    }

    async function signAndSend(unsignedXDR: string, signerType: 'Ed25519' | 'Secp256r1', signerPublicKey?: string) {
        const signedXDR = await signXDR(unsignedXDR, signerType, signerPublicKey);
        console.log('signedXDR:', signedXDR.toXDR());
        const res = await server.send(signedXDR);

        try {
            console.log('res:', res);
            const meta = xdr.TransactionMeta.fromXDR(res.resultMetaXdr, "base64");
            console.log('meta:', meta);
            const result = scValToNative(meta.v3().sorobanMeta()!.returnValue());
            console.log('result:', result);
            return result;
        } catch (error) {
            console.error('Error parsing result:', error);
            return res;
        }
    }

    /**
     * Add a policy to list of policies
     * @param policyId - The policy ID to add
     * @returns The result of the transaction
     */
    async function addPolicy(policyId: string) {
        if (!keyId) {
            toast.error('KeyId not initialized');
            return;
        }
        const at = await account.addPolicy(
            policyId,
            new Map(),
            SignerStore.Persistent
        );

        const signedTx = await account.sign(at, { keyId });
        const res = await server.send(signedTx);
        console.log('res', res);
        return res;
    }

    /**
     * Attach a policy to a signer
     * @param signerPublicKey - The public key of the signer
     * @param contractIdToLimit - The contract ID to limit
     * @param policyId - The policy ID to attach
     * @returns The result of the transaction
     */
    async function attachPolicy(signerPublicKey: string, contractIdToLimit: string, policyId: string) {
        if (!keyId) {
            toast.error('KeyId not initialized');
            return;
        }

        // Create a new limits map with just the single policy
        const limits = new Map();
        limits.set(contractIdToLimit, [{
            key: "Policy",
            value: policyId
        }]);

        const at = await account.updateEd25519(
            signerPublicKey,
            limits,
            SignerStore.Temporary
        );
        const signedTx = await account.sign(at, { keyId });
        const res = await server.send(signedTx);
        console.log('res', res);
        return res;
    }

    /**
     * Remove a signer from the list of signers
     * @param signerPublicKey - The public key of the signer
     * @returns The result of the transaction
     */
    async function removeSigner(signerPublicKey: string) {
        if (!keyId) {
            toast.error('KeyId not initialized');
            return;
        }
        const at = await account.remove({
            key: "Ed25519",
            value: signerPublicKey
        });
        const signedTx = await account.sign(at, { keyId });
        const res = await server.send(signedTx);
        console.log('res', res);
        return res;
    }

    /**
     * Detach a policy from a signer
     * @param signerEd25519PublicKey - The public key of the signer
     * @returns The result of the transaction
     */
    async function detachPolicy(signerEd25519PublicKey: string) {
        if (!keyId) {
            toast.error('KeyId not initialized');
            return;
        }
        const newLimits = new Map();

        const tx = await account.updateEd25519(
            signerEd25519PublicKey,
            newLimits,
            SignerStore.Persistent
        );

        const signedTx = await account.sign(tx, { keyId });
        const res = await server.send(signedTx);
        console.log('res', res);
        return res;
    }

    // Better approach - Update the signer first, then remove the policy
    async function safeRemovePolicy(policyAddress: string) {
        if (!keyId) {
            toast.error('KeyId not initialized');
            return;
        }

        // 2. Then safely remove the policy
        const at = await account.remove({
            key: "Policy",
            value: policyAddress
        });

        const signedTx = await account.sign(at, { keyId });
        const res = await server.send(signedTx);
        return res;
    }

    return {
        attachPolicy,
        signAndSend,
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
        transfer,
        keyId,
        signXDR,
        isConnecting,
        addPolicy,
        removeSigner,
        safeRemovePolicy,
        detachPolicy,
        getSignerSecret
    }
}