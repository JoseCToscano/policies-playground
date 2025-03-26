'use client'

import { useEffect, useState, useCallback } from 'react'
import { Badge } from '~/components/ui/badge'
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { useSmartWallet } from '~/hooks/useSmartWallet'
import { account, copyToClipboard, fromStroops, shortAddress } from '~/lib/utils'
import {
  Copy,
  DollarSign,
  Euro,
  ScanFaceIcon,
  Plus,
  Loader2,
  Share2,
  MoreVertical,
  Pencil,
  QrCode,
  Download,
  Terminal,
  ArrowRightLeft,
  Trash2,
  FileText,
  Code2
} from "lucide-react"
import { SignersActions } from '../_components/signers-actions'
import { Keypair } from '@stellar/stellar-sdk'
import { env } from '~/env'
import { useSep10 } from '~/hooks/useSep10'
import { loadStripeOnramp } from '@stripe/crypto';
import { OnrampElement } from '~/app/_components/stripe-onramp'
import { CryptoElements } from '~/app/_components/stripe-onramp'
import axios from 'axios'
import { AccountSwitcher } from '~/app/_components/account-switcher'
import { api } from '~/trpc/react'
import { toast } from 'react-hot-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"

const USDC = "USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const EURC = "EURC-GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO";

type SignerInfo = {
  publicKey: string;
  name: string;
  addedAt: string;
  purpose: string;
  walletId: string;
}

type StoredSigners = {
  [walletId: string]: SignerInfo[];
}

type PolicyType = 'contract';

type Policy = {
  id: string;
  name: string;
  type: PolicyType;
  content: string; // Contract address
  createdAt: string;
  description: string;
}

type StoredPolicies = {
  [walletId: string]: Policy[];
}

