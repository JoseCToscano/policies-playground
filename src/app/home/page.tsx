'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import * as z from "zod"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner"
import { Keypair, Operation, ScVal, Server, SorobanRpc, TimeoutInfinite, Transaction, TransactionBuilder, Networks, Asset, Memo, BASE_FEE, Account } from '@stellar/stellar-sdk';
import { api } from "~/trpc/react"
import { useSep10 } from "~/hooks/useSep10";
import { SignerKey, SignerLimits, SignerStore, useSmartWallet } from "~/hooks/useSmartWallet";
import { ColumnDef } from "@tanstack/react-table"
import { ethers } from "ethers"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime";
import { FunctionForm } from "../_components/function-form";
import { TransactionsDialog } from "../_components/transactions";
import { TransfersDialog } from "../_components/transfers";

dayjs.extend(relativeTime);

if (typeof window !== 'undefined') {
  console.log('💫 Smart Wallet Demo App v0.0.1');
}

import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import { Checkbox } from "~/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { DataTable } from "~/components/ui/data-table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command"
import { cn } from "~/lib/utils"

import { PlusIcon, Laptop, ArrowUpDown, ChevronDown, CheckIcon, FileText, MoreVertical, Pencil, X, Loader2, StarIcon, CircleDollarSign, EuroIcon, Wrench, Server, Lock, ChevronsRightLeft, Link2, Trash2, Copy, QrCode, Share2, ArrowRightLeft, Plus, RefreshCcw, Clock, Key, Award, DollarSign, Ban, Wallet, Home, Bookmark, Combine, Users, User, Activity, AlertCircle, Info } from "lucide-react"
import { SignersActions } from '../_components/signers-actions'
import { account, bigIntReplacer, copyToClipboard, fromStroops, shortAddress } from '~/lib/utils'

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

// For storing attached policies
type AttachedPolicy = {
  policyId: string;
  contractIdToLimit: string;
  attachedAt: string;
}

type StoredAttachedPolicies = {
  [signerPublicKey: string]: AttachedPolicy[];
}

interface EnumVariant {
  name: string;
  value: number;
  doc?: string;
}

interface ContractEnum {
  name: string;
  isErrorEnum?: boolean;
  doc?: string;
  variants: EnumVariant[];
}

interface UnionCase {
  name: string;
  type?: string;
  doc?: string;
}

interface ContractUnion {
  name: string;
  doc?: string;
  cases: UnionCase[];
}

