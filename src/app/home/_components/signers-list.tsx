"use client";

import { useState, useEffect } from "react";
import { Badge } from "~/components/ui/badge";
import { Dialog } from "~/components/ui/dialog";
import {
    Copy,
    QrCode,
    Share2,
    ArrowRightLeft,
    Trash2,
    FileText,
    Terminal,
    Pencil,
    Download,
    MoreVertical
} from "lucide-react";
import { copyToClipboard, shortAddress } from "~/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { Policy } from "./policies-vault";
import { toast } from "react-hot-toast";

export type SignerInfo = {
    publicKey: string;
    name: string;
    addedAt: string;
    purpose: string;
    walletId: string;
}

export type StoredSigners = {
    [walletId: string]: SignerInfo[];
}

type StoredPolicies = {
    [walletId: string]: Policy[];
}

export function SignersList({ walletId, onAttachPolicy }: {
    walletId: string;
    onAttachPolicy?: (policy: Policy, signerKey: string) => Promise<void>;
}) {
    const [signers, setSigners] = useState<SignerInfo[]>([]);
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [selectedSigner, setSelectedSigner] = useState<SignerInfo | null>(null);
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

    useEffect(() => {
        console.log('Loading signers for wallet:', walletId);
        const storedSigners: StoredSigners = JSON.parse(localStorage.getItem("zg:wallet_signers") || "{}");
        console.log('All stored signers:', storedSigners);
        console.log('Signers for this wallet:', storedSigners[walletId] || []);
        setSigners(storedSigners[walletId] || []);

        // Also load policies
        const storedPolicies: StoredPolicies = JSON.parse(localStorage.getItem("zg:wallet_policies") || "{}");
        setPolicies(storedPolicies[walletId] || []);
    }, [walletId]);

    useEffect(() => {
        const interval = setInterval(() => {
            const storedSigners: StoredSigners = JSON.parse(localStorage.getItem("zg:wallet_signers") || "{}");
            setSigners(storedSigners[walletId] || []);

            // Also refresh policies
            const storedPolicies: StoredPolicies = JSON.parse(localStorage.getItem("zg:wallet_policies") || "{}");
            setPolicies(storedPolicies[walletId] || []);
        }, 1000);

        return () => clearInterval(interval);
    }, [walletId]);

    const handleAttachPolicy = (signer: SignerInfo) => {
        setSelectedSigner(signer);
        setIsPolicyModalOpen(true);
    };

    const handlePolicySelected = async (policy: Policy) => {
        if (!selectedSigner || !onAttachPolicy) {
            toast.error("Unable to attach policy");
            return;
        }

        try {
            await onAttachPolicy(policy, selectedSigner.publicKey);
            setIsPolicyModalOpen(false);
        } catch (error) {
            console.error("Error attaching policy:", error);
        }
    };

    if (signers.length === 0) {
        console.log('No signers found for wallet:', walletId);
        return (
            <div className="rounded-md border border-dashed border-gray-200 p-3 text-center">
                <p className="text-xs text-gray-500">No signers added</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {signers.map((signer) => (
                <div key={signer.publicKey}>
                    <div className="flex items-center justify-between border border-gray-200 rounded-md bg-white p-2">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-50 border border-gray-200">
                                <span className="text-xs font-medium text-gray-600">
                                    {signer.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                    <h3 className="text-xs font-medium text-gray-900">{signer.name}</h3>
                                    <Badge className="bg-gray-50 border border-gray-200 text-xs px-1 py-0 h-4 font-normal text-gray-600">
                                        {signer.purpose}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <span className="font-mono">{shortAddress(signer.publicKey)}</span>
                                    <button
                                        onClick={() => copyToClipboard(signer.publicKey)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <Copy className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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
                                <DropdownMenuItem
                                    className="gap-2 text-xs"
                                    onClick={() => handleAttachPolicy(signer)}
                                >
                                    <FileText className="h-3.5 w-3.5" />
                                    <span>Attach Policy</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-xs">
                                    <Share2 className="h-3.5 w-3.5" />
                                    <span>Share</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-xs" onClick={() => copyToClipboard(signer.publicKey)}>
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>Copy Key</span>
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
            ))}

            {/* Policy Selection Modal */}
            {isPolicyModalOpen && selectedSigner && (
                <Dialog open={isPolicyModalOpen} onOpenChange={setIsPolicyModalOpen}>
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-900">
                                    Attach Policy to {selectedSigner.name}
                                </h3>
                                <button
                                    onClick={() => setIsPolicyModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                                {policies.length === 0 ? (
                                    <div className="text-center p-4 border border-dashed border-gray-200 rounded-md">
                                        <p className="text-sm text-gray-500">No policies available</p>
                                        <p className="text-xs text-gray-400 mt-1">Create a policy first in the Policies section</p>
                                    </div>
                                ) : (
                                    policies.map((policy) => (
                                        <div
                                            key={policy.id}
                                            className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-3 hover:bg-gray-50 cursor-pointer"
                                            onClick={() => handlePolicySelected(policy)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-50 border border-gray-200">
                                                    <FileText className="h-4 w-4 text-gray-500" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-900">{policy.name}</h4>
                                                    <div className="text-xs text-gray-500">{shortAddress(policy.contractIdToLimit)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    onClick={() => setIsPolicyModalOpen(false)}
                                    className="px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </Dialog>
            )}
        </div>
    );
}