function SignerModal({ signer, policies, onClose }: {
  signer: SignerInfo,
  policies: Policy[],
  onClose: () => void
}) {
  const [selectedTab, setSelectedTab] = useState("general");
  const [attachedPolicies, setAttachedPolicies] = useState<Policy[]>([]);

  useEffect(() => {
    // TODO: Load attached policies for this signer
    setAttachedPolicies([]);
  }, [signer]);

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <span className="text-sm font-medium text-gray-600">
              {signer.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <DialogTitle className="text-xl font-semibold">{signer.name}</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <Badge className="bg-gray-100 text-xs font-normal text-gray-600">
                {signer.purpose}
              </Badge>
              <span className="text-sm text-gray-500">{shortAddress(signer.publicKey)}</span>
              <button
                onClick={() => copyToClipboard(signer.publicKey)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <Tabs defaultValue="general" className="mt-6" onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="sharing">Sharing</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Public Key</Label>
              <div className="flex gap-2">
                <Input value={signer.publicKey} readOnly />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(signer.publicKey)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Added On</Label>
              <Input value={new Date(signer.addedAt).toLocaleDateString()} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Purpose</Label>
              <Input value={signer.purpose} readOnly />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="policies" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">Attached Policies</h4>
              <Button variant="outline" size="sm" onClick={() => { }}>
                <Plus className="h-4 w-4 mr-2" />
                Attach Policy
              </Button>
            </div>

            {attachedPolicies.length === 0 ? (
              <div className="rounded-md border border-dashed border-gray-200 p-4 text-center">
                <p className="text-sm text-gray-500">No policies attached to this signer</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => { }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Attach Policy
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {attachedPolicies.map((policy) => (
                  <div
                    key={policy.id}
                    className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white">
                        <FileText className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{policy.name}</h4>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <span>{shortAddress(policy.content)}</span>
                          <button
                            onClick={() => copyToClipboard(policy.content)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sharing" className="mt-4">
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-100 p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Share Access</h4>
              <p className="text-sm text-gray-500 mb-4">Generate a link to share this signer's access</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <QrCode className="h-4 w-4 mr-2" />
                  Show QR Code
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="mt-4">
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-100 p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Danger Zone</h4>
              <p className="text-sm text-gray-500 mb-4">These actions cannot be undone</p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Signer
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DialogContent>
  );
}

function SignersList({ walletId }: { walletId: string }) {
  const [signers, setSigners] = useState<SignerInfo[]>([]);
  const [selectedSigner, setSelectedSigner] = useState<SignerInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    console.log('Loading signers for wallet:', walletId);
    const storedSigners: StoredSigners = JSON.parse(localStorage.getItem("zg:wallet_signers") || "{}");
    console.log('All stored signers:', storedSigners);
    console.log('Signers for this wallet:', storedSigners[walletId] || []);
    setSigners(storedSigners[walletId] || []);
  }, [walletId]);

  useEffect(() => {
    const interval = setInterval(() => {
      const storedSigners: StoredSigners = JSON.parse(localStorage.getItem("zg:wallet_signers") || "{}");
      setSigners(storedSigners[walletId] || []);
    }, 1000);

    return () => clearInterval(interval);
  }, [walletId]);

  if (signers.length === 0) {
    console.log('No signers found for wallet:', walletId);
    return null;
  }

  return (
    <div className="space-y-4">
      {signers.map((signer) => (
        <div key={signer.publicKey}>
          <Dialog open={isModalOpen && selectedSigner?.publicKey === signer.publicKey} onOpenChange={(open) => {
            if (!open) {
              setSelectedSigner(null);
            }
            setIsModalOpen(open);
          }}>
            <DialogTrigger asChild>
              <div
                className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  setSelectedSigner(signer);
                  setIsModalOpen(true);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <span className="text-sm font-medium text-gray-600">
                      {signer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-900">{signer.name}</h3>
                      <Badge className="bg-gray-100 text-xs font-normal text-gray-600">
                        {signer.purpose}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{shortAddress(signer.publicKey)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(signer.publicKey);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    {new Date(signer.addedAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      /* TODO: Implement share functionality */
                    }}
                    className="flex items-center gap-1.5 rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem className="gap-2">
                        <ArrowRightLeft className="h-4 w-4" />
                        <span>Transfer</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Terminal className="h-4 w-4" />
                        <span>Call Contract</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Attach Policy</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Pencil className="h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" onClick={() => copyToClipboard(signer.publicKey)}>
                        <Copy className="h-4 w-4" />
                        <span>Copy Public Key</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <QrCode className="h-4 w-4" />
                        <span>Show QR Code</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Share2 className="h-4 w-4" />
                        <span>Share</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2 text-red-600 focus:bg-red-50 focus:text-red-600">
                        <Trash2 className="h-4 w-4" />
                        <span>Remove</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </DialogTrigger>
            {selectedSigner && (
              <SignerModal
                signer={selectedSigner}
                policies={[]} // TODO: Pass actual policies
                onClose={() => {
                  setSelectedSigner(null);
                  setIsModalOpen(false);
                }}
              />
            )}
          </Dialog>
        </div>
      ))}
    </div>
  );
}

function PoliciesVault({ walletId }: { walletId: string }) {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const storedPolicies: StoredPolicies = JSON.parse(localStorage.getItem("zg:wallet_policies") || "{}");
    setPolicies(storedPolicies[walletId] || []);
  }, [walletId]);

  const handleAddPolicy = () => {
    const name = prompt("Enter a name for this policy:");
    const description = prompt("Enter a description for this policy:");
    const address = prompt("Enter the smart contract address:");

    if (!name || !description || !address) {
      toast.error("Please provide all policy details");
      return;
    }

    setIsAdding(true);
    try {
      const newPolicy: Policy = {
        id: crypto.randomUUID(),
        name,
        type: 'contract',
        content: address,
        createdAt: new Date().toISOString(),
        description
      };

      // Update localStorage
      const storedPolicies: StoredPolicies = JSON.parse(localStorage.getItem("zg:wallet_policies") || "{}");
      if (!storedPolicies[walletId]) {
        storedPolicies[walletId] = [];
      }
      storedPolicies[walletId].push(newPolicy);
      localStorage.setItem("zg:wallet_policies", JSON.stringify(storedPolicies));

      // Update state
      setPolicies(prev => [...prev, newPolicy]);
      toast.success('Policy added successfully');
    } catch (error) {
      console.error('Error adding policy:', error);
      toast.error('Failed to add policy');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base text-gray-600">Policies</h3>
          <Badge variant="secondary" className="text-xs">
            {policies.length}
          </Badge>
        </div>
        <Button
          onClick={handleAddPolicy}
          variant="ghost"
          size="sm"
          className="text-xs"
          disabled={isAdding}
        >
          {isAdding ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="mr-1 h-3 w-3" />
              Add
            </>
          )}
        </Button>
      </div>

      <div className="space-y-2">
        {policies.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-500">No policies attached</p>
          </div>
        ) : (
          policies.map((policy) => (
            <div
              key={policy.id}
              className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 p-3"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white">
                  <FileText className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{policy.name}</h4>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span>{shortAddress(policy.content)}</span>
                    <button
                      onClick={() => copyToClipboard(policy.content)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share2 className="mr-2 h-4 w-4" />
                    <span>Share</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => copyToClipboard(policy.content)}>
                    <Copy className="mr-2 h-4 w-4" />
                    <span>Copy Address</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function PasskeyCreation() {
  const [status, setStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { create, connect, getWalletSigners, signXDR, addSubWallet, transfer, subWallets, removeSubWallet, fundWallet, keyId, balance, contractId, addSigner_Ed25519, loading, signers, isFunding, getWalletBalance, } = useSmartWallet();

  const [isTransfering, setIsTransfering] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <AccountSwitcher />
        <div className="mt-8 grid gap-8 md:grid-cols-[280px_1fr]">
          {/* Left Section */}
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-base text-gray-600">Total Balance</h2>
                {contractId && (
                  <button
                    onClick={() => { fundWallet(contractId!) }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    {isFunding ? "Funding..." : "Fund wallet"}
                  </button>
                )}
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <span className="text-2xl text-gray-900 font-normal">
                    <span className="text-gray-400 mr-2">$</span>
                    {fromStroops(contractBalance?.[USDC] ?? "0", 2)} USD
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl text-gray-900 font-normal">
                    <span className="text-gray-400 mr-2">€</span>
                    {fromStroops(contractBalance?.[EURC] ?? "0", 2)} EUR
                  </span>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <span className="text-base text-gray-500">
                    {fromStroops(balance)} XLM
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base text-gray-600">
                    {contractId ? "Smart Wallet" : "Connect Wallet"}
                  </h3>
                  {contractId && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{shortAddress(contractId)}</span>
                      <button
                        onClick={() => copyToClipboard(contractId)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {!contractId && keyId && (
                  <Button
                    onClick={() => connect(keyId!)}
                    className="w-full bg-black text-sm text-white hover:bg-gray-900"
                  >
                    <ScanFaceIcon className="mr-2 h-4 w-4" />
                    Connect
                  </Button>
                )}
                {!contractId && (
                  <Button
                    onClick={() => create()}
                    className="w-full bg-black text-sm text-white hover:bg-gray-900"
                  >
                    <ScanFaceIcon className="mr-2 h-4 w-4" />
                    Create Smart Wallet
                  </Button>
                )}
                {contractId && (
                  <Button
                    onClick={handleAddSigner}
                    className="w-full bg-black text-sm text-white hover:bg-gray-900"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Signer...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Signer
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            {contractId && <PoliciesVault walletId={contractId} />}
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {contractId && <SignersList walletId={contractId} />}
          </div>
        </div>
      </div>
    </div>
  )
}

