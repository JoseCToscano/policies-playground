"use client";

import { useState, useEffect } from "react";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogTrigger } from "~/components/ui/dialog";
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
import { SignerModal } from '~/app/home/_components/signer-modal'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"

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



export function SignersList({ walletId }: { walletId: string }) {
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
                    <Dialog open={isModalOpen && selectedSigner?.publicKey === signer.publicKey} onOpenChange={(open) => {
                        if (!open) {
                            setSelectedSigner(null);
                        }
                        setIsModalOpen(open);
                    }}>
                        <DialogTrigger asChild>
                            <div
                                className="flex items-center justify-between border border-gray-200 rounded-md bg-white p-2 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => {
                                    setSelectedSigner(signer);
                                    setIsModalOpen(true);
                                }}
                            >
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

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            onClick={(e) => e.stopPropagation()}
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