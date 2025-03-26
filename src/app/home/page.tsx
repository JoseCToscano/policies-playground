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
  Code2,
  CircleDollarSign,
  EuroIcon,
  StarIcon,
  Combine
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
import { cn } from '~/lib/utils'
import { type RouterOutputs } from "~/trpc/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip"
import { SAC_FUNCTION_DOCS } from "~/lib/constants/sac";

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

interface ContractFunction {
  name: string;
  parameters: Array<{
    name: string;
    type: string;
  }>;
}

function SignerModal({ signer, policies, onClose }: {
  signer: SignerInfo,
  policies: Policy[],
  onClose: () => void
}) {
  const [attachedPolicies, setAttachedPolicies] = useState<Policy[]>([]);

  useEffect(() => {
    // TODO: Load attached policies for this signer
    setAttachedPolicies([]);
  }, [signer]);

  return (
    <DialogContent className="max-w-4xl p-0 gap-0">
      <div className="grid grid-cols-[1fr_300px]">
        {/* Main Content */}
        <div className="p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <span className="text-sm font-medium text-gray-600">
                  {signer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                  {signer.name}
                  <Badge className="bg-gray-100 text-xs font-normal text-gray-600">
                    {signer.purpose}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2">
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

          <div className="mt-6 space-y-6">
            {/* Destination URL Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-900">Destination URL</Label>
                <Badge variant="outline" className="text-xs font-normal">
                  PRO
                </Badge>
              </div>
              <div className="flex gap-2">
                <Input value={signer.publicKey} readOnly className="font-mono text-sm" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(signer.publicKey)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Policies Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-gray-900 block">Attached Policies</Label>
                  <p className="text-sm text-gray-500 mt-1">Manage policies that control this signer's permissions</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Attach Policy
                </Button>
              </div>

              {attachedPolicies.length === 0 ? (
                <div className="rounded-md border border-dashed border-gray-200 p-8 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No policies attached</h3>
                  <p className="text-sm text-gray-500 mb-4">Add policies to control this signer's permissions</p>
                  <Button variant="outline" size="sm" onClick={() => { }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Attach Policy
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {attachedPolicies.map((policy) => (
                    <div
                      key={policy.id}
                      className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white">
                          <FileText className="h-5 w-5 text-gray-500" />
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
                          <p className="text-xs text-gray-500 mt-1">{policy.description}</p>
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
          </div>
        </div>

        {/* Right Panel */}
        <div className="border-l border-gray-100 p-6 space-y-6 bg-gray-50">
          {/* Quick Actions */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Quick Actions</h4>
            <div className="grid gap-2">
              <Button variant="outline" className="w-full justify-start">
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transfer
              </Button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-6 border-t border-gray-200">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-red-600">Danger Zone</h4>
              <p className="text-xs text-gray-500">These actions cannot be undone</p>
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 border-red-200">
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Signer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

interface PopularContract {
  name: string;
  description: string;
  address: string;
  icon: React.ReactNode;
}

const popularContracts: PopularContract[] = [
  {
    name: "Native XLM",
    description: "Stellar's native token",
    address: "native",
    icon: <StarIcon className="h-3.5 w-3.5" />
  },
  {
    name: "USDC Token",
    description: "Circle's USD Coin on Stellar",
    address: "USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    icon: <CircleDollarSign className="h-3.5 w-3.5" />
  },
  {
    name: "EURC Token",
    description: "Circle's Euro Coin on Stellar",
    address: "EURC-GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO",
    icon: <EuroIcon className="h-3.5 w-3.5" />
  },
  {
    name: "Blend",
    description: "Blend Protocol",
    address: "CCHZKMVGSP3N4YEHD4EFHA6UKND5NDVP4COTAFENAFMPRNTEC2U2ST5F",
    icon: <Combine className="h-3.5 w-3.5" />
  }
];

// Helper to determine if a function is read-only
const isReadOnlyFunction = (name: string): boolean => {
  return ['balance', 'allowance', 'decimals', 'name', 'symbol'].includes(name);
};

// Helper to validate parameter input based on type
const validateParam = (value: string, type: string): boolean => {
  switch (type) {
    case 'address':
      return value.length === 56; // Stellar address length
    case 'i128':
    case 'u128':
      return !isNaN(Number(value)) && value !== '';
    case 'u32':
      return !isNaN(Number(value)) && Number(value) >= 0 && Number.isInteger(Number(value));
    default:
      return true;
  }
};

// Helper to get placeholder for parameter type
const getPlaceholder = (type: string): string => {
  switch (type) {
    case 'address':
      return 'G... (56 characters)';
    case 'i128':
    case 'u128':
      return '0';
    case 'u32':
      return '0 (positive integer)';
    default:
      return `Enter ${type}`;
  }
};

const ContractCall = ({ signer, mainWalletId }: { signer?: string; mainWalletId?: string }) => {
  const [contractAddress, setContractAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [functionParams, setFunctionParams] = useState<Record<string, string>>({});
  const [paramErrors, setParamErrors] = useState<Record<string, string>>({});

  const handleContractSelect = (contract: PopularContract) => {
    if (contract.address) {
      setContractAddress(contract.address);
    }
  };

  const { data: contractMetadata, isLoading: isLoadingMetadata } = api.stellar.getContractMetadata.useQuery(
    { contractAddress },
    { enabled: contractAddress.length > 0 }
  );

  useEffect(() => {
    if (contractMetadata) {
      setMetadata(contractMetadata);
      // Reset function selection when contract changes
      setSelectedFunction(null);
      setFunctionParams({});
    }
  }, [contractMetadata]);

  // Handle function selection
  const handleFunctionSelect = (functionName: string) => {
    setSelectedFunction(functionName);
    setFunctionParams({});
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, functionName: string) => {
    const functions = metadata?.functions || [];
    const currentIndex = functions.findIndex((f: ContractFunction) => f.name === functionName);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < functions.length - 1) {
          setSelectedFunction(functions[currentIndex + 1].name);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          setSelectedFunction(functions[currentIndex - 1].name);
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleFunctionSelect(functionName);
        break;
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Test Contract Call</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Test smart contract functions with any signer
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium">Popular Contracts</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {popularContracts.map((contract) => (
                <button
                  key={contract.address}
                  onClick={() => handleContractSelect(contract)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border p-2 text-left transition-colors hover:bg-muted",
                    contractAddress === contract.address && "border-primary bg-muted"
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background">
                    {contract.icon}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate text-sm font-medium">{contract.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {contract.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Contract Address</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <Input
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                className="font-mono text-sm"
                placeholder="Enter contract address"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(contractAddress);
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {isLoadingMetadata && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {metadata && (
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column: Contract Info & Functions */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {metadata.name && (
                    <div>
                      <Label className="text-xs font-medium">Name</Label>
                      <div className="mt-1.5 text-sm">{metadata.name}</div>
                    </div>
                  )}
                  {metadata.symbol && (
                    <div>
                      <Label className="text-xs font-medium">Symbol</Label>
                      <div className="mt-1.5 text-sm">{metadata.symbol}</div>
                    </div>
                  )}
                  {metadata.decimals !== undefined && (
                    <div>
                      <Label className="text-xs font-medium">Decimals</Label>
                      <div className="mt-1.5 text-sm">{metadata.decimals}</div>
                    </div>
                  )}
                  {metadata.totalSupply && (
                    <div>
                      <Label className="text-xs font-medium">Total Supply</Label>
                      <div className="mt-1.5 text-sm">{metadata.totalSupply}</div>
                    </div>
                  )}
                  {metadata.version && (
                    <div>
                      <Label className="text-xs font-medium">Version</Label>
                      <div className="mt-1.5 text-sm">{metadata.version}</div>
                    </div>
                  )}
                </div>

                {metadata.functions.length > 0 && (
                  <div>
                    <Label className="text-xs font-medium">Available Functions</Label>
                    <div className="mt-1.5 max-h-[300px] overflow-y-auto rounded-md border">
                      {metadata.functions.map((fn: any) => (
                        <TooltipProvider key={fn.name}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleFunctionSelect(fn.name)}
                                onKeyDown={(e) => handleKeyDown(e, fn.name)}
                                className={cn(
                                  "w-full border-b p-3 text-left transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                  selectedFunction === fn.name && "bg-muted",
                                  "last:border-b-0",
                                  isReadOnlyFunction(fn.name) ? "hover:bg-blue-50" : "hover:bg-orange-50"
                                )}
                                tabIndex={0}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm">{fn.name}</span>
                                    <Badge
                                      variant={isReadOnlyFunction(fn.name) ? "secondary" : "outline"}
                                      className={cn(
                                        "text-[10px] px-1 py-0 h-4",
                                        isReadOnlyFunction(fn.name)
                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                          : "bg-orange-50 text-orange-700 border-orange-200"
                                      )}
                                    >
                                      {isReadOnlyFunction(fn.name) ? "read" : "write"}
                                    </Badge>
                                  </div>
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                    {fn.parameters.length} params
                                  </Badge>
                                </div>
                                {fn.parameters.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {fn.parameters.map((param: any) => (
                                      <div key={param.name} className="flex items-center gap-2 text-xs">
                                        <Badge
                                          variant="outline"
                                          className={cn(
                                            "font-mono text-[10px]",
                                            param.type === 'address' && "bg-purple-50 border-purple-200 text-purple-700",
                                            param.type.startsWith('i') && "bg-green-50 border-green-200 text-green-700",
                                            param.type.startsWith('u') && "bg-yellow-50 border-yellow-200 text-yellow-700"
                                          )}
                                        >
                                          {param.type}
                                        </Badge>
                                        <span className="font-mono text-muted-foreground">
                                          {param.name}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[300px]">
                              <p className="text-xs">{SAC_FUNCTION_DOCS[fn.name]}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Function Parameters & Execution */}
              <div className="space-y-4">
                <div className="border rounded-md">
                  <Tabs defaultValue="functions" className="w-full">
                    <TabsList className="w-full grid grid-cols-3">
                      <TabsTrigger value="functions">Functions</TabsTrigger>
                      <TabsTrigger value="enums">Enums</TabsTrigger>
                      <TabsTrigger value="unions">Unions & Structs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="functions" className="p-4 space-y-4">
                      {selectedFunction ? (
                        <>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-xs font-medium">Function Parameters</Label>
                              <p className="text-xs text-muted-foreground">
                                {metadata.functions
                                  .find((fn: any) => fn.name === selectedFunction)
                                  ?.parameters.length === 0
                                  ? "This function doesn't require any parameters"
                                  : `Enter parameters for ${selectedFunction}`}
                              </p>
                            </div>
                            <Badge
                              variant={isReadOnlyFunction(selectedFunction) ? "secondary" : "outline"}
                              className={cn(
                                "text-xs",
                                isReadOnlyFunction(selectedFunction)
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-orange-50 text-orange-700 border-orange-200"
                              )}
                            >
                              {isReadOnlyFunction(selectedFunction) ? "Read-Only" : "Write"}
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            {metadata.functions
                              .find((fn: any) => fn.name === selectedFunction)
                              ?.parameters.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-6 px-4 border rounded-md bg-gray-50/50">
                                <Terminal className="h-8 w-8 text-gray-400 mb-3" />
                                <p className="text-sm text-center text-muted-foreground mb-1">
                                  Ready to query {selectedFunction}()
                                </p>
                                <p className="text-xs text-center text-muted-foreground">
                                  This is a direct call that returns {selectedFunction === 'decimals' ? 'a number' : 'a string'}
                                </p>
                              </div>
                            ) : (
                              metadata.functions
                                .find((fn: any) => fn.name === selectedFunction)
                                ?.parameters.map((param: any) => (
                                  <div key={param.name} className="space-y-1.5">
                                    <Label className="text-xs flex items-center justify-between">
                                      <span className="font-mono">{param.name}</span>
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "font-mono text-[10px]",
                                          param.type === 'address' && "bg-purple-50 border-purple-200 text-purple-700",
                                          param.type.startsWith('i') && "bg-green-50 border-green-200 text-green-700",
                                          param.type.startsWith('u') && "bg-yellow-50 border-yellow-200 text-yellow-700"
                                        )}
                                      >
                                        {param.type}
                                      </Badge>
                                    </Label>
                                    <div className="relative">
                                      <Input
                                        value={functionParams[param.name] || ""}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setFunctionParams((prev) => ({
                                            ...prev,
                                            [param.name]: value,
                                          }));

                                          // Validate input
                                          if (!validateParam(value, param.type)) {
                                            setParamErrors((prev) => ({
                                              ...prev,
                                              [param.name]: `Invalid ${param.type} value`,
                                            }));
                                          } else {
                                            setParamErrors((prev) => {
                                              const { [param.name]: _, ...rest } = prev;
                                              return rest;
                                            });
                                          }
                                        }}
                                        placeholder={getPlaceholder(param.type)}
                                        className={cn(
                                          "font-mono text-sm h-9",
                                          paramErrors[param.name] && "border-red-500"
                                        )}
                                      />
                                      {paramErrors[param.name] && (
                                        <span className="absolute -bottom-4 left-0 text-xs text-red-500">
                                          {paramErrors[param.name]}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))
                            )}

                            <Button
                              className={cn(
                                "w-full",
                                isReadOnlyFunction(selectedFunction) ? "bg-blue-600 hover:bg-blue-700" : "",
                                metadata.functions
                                  .find((fn: any) => fn.name === selectedFunction)
                                  ?.parameters.length === 0 && "mt-2"
                              )}
                              size="sm"
                              disabled={Object.keys(paramErrors).length > 0}
                            >
                              {isReadOnlyFunction(selectedFunction) ? "Query Function" : "Call Function"}
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-[300px] items-center justify-center text-center">
                          <div className="space-y-2 max-w-[200px]">
                            <FileText className="h-8 w-8 mx-auto text-gray-400" />
                            <p className="text-sm text-muted-foreground">
                              Select a function from the list to view its parameters
                            </p>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="enums" className="p-4 space-y-4">
                      {metadata.enums?.length ? (
                        metadata.enums.map((enum_: any) => (
                          <div key={enum_.name} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-mono text-sm">{enum_.name}</h4>
                              {enum_.isErrorEnum && (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  error
                                </Badge>
                              )}
                            </div>
                            {enum_.doc && (
                              <p className="text-xs text-muted-foreground">{enum_.doc}</p>
                            )}
                            <div className="space-y-1">
                              {enum_.variants.map((variant: any) => (
                                <div key={variant.name} className="flex items-center gap-2 text-xs">
                                  <Badge variant="outline" className="font-mono">
                                    {variant.value}
                                  </Badge>
                                  <span className="font-mono">{variant.name}</span>
                                  {variant.doc && (
                                    <span className="text-muted-foreground">- {variant.doc}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          No enums found in contract
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="unions" className="p-4 space-y-4">
                      {metadata.unions?.length ? (
                        metadata.unions.map((union: any) => (
                          <div key={union.name} className="space-y-2">
                            <h4 className="font-mono text-sm">{union.name}</h4>
                            {union.doc && (
                              <p className="text-xs text-muted-foreground">{union.doc}</p>
                            )}
                            <div className="space-y-1">
                              {union.cases.map((case_: any) => (
                                <div key={case_.name} className="flex items-center gap-2 text-xs">
                                  <span className="font-mono">{case_.name}</span>
                                  {case_.type && (
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "font-mono",
                                        case_.type.includes('address') && "bg-purple-50 border-purple-200 text-purple-700",
                                        case_.type.startsWith('i') && "bg-green-50 border-green-200 text-green-700",
                                        case_.type.startsWith('u') && "bg-yellow-50 border-yellow-200 text-yellow-700"
                                      )}
                                    >
                                      {case_.type}
                                    </Badge>
                                  )}
                                  {case_.doc && (
                                    <span className="text-muted-foreground">- {case_.doc}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          No unions or structs found in contract
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

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
    <div className="space-y-2">
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
                className="flex items-center justify-between border border-gray-100 rounded-lg bg-white p-3 cursor-pointer hover:border-gray-200 transition-colors"
                onClick={() => {
                  setSelectedSigner(signer);
                  setIsModalOpen(true);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 border border-gray-100">
                    <span className="text-xs font-medium text-gray-600">
                      {signer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-900">{signer.name}</h3>
                      <Badge className="bg-gray-50 border border-gray-100 text-xs font-normal text-gray-600">
                        {signer.purpose}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="font-mono">{shortAddress(signer.publicKey)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(signer.publicKey);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {new Date(signer.addedAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      /* TODO: Implement share functionality */
                    }}
                    className="flex items-center gap-1.5 rounded-md border border-gray-100 px-2.5 py-1 text-xs text-gray-600 hover:border-gray-200 transition-colors"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-full p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem className="gap-2 text-xs">
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                        <span>Transfer</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-xs">
                        <Terminal className="h-3.5 w-3.5" />
                        <span>Call Contract</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-xs">
                        <FileText className="h-3.5 w-3.5" />
                        <span>Attach Policy</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-xs">
                        <Pencil className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-xs" onClick={() => copyToClipboard(signer.publicKey)}>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Public Key</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-xs">
                        <QrCode className="h-3.5 w-3.5" />
                        <span>Show QR Code</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-xs">
                        <Download className="h-3.5 w-3.5" />
                        <span>Download</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-xs">
                        <Share2 className="h-3.5 w-3.5" />
                        <span>Share</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2 text-xs text-red-600 focus:bg-red-50 focus:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
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
                policies={[]}
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
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-600">Policies</h3>
          <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4 bg-gray-50 border border-gray-100 text-gray-600">
            {policies.length}
          </Badge>
        </div>
        <Button
          onClick={handleAddPolicy}
          variant="ghost"
          size="sm"
          className="text-xs h-7 px-2"
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

      <div className="space-y-1.5">
        {policies.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-100 p-3 text-center">
            <p className="text-xs text-gray-500">No policies attached</p>
          </div>
        ) : (
          policies.map((policy) => (
            <div
              key={policy.id}
              className="flex items-center justify-between rounded-md border border-gray-100 bg-white p-2"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-50 border border-gray-100">
                  <FileText className="h-3.5 w-3.5 text-gray-500" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-900">{policy.name}</h4>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="font-mono">{shortAddress(policy.content)}</span>
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
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem className="text-xs">
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs">
                    <Share2 className="mr-2 h-3.5 w-3.5" />
                    <span>Share</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs" onClick={() => copyToClipboard(policy.content)}>
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    <span>Copy Address</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-xs text-red-600">
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
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
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <AccountSwitcher />
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
            {contractId && <PoliciesVault walletId={contractId} />}
          </div>

          {/* Main Content */}
          <div className="space-y-4">
            {contractId && (
              <>
                <SignersList walletId={contractId} />
                <ContractCall mainWalletId={contractId} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

