"use client";
import { useState, useEffect } from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Copy, QrCode, Share2, ArrowRightLeft, Plus, Trash2, FileText } from "lucide-react";
import { copyToClipboard, shortAddress } from "~/lib/utils";
import { SignerInfo } from "~/app/home/_components/signers-list";
import { Policy } from "~/app/home/_components/policies-vault";
import { toast } from "react-hot-toast";

type AttachedPolicy = {
    signerPublicKey: string;
    policyId: string;
}

type StoredAttachedPolicies = {
    [walletId: string]: AttachedPolicy[];
}

export function SignerModal({ signer, policies, onClose, onAttachPolicy }: {
    signer: SignerInfo,
    policies: Policy[],
    onClose: () => void,
    onAttachPolicy?: (policy: Policy) => Promise<void>
}) {
    const [attachedPolicies, setAttachedPolicies] = useState<Policy[]>([]);
    const [isAttaching, setIsAttaching] = useState(false);
    const [showPolicySelector, setShowPolicySelector] = useState(false);
    const [availablePolicies, setAvailablePolicies] = useState<Policy[]>([]);

    useEffect(() => {
        // Load attached policies for this signer
        loadAttachedPolicies();

        // Calculate available policies (not yet attached)
        updateAvailablePolicies();
    }, [signer, policies]);

    const loadAttachedPolicies = () => {
        const storedAttachedPolicies: StoredAttachedPolicies = JSON.parse(
            localStorage.getItem("zg:attached_policies") || "{}"
        );

        const walletId = signer.walletId;
        const walletPolicies = storedAttachedPolicies[walletId] || [];
        const signerPolicyIds = walletPolicies
            .filter(ap => ap.signerPublicKey === signer.publicKey)
            .map(ap => ap.policyId);

        const attached = policies.filter(policy => signerPolicyIds.includes(policy.id));
        setAttachedPolicies(attached);
    };

    const updateAvailablePolicies = () => {
        const attachedIds = attachedPolicies.map(p => p.id);
        const available = policies.filter(policy => !attachedIds.includes(policy.id));
        setAvailablePolicies(available);
    };

    const handleAttachPolicy = async (policy: Policy) => {
        if (!onAttachPolicy) return;

        setIsAttaching(true);
        try {
            await onAttachPolicy(policy);

            // Update local storage to track which policies are attached to which signers
            const storedAttachedPolicies: StoredAttachedPolicies = JSON.parse(
                localStorage.getItem("zg:attached_policies") || "{}"
            );

            const walletId = signer.walletId;
            if (!storedAttachedPolicies[walletId]) {
                storedAttachedPolicies[walletId] = [];
            }

            storedAttachedPolicies[walletId].push({
                signerPublicKey: signer.publicKey,
                policyId: policy.id
            });

            localStorage.setItem("zg:attached_policies", JSON.stringify(storedAttachedPolicies));

            // Update UI
            setAttachedPolicies([...attachedPolicies, policy]);
            setShowPolicySelector(false);
            toast.success(`Policy "${policy.name}" attached successfully`);
        } catch (error) {
            console.error("Error attaching policy:", error);
            toast.error("Failed to attach policy");
        } finally {
            setIsAttaching(false);
        }
    };

    const handleDetachPolicy = (policyId: string) => {
        try {
            // Remove from local storage
            const storedAttachedPolicies: StoredAttachedPolicies = JSON.parse(
                localStorage.getItem("zg:attached_policies") || "{}"
            );

            const walletId = signer.walletId;
            if (storedAttachedPolicies[walletId]) {
                storedAttachedPolicies[walletId] = storedAttachedPolicies[walletId]
                    .filter(ap => !(ap.signerPublicKey === signer.publicKey && ap.policyId === policyId));

                localStorage.setItem("zg:attached_policies", JSON.stringify(storedAttachedPolicies));
            }

            // Update UI
            setAttachedPolicies(attachedPolicies.filter(p => p.id !== policyId));
            toast.success("Policy detached successfully");
        } catch (error) {
            console.error("Error detaching policy:", error);
            toast.error("Failed to detach policy");
        }
    };

    // Recalculate available policies when attached policies change
    useEffect(() => {
        updateAvailablePolicies();
    }, [attachedPolicies]);

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
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowPolicySelector(true)}
                                    disabled={availablePolicies.length === 0}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Attach Policy
                                </Button>
                            </div>

                            {showPolicySelector && (
                                <div className="rounded-md border border-gray-200 p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium text-gray-900">Select a Policy to Attach</h4>
                                        <button
                                            onClick={() => setShowPolicySelector(false)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    {availablePolicies.length === 0 ? (
                                        <div className="rounded-md bg-gray-50 border border-dashed border-gray-200 p-4 text-center">
                                            <p className="text-sm text-gray-500">No more policies available</p>
                                            <p className="text-xs text-gray-400 mt-1">Create new policies in the Policies section</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {availablePolicies.map((policy) => (
                                                <div
                                                    key={policy.id}
                                                    onClick={() => handleAttachPolicy(policy)}
                                                    className="flex items-center gap-3 p-3 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer"
                                                >
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-50 border border-gray-200">
                                                        <FileText className="h-4 w-4 text-gray-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h5 className="text-sm font-medium text-gray-900 truncate">{policy.name}</h5>
                                                        <p className="text-xs text-gray-500 truncate">{shortAddress(policy.contractIdToLimit)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {attachedPolicies.length === 0 ? (
                                <div className="rounded-md border border-dashed border-gray-200 p-8 text-center">
                                    <div className="mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                                        <FileText className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-1">No policies attached</h3>
                                    <p className="text-sm text-gray-500 mb-4">Add policies to control this signer's permissions</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowPolicySelector(true)}
                                        disabled={availablePolicies.length === 0}
                                    >
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
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700"
                                                onClick={() => handleDetachPolicy(policy.id)}
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
    );
}