interface ContractMetadata {
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: string;
  version?: string;
  functions: any[];
  enums?: ContractEnum[];
  unions?: ContractUnion[];
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
  const [isAttachPolicyModalOpen, setIsAttachPolicyModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadAttachedPolicies = useCallback(() => {
    // Get the attached policies data for this signer
    const attachedPoliciesData: StoredAttachedPolicies = JSON.parse(
      localStorage.getItem("zg:attached_policies") || "{}"
    );

    const signerAttachedPolicies = attachedPoliciesData[signer.publicKey] || [];

    // Map the attached policies to full policy objects
    const fullPolicies = signerAttachedPolicies.map(ap => {
      const policy = policies.find(p => p.id === ap.policyId);
      return policy ? {
        ...policy,
        contractIdToLimit: ap.contractIdToLimit
      } : null;
    }).filter(Boolean) as (Policy & { contractIdToLimit: string })[];

    setAttachedPolicies(fullPolicies);
  }, [signer.publicKey, policies]);

  useEffect(() => {
    loadAttachedPolicies();
  }, [loadAttachedPolicies, refreshKey]);

  const handleAttachPolicy = () => {
    setIsAttachPolicyModalOpen(true);
  };

  const handlePolicyAttached = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleRemovePolicy = (policyId: string, contractIdToLimit: string) => {
    // Remove from localStorage
    const attachedPoliciesData: StoredAttachedPolicies = JSON.parse(
      localStorage.getItem("zg:attached_policies") || "{}"
    );

    if (attachedPoliciesData[signer.publicKey]) {
      attachedPoliciesData[signer.publicKey] = attachedPoliciesData[signer.publicKey]
        .filter(ap => !(ap.policyId === policyId && ap.contractIdToLimit === contractIdToLimit));

      localStorage.setItem("zg:attached_policies", JSON.stringify(attachedPoliciesData));

      // Refresh the list
      setRefreshKey(prev => prev + 1);
      toast.success("Policy removed successfully");
    }
  };

  return (
    <>
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
                  <Button variant="outline" size="sm" onClick={handleAttachPolicy}>
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
                    <Button variant="outline" size="sm" onClick={handleAttachPolicy}>
                      <Plus className="h-4 w-4 mr-2" />
                      Attach Policy
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attachedPolicies.map((policy) => (
                      <div
                        key={`${policy.id}-${(policy as any).contractIdToLimit}`}
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
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <span className="font-medium">Limiting:</span>
                              <span className="font-mono">{shortAddress((policy as any).contractIdToLimit)}</span>
                              <button
                                onClick={() => copyToClipboard((policy as any).contractIdToLimit)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{policy.description}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleRemovePolicy(policy.id, (policy as any).contractIdToLimit)}
                        >
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

      <AttachPolicyModal
        isOpen={isAttachPolicyModalOpen}
        onClose={() => setIsAttachPolicyModalOpen(false)}
        signer={signer}
        policies={policies}
        onPolicyAttached={handlePolicyAttached}
      />
    </>
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
  },
  {
    name: "Zafegard",
    description: "@kalepail's Zafegard Demo",
    address: "CDI7YU6DMWJCGXXEPQGHBKDPBW3DEICDJ5MOTGNJAEEPWMHW4XXPU2PP",
    icon: <Combine className="h-3.5 w-3.5" />
  },
  {
    name: "Do Math",
    description: "@kalepail's Do Math Demo",
    address: "CAXZG5WRNRY4ZDG6UPNFAQ2HY77HPETA7YIQDKFK4JENRVH43X2TREW6",
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

// Helper to check if a parameter is an address type and should get a default value
const shouldUseDefaultAddressValue = (paramName: string, paramType: string): boolean => {
  return paramType === 'address' && ['from', 'source', 'user'].includes(paramName.toLowerCase());
};

const ContractCall = ({ signer, mainWalletId }: { signer?: string; mainWalletId?: string }) => {
  const [contractAddress, setContractAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<ContractMetadata | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [selectedEnum, setSelectedEnum] = useState<string | null>(null);
  const [selectedUnion, setSelectedUnion] = useState<string | null>(null);
  const [functionParams, setFunctionParams] = useState<Record<string, string>>({});
  const [paramErrors, setParamErrors] = useState<Record<string, string>>({});
  const [callResult, setCallResult] = useState<string | null>(null);
  const [callError, setCallError] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const { signXDR, signAndSend } = useSmartWallet();

  const submitXDRMutation = api.stellar.submitXDR.useMutation({
    onSuccess: (data) => {
      toast.success("Function called successfully");
      setCallResult(JSON.stringify(data?.result || { success: true }, null, 2));
      setIsCalling(false);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      setCallError(error.message);
      setIsCalling(false);
    }
  });

  const handleContractSelect = (contract: PopularContract) => {
    if (contract.address) {
      setContractAddress(contract.address);
      // Reset any previous call results
      setCallResult(null);
      setCallError(null);
    }
  };

  const { data: contractMetadata, isLoading: isLoadingMetadata } = api.stellar.getContractMetadata.useQuery(
    { contractAddress },
    { enabled: contractAddress.length > 0 }
  );

  const { mutateAsync: prepareContractCall, isPending: isLoadingPrepareContractCall } = api.stellar.prepareContractCall.useMutation({
    onSuccess: (data) => {
      console.log('prepareContractCall', data);
    }
  });

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

  // Set initial parameter value based on parameter type and name
  const getInitialParamValue = useCallback((param: any) => {
    // For address parameters with specific names, use the wallet ID
    if (shouldUseDefaultAddressValue(param.name, param.type) && mainWalletId) {
      return mainWalletId;
    }
    return "";
  }, [mainWalletId]);

  // When function selection changes, initialize params with default values
  useEffect(() => {
    if (selectedFunction && metadata) {
      const fn = metadata.functions.find((f: any) => f.name === selectedFunction);
      if (fn) {
        const initialParams: Record<string, string> = {};
        fn.parameters.forEach((param: any) => {
          initialParams[param.name] = getInitialParamValue(param);
        });
        setFunctionParams(initialParams);
      }
    }
  }, [selectedFunction, metadata, getInitialParamValue]);

  // Prepare parameters for contract call
  const prepareCallParameters = () => {
    if (!selectedFunction || !metadata) return null;

    const fn = metadata.functions.find((f: any) => f.name === selectedFunction);
    if (!fn) return null;

    const params: Record<string, any> = {};

    for (const param of fn.parameters) {
      const value = functionParams[param.name] || "";

      // Convert values to appropriate types
      if (param.type === 'u32' || param.type === 'i32') {
        params[param.name] = parseInt(value);
      } else if (param.type === 'u64' || param.type === 'i64' ||
        param.type === 'u128' || param.type === 'i128') {
        params[param.name] = value; // Keep as string for big numbers
      } else if (param.type === 'bool') {
        params[param.name] = value.toLowerCase() === 'true';
      } else {
        params[param.name] = value;
      }
    }

    return params;
  };

  // Convert parameter to ScVal based on type
  const paramToScVal = (value: any, type: string) => {
    try {
      // Handle common types
      if (type === 'address') {
        return addressToScVal(value);
      } else if (type === 'u32') {
        return u32ToScVal(Number(value));
      } else if (type === 'i128') {
        return i128ToScVal(value);
      } else if (type === 'u128') {
        return u128ToScVal(value);
      } else if (type === 'bool') {
        return boolToScVal(Boolean(value));
      } else if (type === 'symbol') {
        return stringToSymbol(value);
      } else if (type.startsWith('u64')) {
        return numberToU64(Number(value));
      } else if (type.startsWith('i64')) {
        return numberToI128(Number(value));
      }

      // Default handling for other types
      console.warn(`Unsupported type: ${type}, using default conversion for: ${value}`);
      return value;
    } catch (error) {
      console.error(`Error converting ${value} to ${type}:`, error);
      throw new Error(`Failed to convert parameter of type ${type}: ${error}`);
    }
  };

  // Create XDR for contract function call
  const createContractCallXdr = async (fn: string, params: Record<string, any>) => {
    if (!fn || !contractAddress) return null;

    try {
      const functionParams = metadata?.functions.find((f: ContractFunction) => f.name === fn)?.parameters || [];
      const isReadOnly = isReadOnlyFunction(fn);
      // Build parameters array with correct ScVal conversions
      const scValParams: any[] = functionParams.map((param: { name: string; type: string }) => {
        const value = params[param.name];
        return value //; paramToScVal(value, param.type);
      });
      if (!mainWalletId) {
        throw new Error("Main wallet ID is required");
      }
      const response = await prepareContractCall({ contractAddress, method: fn, args: scValParams, isReadOnly, walletContractId: mainWalletId });
      if (!response) {
        throw new Error("Failed to prepare contract call");
      }
      return response.xdr;
    } catch (error) {
      console.error("Error creating contract call XDR:", error);
      throw error;
    }
  };

  // Execute contract function call
  const executeContractCall = async () => {
    if (!selectedFunction || !contractAddress || !metadata) {
      toast.error("Please select a function and contract first");
      return;
    }

    setIsCalling(true);
    setCallResult(null);
    setCallError(null);

    try {
      const params = prepareCallParameters();
      if (params === null) {
        throw new Error("Failed to prepare parameters");
      }

      // Handle read-only functions differently from write functions
      if (isReadOnlyFunction(selectedFunction)) {
        try {
          // For read-only functions, we can directly query the result
          const result = await fetch('/api/query-contract', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contractAddress,
              method: selectedFunction,
              args: params
            }),
          }).then(res => res.json());

          setCallResult(JSON.stringify(result, null, 2));
          toast.success(`${selectedFunction} called successfully`);
        } catch (error: any) {
          throw new Error(`Contract query failed: ${error.message}`);
        }
      } else {
        // For write functions, we need to generate and submit XDR
        console.log('params:', params);
        const xdr = await createContractCallXdr(selectedFunction, params);
        console.log('xdr:', xdr);
        if (!xdr) {
          throw new Error("Failed to create transaction XDR");
        }

        const result = await signAndSend(xdr, "Secp256r1");
        if (result) {
          toast.success("Function called successfully");
          setCallResult(JSON.stringify(result, bigIntReplacer, 2));
        }

        // Submit the XDR
        // await submitXDRMutation.mutateAsync({ xdr: signedXdr });
      }
    } catch (error: any) {
      console.error("Error calling contract function:", error);
      setCallError(error.message || "Unknown error occurred");
      toast.error(`Error: ${error.message || "Failed to call function"}`);
    } finally {
      setIsCalling(false);
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
            <div className="grid grid-cols-[300px_1fr] gap-4">
              {/* Left Column: Tabs with Lists */}
              <div className="space-y-4">
                <div className="border rounded-md">
                  <Tabs defaultValue="functions" className="w-full">
                    <TabsList className="w-full grid grid-cols-3">
                      <TabsTrigger value="functions">Functions</TabsTrigger>
                      <TabsTrigger value="enums">Enums</TabsTrigger>
                      <TabsTrigger value="unions">Unions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="functions" className="border-t">
                      <div className="max-h-[500px] overflow-y-auto">
                        {metadata.functions.map((fn: any) => (
                          <TooltipProvider key={fn.name}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => {
                                    handleFunctionSelect(fn.name);
                                    setSelectedEnum(null);
                                    setSelectedUnion(null);
                                  }}
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
                    </TabsContent>

                    <TabsContent value="enums" className="border-t">
                      <div className="max-h-[500px] overflow-y-auto">
                        {metadata.enums?.map((enum_: any) => (
                          <button
                            key={enum_.name}
                            onClick={() => {
                              setSelectedFunction(null);
                              setSelectedEnum(enum_.name);
                              setSelectedUnion(null);
                            }}
                            className={cn(
                              "w-full border-b p-3 text-left transition-colors hover:bg-muted",
                              selectedEnum === enum_.name && "bg-muted",
                              "last:border-b-0"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{enum_.name}</span>
                              {enum_.isErrorEnum && (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  error
                                </Badge>
                              )}
                            </div>
                            {enum_.doc && (
                              <p className="mt-1 text-xs text-muted-foreground truncate">{enum_.doc}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="unions" className="border-t">
                      <div className="max-h-[500px] overflow-y-auto">
                        {metadata.unions?.map((union: any) => (
                          <button
                            key={union.name}
                            onClick={() => {
                              setSelectedFunction(null);
                              setSelectedEnum(null);
                              setSelectedUnion(union.name);
                            }}
                            className={cn(
                              "w-full border-b p-3 text-left transition-colors hover:bg-muted",
                              selectedUnion === union.name && "bg-muted",
                              "last:border-b-0"
                            )}
                          >
                            <span className="font-mono text-sm">{union.name}</span>
                            {union.doc && (
                              <p className="mt-1 text-xs text-muted-foreground truncate">{union.doc}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {/* Right Column: Working Area */}
              <div className="border rounded-md p-4">
                {selectedFunction && (
                  <div className="space-y-4">
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
                                  placeholder={shouldUseDefaultAddressValue(param.name, param.type) ? "Current wallet address" : getPlaceholder(param.type)}
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
                        disabled={Object.keys(paramErrors).length > 0 || isCalling}
                        onClick={executeContractCall}
                      >
                        {isCalling ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            {isReadOnlyFunction(selectedFunction) ? "Querying..." : "Submitting..."}
                          </div>
                        ) : (
                          isReadOnlyFunction(selectedFunction) ? "Query Function" : "Call Function"
                        )}
                      </Button>

                      {callResult && (
                        <div className="mt-4 rounded-md bg-gray-50 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-medium text-gray-700">Result</h4>
                            <button
                              onClick={() => copyToClipboard(callResult)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <pre className="text-xs font-mono bg-white rounded border border-gray-100 p-2 overflow-x-auto">
                            {callResult}
                          </pre>
                        </div>
                      )}

                      {callError && (
                        <div className="mt-4 rounded-md bg-red-50 p-3">
                          <h4 className="text-xs font-medium text-red-700 mb-1">Error</h4>
                          <p className="text-xs text-red-600">{callError}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedEnum && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs font-medium">Enum Definition</Label>
                        <p className="text-xs text-muted-foreground">
                          View the variants and documentation for this enum
                        </p>
                      </div>
                      {metadata.enums?.find(e => e.name === selectedEnum)?.isErrorEnum && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          error enum
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-4">
                      {metadata.enums?.find(e => e.name === selectedEnum)?.doc && (
                        <div className="rounded-md bg-muted/50 p-3">
                          <p className="text-sm">
                            {metadata.enums?.find(e => e.name === selectedEnum)?.doc}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        {metadata.enums?.find(e => e.name === selectedEnum)?.variants.map((variant: any) => (
                          <div key={variant.name} className="flex items-start gap-3 p-2 rounded-md border">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                                {variant.value}
                              </Badge>
                              <span className="font-mono text-sm">{variant.name}</span>
                            </div>
                            {variant.doc && (
                              <p className="text-sm text-muted-foreground flex-1">{variant.doc}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedUnion && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-medium">Union Definition</Label>
                      <p className="text-xs text-muted-foreground">
                        View the cases and documentation for this union
                      </p>
                    </div>

                    <div className="space-y-4">
                      {metadata.unions?.find(u => u.name === selectedUnion)?.doc && (
                        <div className="rounded-md bg-muted/50 p-3">
                          <p className="text-sm">
                            {metadata.unions?.find(u => u.name === selectedUnion)?.doc}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        {metadata.unions?.find(u => u.name === selectedUnion)?.cases.map((case_: any) => (
                          <div key={case_.name} className="flex items-start gap-3 p-2 rounded-md border">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{case_.name}</span>
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
                            </div>
                            {case_.doc && (
                              <p className="text-sm text-muted-foreground flex-1">{case_.doc}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {!selectedFunction && !selectedEnum && !selectedUnion && (
                  <div className="flex h-[400px] items-center justify-center text-center">
                    <div className="space-y-2 max-w-[300px]">
                      <FileText className="h-8 w-8 mx-auto text-gray-400" />
                      <p className="text-sm text-muted-foreground">
                        Select a function, enum, or union from the list to view its details
                      </p>
                    </div>
                  </div>
                )}
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);

  const loadPolicies = useCallback(() => {
    const storedPolicies: StoredPolicies = JSON.parse(localStorage.getItem("zg:wallet_policies") || "{}");
    setPolicies(storedPolicies[walletId] || []);
  }, [walletId]);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  const handleEditPolicy = (policy: Policy) => {
    setEditingPolicy(policy);
    setIsAddModalOpen(true);
  };

  const handleDeletePolicy = (policyId: string) => {
    try {
      // Update localStorage
      const storedPolicies: StoredPolicies = JSON.parse(localStorage.getItem("zg:wallet_policies") || "{}");

      if (storedPolicies[walletId]) {
        storedPolicies[walletId] = storedPolicies[walletId].filter(p => p.id !== policyId);
        localStorage.setItem("zg:wallet_policies", JSON.stringify(storedPolicies));

        // Also remove any attached policies that use this policy
        const attachedPolicies: StoredAttachedPolicies = JSON.parse(
          localStorage.getItem("zg:attached_policies") || "{}"
        );

        for (const signerKey in attachedPolicies) {
          attachedPolicies[signerKey] = attachedPolicies[signerKey].filter(ap => ap.policyId !== policyId);
          if (attachedPolicies[signerKey].length === 0) {
            delete attachedPolicies[signerKey];
          }
        }

        localStorage.setItem("zg:attached_policies", JSON.stringify(attachedPolicies));

        // Update state
        setPolicies(prev => prev.filter(p => p.id !== policyId));
        toast.success('Policy deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting policy:', error);
      toast.error('Failed to delete policy');
    }
  };

  const handlePolicySaved = (policy: Policy) => {
    loadPolicies();
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
          onClick={() => {
            setEditingPolicy(null);
            setIsAddModalOpen(true);
          }}
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
                  <DropdownMenuItem className="text-xs" onClick={() => handleEditPolicy(policy)}>
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
                  <DropdownMenuItem
                    className="text-xs text-red-600"
                    onClick={() => handleDeletePolicy(policy.id)}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      <PolicyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        walletId={walletId}
        editPolicy={editingPolicy}
        onPolicySaved={handlePolicySaved}
      />
    </div>
  );
}

function PolicyModal({
  isOpen,
  onClose,
  walletId,
  editPolicy = null,
  onPolicySaved
}: {
  isOpen: boolean;
  onClose: () => void;
  walletId: string;
  editPolicy?: Policy | null;
  onPolicySaved?: (policy: Policy) => void;
}) {
  const [name, setName] = useState(editPolicy?.name || "");
  const [description, setDescription] = useState(editPolicy?.description || "");
  const [address, setAddress] = useState(editPolicy?.content || "");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editPolicy) {
        setName(editPolicy.name);
        setDescription(editPolicy.description);
        setAddress(editPolicy.content);
      } else {
        setName("");
        setDescription("");
        setAddress("");
      }
    }
  }, [isOpen, editPolicy]);

  const handleSave = () => {
    if (!name || !description || !address) {
      toast.error("Please provide all policy details");
      return;
    }

    setIsLoading(true);
    try {
      const policy: Policy = editPolicy
        ? {
          ...editPolicy,
          name,
          description,
          content: address
        }
        : {
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

      if (editPolicy) {
        // Replace existing policy
        const index = storedPolicies[walletId].findIndex(p => p.id === editPolicy.id);
        if (index !== -1) {
          storedPolicies[walletId][index] = policy;
        }
      } else {
        // Add new policy
        storedPolicies[walletId].push(policy);
      }

      localStorage.setItem("zg:wallet_policies", JSON.stringify(storedPolicies));

      toast.success(`Policy ${editPolicy ? 'updated' : 'added'} successfully`);
      if (onPolicySaved) {
        onPolicySaved(policy);
      }
      onClose();
    } catch (error) {
      console.error('Error saving policy:', error);
      toast.error(`Failed to ${editPolicy ? 'update' : 'add'} policy`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editPolicy ? 'Edit Policy' : 'Add New Policy'}</DialogTitle>
          <DialogDescription>
            {editPolicy
              ? 'Update policy details below'
              : 'Create a new policy to limit contract interactions'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Policy Name</Label>
            <Input
              id="name"
              placeholder="Enter policy name"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What does this policy do?"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Contract Address (Policy ID)</Label>
            <Input
              id="address"
              placeholder="Enter contract address"
              value={address}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
        </div>
        <DialogFooter className="flex space-x-2 sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="mt-4"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="mt-4"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editPolicy ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              <>{editPolicy ? 'Update' : 'Save'}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AttachPolicyModal({
  isOpen,
  onClose,
  signer,
  policies,
  onPolicyAttached
}: {
  isOpen: boolean;
  onClose: () => void;
  signer: SignerInfo;
  policies: Policy[];
  onPolicyAttached?: () => void;
}) {
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [contractAddress, setContractAddress] = useState<string>("");
  const [isAttaching, setIsAttaching] = useState(false);
  const [openSelect, setOpenSelect] = useState(false);

  const { attachPolicy } = useSmartWallet();

  const handleAttach = async () => {
    if (!selectedPolicy || !contractAddress) {
      toast.error("Please select a policy and enter a contract address");
      return;
    }

    setIsAttaching(true);
    try {
      await attachPolicy(signer.publicKey, contractAddress, selectedPolicy.content);

      // Save to localStorage
      const attachedPolicies: StoredAttachedPolicies = JSON.parse(
        localStorage.getItem("zg:attached_policies") || "{}"
      );

      if (!attachedPolicies[signer.publicKey]) {
        attachedPolicies[signer.publicKey] = [];
      }

      attachedPolicies[signer.publicKey].push({
        policyId: selectedPolicy.id,
        contractIdToLimit: contractAddress,
        attachedAt: new Date().toISOString()
      });

      localStorage.setItem("zg:attached_policies", JSON.stringify(attachedPolicies));

      toast.success("Policy attached successfully");
      if (onPolicyAttached) {
        onPolicyAttached();
      }
      onClose();
    } catch (error) {
      console.error('Error attaching policy:', error);
      toast.error("Failed to attach policy");
    } finally {
      setIsAttaching(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Attach Policy</DialogTitle>
          <DialogDescription>
            Attach a policy to limit contract interactions for this signer
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="policy">Select Policy</Label>
            <Popover open={openSelect} onOpenChange={setOpenSelect}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openSelect}
                  className="w-full justify-between"
                >
                  {selectedPolicy ? selectedPolicy.name : "Select a policy..."}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search policies..." />
                  <CommandEmpty>No policies found</CommandEmpty>
                  <CommandGroup>
                    {policies.map((policy) => (
                      <CommandItem
                        key={policy.id}
                        value={policy.id}
                        onSelect={() => {
                          setSelectedPolicy(policy);
                          setOpenSelect(false);
                        }}
                      >
                        <CheckIcon
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedPolicy?.id === policy.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {policy.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contract">Contract to Limit</Label>
            <Input
              id="contract"
              placeholder="Enter contract address to limit"
              value={contractAddress}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContractAddress(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          {selectedPolicy && (
            <div className="rounded-md bg-gray-50 p-3">
              <h4 className="text-sm font-medium text-gray-900">{selectedPolicy.name}</h4>
              <p className="text-xs text-gray-500 mt-1">{selectedPolicy.description}</p>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <span className="font-mono">{shortAddress(selectedPolicy.content)}</span>
                <button
                  onClick={() => copyToClipboard(selectedPolicy.content)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="flex space-x-2 sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="mt-4"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAttach}
            disabled={isAttaching || !selectedPolicy || !contractAddress}
            className="mt-4"
          >
            {isAttaching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Attaching...
              </>
            ) : (
              "Attach Policy"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// InfoBanner component to show policy information
function InfoBanner({ onClose }: { onClose: () => void }) {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-4 relative">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <Info className="h-5 w-5 text-blue-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-800">About Policies</h3>
          <p className="text-xs text-blue-700 mt-1">
            Policies allow you to control what contracts a signer can interact with. Add a policy, then attach it to a signer to limit which contract it can call.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 bg-white border-blue-200 text-blue-700 text-xs"
              onClick={() => window.open("https://soroban.stellar.org", "_blank")}
            >
              Learn more
            </Button>
          </div>
        </div>
        <button onClick={onClose} className="absolute top-2 right-2 text-blue-400 hover:text-blue-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function PasskeyCreation() {
  const [status, setStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { create, connect, getWalletSigners, signXDR, addSubWallet, transfer, subWallets, removeSubWallet, fundWallet, keyId, balance, contractId, addSigner_Ed25519, loading, signers, isFunding, getWalletBalance, attachPolicy } = useSmartWallet();

  const [isTransfering, setIsTransfering] = useState(false);
  const [showPolicyInfo, setShowPolicyInfo] = useState(() => {
    const previouslyShown = localStorage.getItem("zg:policy_info_shown");
    return previouslyShown ? false : true;
  });

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

  const dismissPolicyInfo = () => {
    setShowPolicyInfo(false);
    localStorage.setItem("zg:policy_info_shown", "true");
  };

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
    <div className="mx-auto max-w-3xl p-8 md:p-0">
      <div className="w-full mb-16">
        {!contractId && (
          <div>
            <div className="flex flex-col mt-6 items-center justify-center">
              {showPolicyInfo && (
                <InfoBanner onClose={dismissPolicyInfo} />
              )}

              <h1 className="text-3xl font-medium text-center">Create a smart contract wallet</h1>
              {/* Rest of the JSX */}
            </div>
          </div>
        )}

        {/* Rest of the JSX remains unchanged */}
      </div>
    </div>
  );
}

