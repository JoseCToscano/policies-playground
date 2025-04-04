'use client'

import { useEffect, useState, Suspense } from 'react'
import { Button } from "~/components/ui/button"
import { useSmartWallet } from '~/hooks/useSmartWallet'
import { copyToClipboard, fromStroops, shortAddress } from '~/lib/utils'
import {
  Copy,
  ScanFaceIcon,
  Plus,
  Loader2,
  Fingerprint,
} from "lucide-react"
import { Keypair } from '@stellar/stellar-sdk'
import { useSep10 } from '~/hooks/useSep10'
import { AccountSwitcher } from '~/app/_components/account-switcher'
import { api } from '~/trpc/react'
import { toast } from 'react-hot-toast'
import { ContractCall } from '~/app/home/_components/contract-call'
import { SignerInfo, SignersList, StoredSigners } from '~/app/home/_components/signers-list'
import { Policy, PoliciesVault } from '~/app/home/_components/policies-vault'
import { Badge } from "~/components/ui/badge"
const USDC = "USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const EURC = "EURC-GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO";

function HomeContent() {
  const { create, connect, getWalletSigners, fundWallet, keyId, balance, contractId, addSigner_Ed25519, loading, isFunding, getWalletBalance, attachPolicy, isConnecting } = useSmartWallet();

  const [isAttachingPolicy, setIsAttachingPolicy] = useState(false);


  const { data: contractBalance } = api.stellar.getContractBalance.useQuery({ contractAddress: contractId! }, {
    enabled: !!contractId
  });

  useEffect(() => {
    console.log('balance changed, Page', balance);
  }, [balance]);

  useEffect(() => {
    console.log('contractBalance changed, Page', contractBalance);
  }, [contractBalance]);


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

  const handleAttachPolicy = async (policy: Policy, signerKey: string) => {
    try {
      setIsAttachingPolicy(true);

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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto px-12 py-6 pb-24">
        <div className="mt-6 grid gap-6 md:grid-cols-[320px_1fr]">
          {/* Left Section - Dashboard Sidebar */}
          <div className="flex flex-col space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              {/* Wallet Header */}
              <div className="border-b border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-indigo-500" />
                  <h2 className="text-sm font-medium text-gray-700">Biometric Smart Wallet</h2>
                </div>
                {contractId && (
                  <div className="mt-1 flex items-center space-x-1.5">
                    <Badge
                      variant="secondary"
                      className="px-2 py-0 h-5 bg-gray-50 border border-gray-200 hover:bg-gray-100"
                    >
                      <span className="text-xs text-gray-600 font-mono">{shortAddress(contractId)}</span>
                      <button
                        onClick={() => copyToClipboard(contractId)}
                        className="ml-1.5 text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </Badge>
                  </div>
                )}
              </div>

              {/* Wallet Balance Section */}
              <div className="p-4">
                {contractId ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-medium text-gray-500">Total Balance</h3>
                      <button
                        onClick={() => { fundWallet(contractId) }}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        {isFunding ? (
                          <span className="flex items-center">
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Funding...
                          </span>
                        ) : "Fund wallet"}
                      </button>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center">
                        <span className="text-base text-gray-900 font-medium tracking-tight">
                          <span className="text-gray-400 mr-1.5">$</span>
                          {fromStroops(contractBalance?.[USDC] ?? "0", 2)} USD
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-base text-gray-900 font-medium tracking-tight">
                          <span className="text-gray-400 mr-1.5">€</span>
                          {fromStroops(contractBalance?.[EURC] ?? "0", 2)} EUR
                        </span>
                      </div>
                      <div className="pt-2 border-t border-gray-50">
                        <span className="text-xs text-gray-500">
                          {fromStroops(balance)} XLM
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <div className="mx-auto h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                      <Fingerprint className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">Get Started with Smart Wallet</h3>
                    <p className="text-xs text-gray-500 mb-6">Create a secure biometric wallet to manage your digital assets with enhanced security.</p>
                    <div className="space-y-3">
                      {keyId && (
                        <Button
                          onClick={() => connect(keyId)}
                          className="w-full bg-white border-2 border-indigo-600 text-xs text-indigo-600 hover:bg-indigo-50"
                        >
                          <ScanFaceIcon className="mr-2 h-3.5 w-3.5" />
                          Connect Existing Wallet
                        </Button>
                      )}
                      <Button
                        onClick={() => create()}
                        className="w-full bg-indigo-600 text-xs text-white hover:bg-indigo-700"
                        disabled={isConnecting}
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            Creating Wallet...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-3.5 w-3.5" />
                            Create New Wallet
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Wallet Actions */}
                {contractId && (
                  <div className="space-y-2">
                    <Button
                      onClick={handleAddSigner}
                      className="w-full bg-indigo-600 text-xs text-white hover:bg-indigo-700"
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
                  </div>
                )}
              </div>
            </div>

            {/* Signers Section - Added to sidebar */}
            {contractId && (
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">Signers</h3>
                    <Button
                      onClick={handleAddSigner}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-gray-100"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="mr-1 h-3 w-3" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <SignersList walletId={contractId} onAttachPolicy={handleAttachPolicy} />
                </div>
              </div>
            )}

            {/* Policies Section */}
            {contractId && (
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <PoliciesVault
                  walletId={contractId}
                />
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="space-y-4">
            {contractId && (
              <ContractCall mainWalletId={contractId} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}

