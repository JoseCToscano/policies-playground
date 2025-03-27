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

export function SignerModal({ signer, policies, onClose }: {
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