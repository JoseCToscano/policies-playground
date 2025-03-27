"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import {
    Copy,
    QrCode,
    Share2,
    Trash2,
    FileText,
    MoreVertical,
    LucideFileLock2,
    ChevronDown,
    Download,
    Pencil,
    Plus,
    Loader2
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
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "~/components/ui/collapsible"
import { Input } from "~/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

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

const signerFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    purpose: z.string().min(1, "Description is required"),
});

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
    const [openPolicies, setOpenPolicies] = useState<{ [key: string]: boolean }>({});
    const [editingSigner, setEditingSigner] = useState<SignerInfo | null>(null);
    const [newSignerName, setNewSignerName] = useState("");
    const [newSignerPurpose, setNewSignerPurpose] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);

    const { removeSigner, getSignerSecret } = useSmartWallet();

    const form = useForm<z.infer<typeof signerFormSchema>>({
        resolver: zodResolver(signerFormSchema),
        defaultValues: {
            name: "",
            purpose: "",
        },
    });

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

    const handleDownloadKeys = (publicKey: string) => {
        try {
            const secretKey = getSignerSecret(publicKey);
            if (!secretKey) {
                toast.error("Secret key not found");
                return;
            }

            const content = `Public Key: ${publicKey}\nSecret Key: ${secretKey}`;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `signer-keys-${publicKey.slice(0, 8)}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Keys downloaded successfully");
        } catch (error) {
            console.error("Error downloading keys:", error);
            toast.error("Failed to download keys");
        }
    };

    const handleEditSigner = () => {
        if (!editingSigner || !newSignerName.trim()) return;

        try {
            // Update in localStorage
            const storedSigners: StoredSigners = JSON.parse(localStorage.getItem("zg:wallet_signers") || "{}");
            const walletSigners = storedSigners[walletId] || [];
            const signerIndex = walletSigners.findIndex(s => s.publicKey === editingSigner.publicKey);

            if (signerIndex !== -1) {
                walletSigners[signerIndex] = {
                    ...editingSigner,
                    name: newSignerName.trim(),
                    purpose: newSignerPurpose.trim()
                };
                storedSigners[walletId] = walletSigners;
                localStorage.setItem("zg:wallet_signers", JSON.stringify(storedSigners));

                // Update local state
                setSigners(walletSigners);
                toast.success("Signer updated successfully");
            }
        } catch (error) {
            console.error("Error updating signer:", error);
            toast.error("Failed to update signer");
        } finally {
            setEditingSigner(null);
            setNewSignerName("");
            setNewSignerPurpose("");
        }
    };


    if (signers.length === 0) {
        return (
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center">
                    <QrCode className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No signers</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding a new signer to your wallet.</p>
                <div className="mt-6">
                    <Button
                        onClick={() => setIsAddOpen(true)}
                        className="text-xs"
                    >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        New Signer
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4 max-h-[40vh] overflow-y-auto">
                {signers.map((signer) => {
                    const assignedPolicies = getAssignedPolicies(signer.publicKey);
                    const isOpen = openPolicies[signer.publicKey] || false;

                    return (
                        <div key={signer.publicKey} className="group">
                            <div className="relative flex flex-col border border-gray-200 rounded-lg bg-white p-3 transition-shadow hover:shadow-sm">
                                {deletingSignerKey === signer.publicKey && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                                            <span className="text-xs text-red-600">Removing signer...</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start justify-between">
                                    {/* Signer Info */}
                                    <div className="flex items-start gap-2.5">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-50 border border-gray-200">
                                            <span className="text-sm font-medium text-gray-600">
                                                {signer.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="text-sm font-medium text-gray-900">{signer.name}</h3>
                                                <span className="text-[10px] text-gray-400 mt-px">•</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-mono text-[11px] text-gray-500">{shortAddress(signer.publicKey)}</span>
                                                    <button
                                                        onClick={() => copyToClipboard(signer.publicKey)}
                                                        className="text-gray-400 hover:text-gray-600"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-gray-500">{signer.purpose}</p>
                                        </div>
                                    </div>

                                    {/* Actions Menu */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="rounded-full p-1.5 text-gray-900 hover:bg-gray-100 hover:text-gray-600  hover:opacity-100 transition-opacity">
                                                <MoreVertical className="h-3.5 w-3.5" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem
                                                className="gap-2 text-xs"
                                                onClick={() => setSelectedSigner(signer.publicKey)}
                                            >
                                                <FileText className="h-3.5 w-3.5" />
                                                <span>Attach policy</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="gap-2 text-xs"
                                                onClick={() => {
                                                    setEditingSigner(signer);
                                                    setNewSignerName(signer.name);
                                                    setNewSignerPurpose(signer.purpose);
                                                }}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                <span>Edit Signer</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="gap-2 text-xs">
                                                <Share2 className="h-3.5 w-3.5" />
                                                <span>Share</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="gap-2 text-xs"
                                                onClick={() => copyToClipboard(signer.publicKey)}
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                                <span>Copy Key</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="gap-2 text-xs"
                                                onClick={() => handleDownloadKeys(signer.publicKey)}
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                                <span>Download Keys</span>
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

                                {/* Policies Section */}
                                {assignedPolicies.length > 0 && (
                                    <Collapsible
                                        open={isOpen}
                                        onOpenChange={(open) => {
                                            setOpenPolicies(prev => ({
                                                ...prev,
                                                [signer.publicKey]: open
                                            }));
                                        }}
                                        className="mt-3 pt-3 border-t border-gray-100"
                                    >
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[11px] font-medium text-gray-500">Assigned Policy</h4>
                                            <CollapsibleTrigger asChild>
                                                <button className="flex items-center gap-1 rounded-full bg-gray-50 px-1.5 py-0.5 hover:bg-gray-100 transition-colors">
                                                    <span className="text-[11px] font-medium text-gray-600">
                                                        {assignedPolicies.length} {assignedPolicies.length === 1 ? 'policy' : 'policies'}
                                                    </span>
                                                    <ChevronDown
                                                        className={`h-3 w-3 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
                                                    />
                                                </button>
                                            </CollapsibleTrigger>
                                        </div>

                                        <CollapsibleContent className="mt-2">
                                            <div className="flex flex-wrap gap-1.5">
                                                {assignedPolicies.map(policy => (
                                                    <div key={policy.id} className="flex items-center gap-1 rounded-full bg-blue-50 px-1.5 py-0.5">
                                                        <div className="flex h-3 w-3 items-center justify-center rounded-md bg-transparent border border-none">
                                                            <LucideFileLock2 className="h-3 w-3 text-blue-700" />
                                                        </div>
                                                        <span className="text-[11px] font-medium text-blue-700">
                                                            {policy.name}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Edit Signer Dialog */}
            <Dialog open={!!editingSigner} onOpenChange={(open) => !open && setEditingSigner(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Signer</DialogTitle>
                        <DialogDescription>
                            Update the name and description for this signer.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Name</label>
                            <Input
                                value={newSignerName}
                                onChange={(e) => setNewSignerName(e.target.value)}
                                placeholder="Enter signer name"
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Description</label>
                            <Input
                                value={newSignerPurpose}
                                onChange={(e) => setNewSignerPurpose(e.target.value)}
                                placeholder="Enter signer description"
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setEditingSigner(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditSigner}
                            disabled={!newSignerName.trim()}
                        >
                            Save Changes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

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