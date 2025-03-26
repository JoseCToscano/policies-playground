"use client"

import { useState, useCallback, useEffect } from "react";
import { account, fundSigner, native, server, fundPubkey, fundKeypair } from "~/lib/utils";
import base64url from "base64url";
import { Address, hash, Keypair, Operation, scValToNative, StrKey, rpc as SorobanRpc, TransactionBuilder, xdr, Transaction } from "@stellar/stellar-sdk";
import { SignerStore } from "passkey-kit";
import { useSearchParams } from "./useSearchParams";
import { env } from "~/env";
import { Client, Contract as ZafeguardContract } from "zafegard-policy-sdk";
import toast from "react-hot-toast";
import { AssembledTransaction } from "@stellar/stellar-sdk/contract";
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
                queryZafeguardPolicyAddress(_contractId);
                getSubWallets();
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

            console.log('instance:', instance);

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

            console.log('admin:', admin);
            const at = await _contract.init({
                admin: contractId_,
            });
            console.log('at:', at);
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
            await fundWallet(cid),
                await getWalletSigners(),
                console.log('initWallet done', cid);

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

    /**
     * Set the zafeguard policy
     * Allows to locate the contract in the stellar network without actually querying the network
     * Address is deterministic, i.e. given the same inputs (network, deployer, salt), it will always compute the same address
     */
    function queryZafeguardPolicyAddress(_contractId: string) {
        const contractPreimage = xdr.HashIdPreimage.envelopeTypeContractId(
            new xdr.HashIdPreimageContractId({
                networkId: hash(
                    Buffer.from(env.NEXT_PUBLIC_NETWORK_PASSPHRASE, "utf8"),
                ),
                contractIdPreimage:
                    xdr.ContractIdPreimage.contractIdPreimageFromAddress(
                        new xdr.ContractIdPreimageFromAddress({
                            address: Address.fromString(fundPubkey).toScAddress(),
                            salt: Address.fromString(_contractId).toBuffer(),
                        }),
                    ),
            }),
        );

        const zgPolicyAddress = Address.fromString(
            StrKey.encodeContract(hash(contractPreimage.toXDR()))
        ).toString();

        console.log('zgPolicyAddress', zgPolicyAddress);
        setZafeguardPolicy(zgPolicyAddress);

        const _contract = new Client({
            rpcUrl: env.NEXT_PUBLIC_RPC_URL,
            contractId: zgPolicyAddress,
            networkPassphrase: env.NEXT_PUBLIC_NETWORK_PASSPHRASE,
        });
        setContract(_contract);

        return zgPolicyAddress;
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

    async function addSubWallet(email?: string, name?: string, limitPerTransaction?: number) {
        console.log('addSubWallet function called');
        try {
            setLoading(true);
            console.log('contractId:', contractId);
            console.log('keyId:', keyId);
            console.log('contract:', contract);
            console.log('zafeguardPolicy:', zafeguardPolicy);
            if (!contract || !keyId || !contractId || !zafeguardPolicy) {
                throw new Error('Contract or wallet not initialized');
            }

            const keypair = Keypair.random();
            const interval = 10;
            const amount = (limitPerTransaction ?? 100) * 10_000_000;

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
                    [keypair.publicKey()]: {
                        secret: keypair.secret(),
                        email,
                        name,
                        limitPerTransaction,
                    },
                }),
            );

            getSubWallets();
        } catch (error) {
            console.error('Add subwallet error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }



    function getSubWallets() {
        const _subwallets = new Map<string, { secret: string, email: string, name: string, limitPerTransaction: number }>(
            Object.entries(
                JSON.parse(localStorage.getItem("zg:subwallets") || "{}") as Record<string, { secret: string, email: string, name: string, limitPerTransaction: number }>
            )
        );
        setSubWallets(_subwallets);
        return _subwallets;
    }

    function getSubWalletSecret(publicKey: string) {
        const subwallets = JSON.parse(localStorage.getItem("zg:subwallets") || "{}");
        return subwallets[publicKey].secret;
    }

    function getSignerSecret(publicKey: string) {
        const signers = JSON.parse(localStorage.getItem("zg:ed25519_signers") || "{}");
        return signers[publicKey];
    }

    const getKeypair = (publicKey: string) => {
        console.log('getKeypair', publicKey);
        let secret = getSignerSecret(publicKey);
        if (!secret) {
            secret = getSubWalletSecret(publicKey);
        }
        console.log('secret', secret);
        return secret ? Keypair.fromSecret(secret) : null;
    }

    const signXDR = async (xdrString: string, signerType: 'subwallet:Ed25519' | 'Ed25519' | 'Secp256r1', publicKey?: string) => {
        if (signerType.includes('Ed25519')) {
            if (!publicKey) throw new Error('No public key found');
            const secret = signerType.includes('subwallet') ? getSubWalletSecret(publicKey) : getSignerSecret(publicKey);
            if (!secret) throw new Error('No secret found');
            console.log('signXDR:', xdrString, signerType, publicKey, secret);
            const keypair = Keypair.fromSecret(secret);

            try {
                // TODO Use Transaction.fromXDR for SEP-10 challenge transactions
                const transaction = new Transaction(
                    xdrString,
                    env.NEXT_PUBLIC_NETWORK_PASSPHRASE
                );
                transaction.sign(keypair);
                return transaction.toXDR();
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
            const transaction = TransactionBuilder.fromXDR(xdrString, env.NEXT_PUBLIC_NETWORK_PASSPHRASE);
            return account.sign(transaction, { keyId });
        } else {
            throw new Error('Invalid signer type');
        }
    }

    const removeSubWallet = async (publicKey: string) => {
        if (!contract) {
            toast.error('Contract not initialized');
            return;
        }
        if (!keyId) {
            toast.error('KeyId not initialized');
            return;
        }
        const at = await contract.remove_wallet({
            user: Keypair.fromPublicKey(publicKey).rawPublicKey(),
        });

        const signedTx = await account.sign(at, { keyId });

        const res = await server.send(signedTx);

        console.log(res);

        localStorage.setItem(
            "zg:subwallets",
            JSON.stringify(
                getSubWallets().delete(publicKey)
            ),
        );

        getSubWallets();
    }

    // async function attach_Policy(signerPublicKey: string, policyId) {
    //     try {
    //         const ed25519_limits = new Map();

    //         // ed25519 key can call do_math contract but only if it also calls the do_math policy
    //         ed25519_limits.set(import.meta.env.PUBLIC_DO_MATH, [SignerKey.Policy(import.meta.env.PUBLIC_DO_MATH_POLICY)])

    //         const at = await account.addEd25519(signerPublicKey, new Map(), SignerStore.Temporary);



    //         const at = await pk_wallet.addEd25519(
    //             keypair.publicKey(),
    //             ed25519_limits,
    //             SignerStore.Temporary
    //         );

    //         await pk_wallet.sign(at, { keyId: keyId_ });
    //         const res = await pk_server.send(at.built!);

    //         console.log(res);
    //     } finally {
    //         loading.set("attach_Policy", false);
    //         loading = loading
    //     }
    // }

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
        transfer,
        keyId,
        signXDR,
        getKeypair,
        isConnecting,
        removeSubWallet
    }
}