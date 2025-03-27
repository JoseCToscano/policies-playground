'use client'

import { useEffect, useState } from 'react'
import { Button } from "~/components/ui/button"
import { useSmartWallet } from '~/hooks/useSmartWallet'
import { copyToClipboard, fromStroops, shortAddress } from '~/lib/utils'
import {
  Copy,
  ScanFaceIcon,
  Plus,
  Loader2,
} from "lucide-react"
import { Keypair } from '@stellar/stellar-sdk'
import { useSep10 } from '~/hooks/useSep10'
import { AccountSwitcher } from '~/app/_components/account-switcher'
import { api } from '~/trpc/react'
import { toast } from 'react-hot-toast'
import { ContractCall } from '~/app/home/_components/contract-call'
import { SignerInfo, SignersList, StoredSigners } from '~/app/home/_components/signers-list'
import { Policy, PoliciesVault } from '~/app/home/_components/policies-vault'
const USDC = "USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const EURC = "EURC-GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO";

export default function PasskeyCreation() {
  const [status, setStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { create, connect, getWalletSigners, signXDR, addSubWallet, transfer, subWallets, removeSubWallet, fundWallet, keyId, balance, contractId, addSigner_Ed25519, loading, signers, isFunding, getWalletBalance, attachPolicy } = useSmartWallet();

  const [isTransfering, setIsTransfering] = useState(false);
  const [isAttachingPolicy, setIsAttachingPolicy] = useState(false);

  const { getAuthChallenge, submitAuthChallenge } = useSep10();

  const { data: contractBalance } = api.stellar.getContractBalance.useQuery({ contractAddress: contractId! }, {
    enabled: !!contractId
  });

  useEffect(() => {
    console.log('balance changed, Page', balance);
  }, [balance]);

  useEffect(() => {
    console.log('contractBalance changed, Page', contractBalance);
  }, [contractBalance]);

  const handleTransfer = async ({ keypair, to, amount }: { keyId?: string, keypair?: Keypair, to: string, amount: number }) => {
    setIsTransfering(true);
    await transfer({ keypair, to, amount, keyId });
    setIsTransfering(false);
  }

  const handleAddSigner = async () => {
    console.log("Adding signer ...");
    try {
      // Prompt for signer details
      const name = prompt("Enter a name for this signer:");
      const purpose = prompt("Enter the purpose for this signer (e.g., 'Backup', 'Operations', 'Treasury'):");

      console.log('Signer details:', { name, purpose, contractId });

      if (!name || !purpose || !contractId) {
        toast.error("Please provide both name and purpose for the signer");
        return;
      }

      const { keypair } = await addSigner_Ed25519();

      if (keypair) {
        console.log("Signer added:", keypair.publicKey());

        // Store signer information in localStorage
        const signerInfo: SignerInfo = {
          publicKey: keypair.publicKey(),
          name,
          addedAt: new Date().toISOString(),
          purpose,
          walletId: contractId
        };

        console.log('Storing signer info:', signerInfo);

        // Get existing signers or initialize empty object
        const existingSigners: StoredSigners = JSON.parse(localStorage.getItem("zg:wallet_signers") || "{}");
        console.log('Existing signers before update:', existingSigners);

        // Add new signer to the wallet's signer array
        if (!existingSigners[contractId]) {
          existingSigners[contractId] = [];
        }
        existingSigners[contractId].push(signerInfo);

        // Save back to localStorage
        localStorage.setItem("zg:wallet_signers", JSON.stringify(existingSigners));
        console.log('Updated signers in localStorage:', existingSigners);

        toast.success(`Signer ${name} added successfully`);

        // Force a refresh of the signers list
        const event = new Event('storage');
        window.dispatchEvent(event);
      } else {
        console.error("Failed to add signer");
        toast.error("Failed to add signer");
      }
      await getWalletSigners();
    } catch (error) {
      console.error("Error adding signer:", error);
      toast.error("Failed to add signer");
    }
  }

  const handleAddSubWallet = async () => {
    console.log("Adding subwallet ...");
    await addSubWallet();
    await getWalletSigners();
  }

  const handleRemoveSigner = async (key: string) => {
    // TODO: Implement remove signer functionality
    console.log("Removing signer:", key)
  }

  const handleAttachPolicy = async (policy: Policy) => {
    try {
      setIsAttachingPolicy(true);

      // Get the first signer's public key (we'll assume we have at least one signer)
      // In a real app, you might want to select which signer to attach the policy to
      const signerKey = signers && signers.length > 0
        ? signers[0].key
        : null;

      if (!signerKey) {
        toast.error("No signer available to attach policy");
        return;
      }

      const result = await attachPolicy(
        signerKey,
        policy.contractIdToLimit,
        policy.policyId
      );

      console.log("Policy attached successfully:", result);
      toast.success("Policy attached to signer");

    } catch (error) {
      console.error("Error attaching policy:", error);
      toast.error("Failed to attach policy");
    } finally {
      setIsAttachingPolicy(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mt-6 grid gap-6 md:grid-cols-[240px_1fr]">
          {/* Left Section */}
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-100 bg-white p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-medium text-gray-600">Total Balance</h2>
                {contractId && (
                  <button
                    onClick={() => { fundWallet(contractId!) }}
                    className="text-xs text-gray-500 hover:text-gray-900"
                  >
                    {isFunding ? "Funding..." : "Fund wallet"}
                  </button>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <span className="text-xl text-gray-900 font-normal tracking-tight">
                    <span className="text-gray-400 mr-1.5">$</span>
                    {fromStroops(contractBalance?.[USDC] ?? "0", 2)} USD
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-xl text-gray-900 font-normal tracking-tight">
                    <span className="text-gray-400 mr-1.5">€</span>
                    {fromStroops(contractBalance?.[EURC] ?? "0", 2)} EUR
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-50">
                  <span className="text-sm text-gray-500">
                    {fromStroops(balance)} XLM
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-600">
                    {contractId ? "Smart Wallet" : "Connect Wallet"}
                  </h3>
                  {contractId && (
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs text-gray-500 font-mono">{shortAddress(contractId)}</span>
                      <button
                        onClick={() => copyToClipboard(contractId)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {!contractId && keyId && (
                  <Button
                    onClick={() => connect(keyId!)}
                    className="w-full bg-gray-900 text-xs text-white hover:bg-black"
                  >
                    <ScanFaceIcon className="mr-2 h-3.5 w-3.5" />
                    Connect
                  </Button>
                )}
                {!contractId && (
                  <Button
                    onClick={() => create()}
                    className="w-full bg-gray-900 text-xs text-white hover:bg-black"
                  >
                    <ScanFaceIcon className="mr-2 h-3.5 w-3.5" />
                    Create Smart Wallet
                  </Button>
                )}
                {contractId && (
                  <Button
                    onClick={handleAddSigner}
                    className="w-full bg-gray-900 text-xs text-white hover:bg-black"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Adding Signer...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-3.5 w-3.5" />
                        Add Signer
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            {contractId && <PoliciesVault
              walletId={contractId}
              onPolicyAttach={handleAttachPolicy}
            />}
          </div>

          {/* Main Content */}
          <div className="space-y-4">
            {contractId && (
              <>
                <SignersList walletId={contractId} />
                <ContractCall
                  mainWalletId={contractId}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

