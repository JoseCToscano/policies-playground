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

    return (
        <div className="space-y-2">
            {signers.map((signer) => {
                const assignedPolicies = getAssignedPolicies(signer.publicKey);

                return (
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
                                    <DropdownMenuItem className="gap-2 text-xs">
                                        <ArrowRightLeft className="h-3.5 w-3.5" />
                                        <span>Transfer</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="gap-2 text-xs">
                                        <Terminal className="h-3.5 w-3.5" />
                                        <span>Call Contract</span>
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
                );
            })}
        </div>
    );
}