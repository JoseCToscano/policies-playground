"use client";

import { useState, useEffect } from "react";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
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
import { useSmartWallet } from "~/hooks/useSmartWallet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";

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

type PolicyAssignment = {
    policyId: string;
    signerPublicKey: string;
    walletId: string;
    assignedAt: string;
}

type StoredPolicyAssignments = {
    [walletId: string]: PolicyAssignment[];
}

export function SignersList({ walletId, onAttachPolicy }: {
    walletId: string;
    onAttachPolicy?: (policy: Policy, signerKey: string) => Promise<void>;
}) {
    const [signers, setSigners] = useState<SignerInfo[]>([]);
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [policyAssignments, setPolicyAssignments] = useState<PolicyAssignment[]>([]);
    const [deletingSignerKey, setDeletingSignerKey] = useState<string | null>(null);
    const [selectedSigner, setSelectedSigner] = useState<string | null>(null);
    const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
    const [isAttaching, setIsAttaching] = useState(false);

    const { removeSigner } = useSmartWallet();

    useEffect(() => {
        // Load signers
        const storedSigners: StoredSigners = JSON.parse(localStorage.getItem("zg:wallet_signers") || "{}");
        setSigners(storedSigners[walletId] || []);

        // Load policies
        const storedPolicies: StoredPolicies = JSON.parse(localStorage.getItem("zg:wallet_policies") || "{}");
        setPolicies(storedPolicies[walletId] || []);

        // Load policy assignments
        const storedAssignments: StoredPolicyAssignments = JSON.parse(
            localStorage.getItem("zg:policy_assignments") || "{}"
        );
        setPolicyAssignments(storedAssignments[walletId] || []);
    }, [walletId]);

    useEffect(() => {
        const interval = setInterval(() => {
            const storedSigners: StoredSigners = JSON.parse(localStorage.getItem("zg:wallet_signers") || "{}");
            setSigners(storedSigners[walletId] || []);

            const storedPolicies: StoredPolicies = JSON.parse(localStorage.getItem("zg:wallet_policies") || "{}");
            setPolicies(storedPolicies[walletId] || []);

            const storedAssignments: StoredPolicyAssignments = JSON.parse(
                localStorage.getItem("zg:policy_assignments") || "{}"
            );
            setPolicyAssignments(storedAssignments[walletId] || []);
        }, 1000);

        return () => clearInterval(interval);
    }, [walletId]);

    const getAssignedPolicies = (signerPublicKey: string): Policy[] => {
        const assignedPolicyIds = policyAssignments
            .filter(assignment => assignment.signerPublicKey === signerPublicKey)
            .map(assignment => assignment.policyId);

        return policies.filter(policy => assignedPolicyIds.includes(policy.id));
    };

    if (signers.length === 0) {
        return (
            <div className="rounded-md border border-dashed border-gray-200 p-3 text-center">
                <p className="text-xs text-gray-500">No signers added</p>
            </div>
        );
    }

    const handleDelete = async (publicKey: string) => {
        if (!publicKey) return;
        setDeletingSignerKey(publicKey);
        try {
            await removeSigner(publicKey);

            // Remove from local storage
            const storedSigners: StoredSigners = JSON.parse(localStorage.getItem("zg:wallet_signers") || "{}");
            storedSigners[walletId] = (storedSigners[walletId] || []).filter(s => s.publicKey !== publicKey);
            localStorage.setItem("zg:wallet_signers", JSON.stringify(storedSigners));

            // Remove associated policy assignments
            const storedAssignments: StoredPolicyAssignments = JSON.parse(
                localStorage.getItem("zg:policy_assignments") || "{}"
            );
            storedAssignments[walletId] = (storedAssignments[walletId] || []).filter(
                a => a.signerPublicKey !== publicKey
            );
            localStorage.setItem("zg:policy_assignments", JSON.stringify(storedAssignments));

            toast.success("Signer removed successfully");
        } catch (e) {
            console.error("Error deleting signer:", e);
            toast.error("Failed to delete signer");
        } finally {
            setDeletingSignerKey(null);
        }
    }

    const handleAttachPolicy = async () => {
        if (!selectedSigner || !selectedPolicy || !onAttachPolicy) return;

        setIsAttaching(true);
        try {
            const policy = policies.find(p => p.id === selectedPolicy);
            if (!policy) throw new Error("Policy not found");

            await onAttachPolicy(policy, selectedSigner);

            // Update local storage for policy assignments
            const storedAssignments: StoredPolicyAssignments = JSON.parse(
                localStorage.getItem("zg:policy_assignments") || "{}"
            );

            if (!storedAssignments[walletId]) {
                storedAssignments[walletId] = [];
            }

            storedAssignments[walletId].push({
                policyId: selectedPolicy,
                signerPublicKey: selectedSigner,
                walletId,
                assignedAt: new Date().toISOString()
            });

            localStorage.setItem("zg:policy_assignments", JSON.stringify(storedAssignments));
            toast.success("Policy attached successfully");
            setSelectedSigner(null);
        } catch (e) {
            console.error("Error attaching policy:", e);
            toast.error("Failed to attach policy");
        } finally {
            setIsAttaching(false);
        }
    };

    return (
        <>
            <div className="space-y-2">
                {signers.map((signer) => {
                    const assignedPolicies = getAssignedPolicies(signer.publicKey);

                    return (
                        <div key={signer.publicKey}>
                            <div className="relative flex items-center justify-between border border-gray-200 rounded-md bg-white p-2">
                                {deletingSignerKey === signer.publicKey && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-md z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                                            <span className="text-xs text-red-600">Removing signer...</span>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-50 border border-gray-200">
                                        <span className="text-xs font-medium text-gray-600">
                                            {signer.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5">
                                            <h3 className="text-xs font-medium text-gray-900">{signer.name}</h3>
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
                                        {assignedPolicies.length > 0 && (
                                            <div className="flex items-center gap-1 mt-1">
                                                {assignedPolicies.map(policy => (
                                                    <Badge
                                                        key={policy.id}
                                                        className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1"
                                                    >
                                                        {policy.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
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
                                        <DropdownMenuItem
                                            className="gap-2 text-xs"
                                            onClick={() => setSelectedSigner(signer.publicKey)}
                                        >
                                            <FileText className="h-3.5 w-3.5" />
                                            <span>Attach policy</span>
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
                                        <DropdownMenuItem
                                            onClick={() => handleDelete(signer.publicKey)}
                                            disabled={deletingSignerKey === signer.publicKey}
                                            className="gap-2 text-xs text-red-600 focus:bg-red-50 focus:text-red-600">
                                            <Trash2 className="h-3.5 w-3.5" />
                                            <span>Remove</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Dialog open={!!selectedSigner} onOpenChange={(open) => !open && setSelectedSigner(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Attach Policy</DialogTitle>
                        <DialogDescription>
                            Select a policy to attach to this signer. This will allow the signer to execute transactions according to the policy rules.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Policy</label>
                            <Select
                                value={selectedPolicy ?? undefined}
                                onValueChange={setSelectedPolicy}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a policy" />
                                </SelectTrigger>
                                <SelectContent>
                                    {policies.map((policy) => (
                                        <SelectItem key={policy.id} value={policy.id}>
                                            {policy.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setSelectedSigner(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAttachPolicy}
                            disabled={!selectedPolicy || isAttaching}
                        >
                            {isAttaching ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                                    Attaching...
                                </>
                            ) : (
                                'Attach Policy'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}