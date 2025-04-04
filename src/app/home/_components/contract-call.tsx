"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { api } from "~/trpc/react";
import { Badge } from '~/components/ui/badge'
import { useSmartWallet } from "~/hooks/useSmartWallet";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
    Copy,
    Loader2,
    FileText,
    CircleDollarSign,
    EuroIcon,
    StarIcon,
    Combine,
    Terminal,
    KeyRound,
    WalletIcon,
    Github,
    LucideBookUser,
    LucideDiamondPlus,
    ChevronDown,
    AlertCircle,
    RefreshCcw
} from "lucide-react"

import { Label } from "~/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { bigIntReplacer, cn, copyToClipboard, shortAddress } from '~/lib/utils'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "~/components/ui/tooltip"
import { SAC_FUNCTION_DOCS } from "~/lib/constants/sac";
import { Combobox, ComboboxItem } from "~/components/ui/combobox";
import { SignerInfo, StoredSigners } from '~/app/home/_components/signers-list';
import Image from "next/image";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible"

interface PopularContract {
    name: string;
    description: string;
    address: string;
    icon: React.ReactNode;
    githubUrl?: string;
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
    functions?: any[];
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

interface Signer {
    id: string;
    name: string;
    key: string;
    type: string;
    icon: React.ReactNode;
}

const popularContracts: PopularContract[] = [
    {
        name: "Native XLM",
        description: "Stellar's native token",
        address: "native",
        icon: (
            <Image
                src="/stellar-xlm-icon.png"
                alt="XLM"
                width={14}  // matches h-3.5
                height={14} // matches w-3.5
                className="object-contain"
            />
        )
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
        icon: <Combine className="h-3.5 w-3.5" />,
        githubUrl: 'https://github.com/blend-capital/blend-contracts'
    },
    {
        name: "Contact's list",
        description: "@JoseCToscano's Contact's Smart Contract Demo",
        address: "CDOCQ4YNWDPWB3HHGQQCVCX5PWJYHWYKYAC2PCE237WWZFQNW2GYXSDA",
        icon: <LucideBookUser className="h-3.5 w-3.5" />,
        githubUrl: 'https://github.com/JoseCToscano/policies-playground'
    },
    {
        name: "Do Math",
        description: "@kalepail's Do Math Demo",
        address: "CAXZG5WRNRY4ZDG6UPNFAQ2HY77HPETA7YIQDKFK4JENRVH43X2TREW6",
        icon: <LucideDiamondPlus className="h-3.5 w-3.5" />,
        githubUrl: 'https://github.com/kalepail/do-math'
    }
];


export const ContractCall = ({ signer, mainWalletId, signers: externalSigners }: { signer?: string; mainWalletId?: string; signers?: any[] }) => {
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
    const [selectedSigner, setSelectedSigner] = useState<string>(mainWalletId || "");
    const [localSigners, setLocalSigners] = useState<SignerInfo[]>([]);
    const { signXDR, signAndSend, signers: walletSigners } = useSmartWallet();
    const [isPopularContractsOpen, setIsPopularContractsOpen] = useState(true);

    // Load signers from localStorage
    useEffect(() => {
        if (!mainWalletId) return;

        const loadSigners = () => {
            const storedSigners: StoredSigners = JSON.parse(localStorage.getItem("zg:wallet_signers") || "{}");
            setLocalSigners(storedSigners[mainWalletId] || []);
        };

        loadSigners();

        // Set up listener for storage events to catch updates to signers
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === "zg:wallet_signers") {
                loadSigners();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Also poll for changes (for when signers are added in the same window)
        const interval = setInterval(loadSigners, 2000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [mainWalletId]);

    // Prepare signers for combobox
    const getSignersForCombobox = useCallback((): ComboboxItem[] => {
        const signersList: ComboboxItem[] = [];

        // Add main wallet as first option
        if (mainWalletId) {
            signersList.push({
                value: mainWalletId,
                label: "Main Wallet",
                signerType: 'Secp256r1',
                description: shortAddress(mainWalletId),
                icon: <WalletIcon className="h-3.5 w-3.5" />
            });
        }

        // Add signers from localStorage
        localSigners.forEach(signer => {
            signersList.push({
                value: signer.publicKey,
                signerType: 'Ed25519',
                label: signer.name,
                description: `${signer.purpose} • ${shortAddress(signer.publicKey)}`,
                icon: <KeyRound className="h-3.5 w-3.5" />
            });
        });

        // Add other signers from wallet or externally provided
        const allSigners = externalSigners || walletSigners || [];
        allSigners.forEach(signer => {
            if (signer.kind === 'Secp256r1' || signer.kind === 'Policy') {
                return;
            }
            // Only add if not already added (by localStorage)
            const key = signer.key || signer.publicKey;
            if (!signersList.some(s => s.value === key)) {
                signersList.push({
                    value: key,
                    label: signer.name || `Signer ${shortAddress(key)}`,
                    description: shortAddress(key),
                    icon: <KeyRound className="h-3.5 w-3.5" />
                });
            }
        });

        return signersList;
    }, [mainWalletId, externalSigners, walletSigners, localSigners]);

    const signerOptions: ComboboxItem[] = getSignersForCombobox();
    // Set initial signer
    useEffect(() => {
        if (mainWalletId && !selectedSigner) {
            setSelectedSigner(mainWalletId);
        }
    }, [mainWalletId, selectedSigner]);

    const handleContractSelect = (contract: PopularContract) => {
        if (contract.address) {
            setContractAddress(contract.address);
            // Reset any previous call results
            setCallResult(null);
            setCallError(null);
        }
    };

    const { data: contractMetadata, isLoading: isLoadingMetadata, error: metadataError, refetch: refetchMetadata } = api.stellar.getContractMetadata.useQuery(
        { contractAddress },
        {
            enabled: contractAddress.length > 0,
            retry: false // Don't automatically retry on error
        }
    );

    const { mutateAsync: prepareContractCall, isPending: isLoadingPrepareContractCall } = api.stellar.prepareContractCall.useMutation({
        onSuccess: (data) => {
            console.log('prepareContractCall', data);
        }
    });

    useEffect(() => {
        if (contractMetadata) {
            // @ts-ignore
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
    const getInitialParamValue = useCallback((param: any, isFirstParam: boolean) => {
        // For address parameters with specific names, use the main wallet ID regardless of selected signer
        if (shouldUseDefaultAddressValue(param.name, param.type, isFirstParam) && mainWalletId) {
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
                fn.parameters.forEach((param: any, index: number) => {
                    initialParams[param.name] = getInitialParamValue(param, index === 0);
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
    const getPlaceholder = (type: string, paramName: string, isFirstParam: boolean): string => {
        switch (type) {
            case 'address':
                if (shouldUseDefaultAddressValue(paramName, type, isFirstParam)) {
                    return 'Main wallet address (fixed)';
                }
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
    const shouldUseDefaultAddressValue = (paramName: string, paramType: string, isFirstParam: boolean): boolean => {
        return paramType === 'address' && ['from', 'source', 'user', 'id', 'address', 'owner'].includes(paramName.toLowerCase()) && isFirstParam;
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
            if (!selectedSigner) {
                throw new Error("No signer selected for the transaction");
            }
            const response = await prepareContractCall({
                contractAddress,
                method: fn,
                args: scValParams,
                isReadOnly,
                walletContractId: selectedSigner
            });
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

        if (!selectedSigner) {
            toast.error("Please select a signer for the transaction");
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

            // Get the signer display name
            const signerItem = signerOptions.find(s => s.value === selectedSigner);
            if (!signerItem || !signerItem.signerType) {
                throw new Error("Signer not found");
            }

            console.log('params:', params);
            const xdr = await createContractCallXdr(selectedFunction, params);
            console.log('xdr:', xdr);
            if (!xdr) {
                throw new Error("Failed to create transaction XDR");
            }

            const result = await signAndSend(xdr, signerItem.signerType, signerItem.value);
            console.log('result from executeContractCall:', result);
            if (typeof result !== 'undefined' && result !== null) {
                setCallResult(JSON.stringify(result, bigIntReplacer, 2));
            }
            toast.success(`Function called successfully using ${signerItem.label}`);
        } catch (error: any) {
            if (error?.error?.includes('Auth, InvalidAction')) {
                toast.error('Insufficient permissions to call this function');
                setCallError('Insufficient permissions to call this function');
            } else {
                console.error("Error calling contract function:", error);
                setCallError(error.message || "Unknown error occurred");
                toast.error(`Error: ${error.message || "Failed to call function"}`);
            }
        } finally {
            setIsCalling(false);
        }
    };

    // Add this effect to auto-close popular contracts when one is selected
    useEffect(() => {
        if (contractAddress) {
            setIsPopularContractsOpen(false);
        }
    }, [contractAddress]);

    return (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-medium text-gray-700">Test Contract Call</h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Test smart contract functions with any signer
                        </p>
                    </div>
                </div>
            </div>
            <div className="p-4">
                <div className="space-y-4">
                    <Collapsible open={isPopularContractsOpen} onOpenChange={setIsPopularContractsOpen}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Label className="text-xs font-medium">Popular Contracts</Label>
                                {!isPopularContractsOpen && contractAddress && (
                                    <Badge variant="outline" className="text-[10px]">
                                        {popularContracts.find(c => c.address === contractAddress)?.name || shortAddress(contractAddress)}
                                    </Badge>
                                )}
                            </div>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-gray-500 hover:text-gray-900">
                                    <span className="text-xs mr-1">{isPopularContractsOpen ? 'Hide' : 'Show contracts'}</span>
                                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", !isPopularContractsOpen && "-rotate-90")} />
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent className="space-y-2 data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown overflow-hidden">
                            <div className="mt-1.5 grid grid-cols-2 gap-2">
                                {popularContracts.map((contract) => (
                                    <button
                                        key={contract.address}
                                        onClick={() => handleContractSelect(contract)}
                                        className={cn(
                                            "flex items-center gap-2 rounded-md border p-2 text-left transition-colors hover:bg-gray-50",
                                            contractAddress === contract.address && "border-indigo-300 bg-indigo-50"
                                        )}
                                    >
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-white">
                                            {contract.icon}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="truncate text-sm font-medium flex items-center gap-1 w-full items-center justify-between">
                                                {contract.name}
                                                {contract.githubUrl && (
                                                    <a
                                                        href={contract.githubUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="ml-1 flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
                                                        title="View source code"
                                                    >
                                                        <Github className="h-3 w-3" />
                                                        <span className="text-[10px]">View on Github</span>
                                                    </a>
                                                )}
                                            </div>
                                            <div className="truncate text-xs text-gray-500">
                                                {contract.description}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>

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
                                    copyToClipboard(contractAddress);
                                }}
                            >
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>

                    {isLoadingMetadata && (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        </div>
                    )}

                    {metadataError && (
                        <div className="flex flex-col items-center justify-center gap-3 py-8 px-4 border rounded-md bg-red-50/50">
                            <AlertCircle className="h-10 w-10 text-red-500" />
                            <div className="text-center">
                                <p className="text-sm text-red-700 font-medium mb-1">
                                    Failed to fetch contract metadata
                                </p>
                                <p className="text-xs text-red-600 max-w-[300px]">
                                    {metadataError.message || "The contract might not exist or be incompatible"}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    void refetchMetadata();
                                }}
                                className="bg-white hover:bg-white"
                            >
                                <RefreshCcw className="h-3.5 w-3.5 mr-2" />
                                Try Again
                            </Button>
                        </div>
                    )}

                    {metadata && !metadataError && (
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
                                                                        "w-full border-b p-3 text-left transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                                                        selectedFunction === fn.name && "bg-gray-50",
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
                                                                                    <span className="font-mono text-gray-500">
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
                                                            "w-full border-b p-3 text-left transition-colors hover:bg-gray-50",
                                                            selectedEnum === enum_.name && "bg-gray-50",
                                                            "last:border-b-0"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-sm">{enum_.name}</span>
                                                            {enum_.isErrorEnum && (
                                                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px]">
                                                                    errors
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {enum_.doc && <p className="mt-1 text-xs text-gray-500">{enum_.doc}</p>}
                                                        <div className="mt-2 space-y-1">
                                                            {enum_.variants.map((variant: any) => (
                                                                <div key={variant.name} className="flex items-center gap-2 text-xs">
                                                                    <Badge variant="outline" className="font-mono text-[10px]">
                                                                        {variant.value}
                                                                    </Badge>
                                                                    <span className="font-mono text-gray-500">{variant.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </button>
                                                ))}
                                                {!metadata.enums?.length && (
                                                    <div className="p-3 text-center text-xs text-gray-500">No enums found</div>
                                                )}
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
                                                            "w-full border-b p-3 text-left transition-colors hover:bg-gray-50",
                                                            selectedUnion === union.name && "bg-gray-50",
                                                            "last:border-b-0"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-sm">{union.name}</span>
                                                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">
                                                                union
                                                            </Badge>
                                                        </div>
                                                        {union.doc && <p className="mt-1 text-xs text-gray-500">{union.doc}</p>}
                                                        <div className="mt-2 space-y-1">
                                                            {union.cases.map((case_: any) => (
                                                                <div key={case_.name} className="flex items-center gap-2 text-xs">
                                                                    {case_.type ? (
                                                                        <Badge variant="outline" className="font-mono text-[10px]">
                                                                            {case_.type}
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="font-mono text-[10px] bg-gray-50">
                                                                            void
                                                                        </Badge>
                                                                    )}
                                                                    <span className="font-mono text-gray-500">{case_.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </button>
                                                ))}
                                                {!metadata.unions?.length && (
                                                    <div className="p-3 text-center text-xs text-gray-500">No unions found</div>
                                                )}
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
                                                    ?.parameters.map((param: any, index: number) => (
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
                                                                    placeholder={getPlaceholder(param.type, param.name, index === 0)}
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

                                            <div className="flex flex-col gap-2 pt-3">
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-xs text-gray-500 whitespace-nowrap">Sign with:</Label>
                                                    <div className="flex-1">
                                                        <Combobox
                                                            items={signerOptions}
                                                            value={selectedSigner}
                                                            onChange={setSelectedSigner}
                                                            placeholder="Select signer..."
                                                            searchPlaceholder="Search signers..."
                                                            emptyText="No signers available"
                                                            className="w-full text-xs"
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground -mt-1">
                                                    The transaction will be signed by the selected signer
                                                </p>

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
                                            </div>

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
            </div>
        </div>
    );
};