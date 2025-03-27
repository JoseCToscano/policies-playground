"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Copy, Pencil, Share2, Trash2, FileText, Loader2, Plus, MoreVertical } from "lucide-react";
import { copyToClipboard, shortAddress } from "~/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

type PolicyType = 'contract';

export type Policy = {
    id: string;
    name: string;
    type: PolicyType;
    content: string; // Contract address
    policyId: string; // Policy ID to limit
    contractIdToLimit: string; // Contract ID to limit
    createdAt: string;
    description: string;
}

type StoredPolicies = {
    [walletId: string]: Policy[];
}

const policyFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    contractAddress: z.string().min(1, "Contract address is required"),
    policyId: z.string().min(1, "Policy ID is required"),
    contractIdToLimit: z.string().min(1, "Contract ID to limit is required"),
});

export function PoliciesVault({ walletId, onPolicyAttach }: { walletId: string, onPolicyAttach?: (policy: Policy) => Promise<void> }) {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isAttaching, setIsAttaching] = useState(false);

    const form = useForm<z.infer<typeof policyFormSchema>>({
        resolver: zodResolver(policyFormSchema),
        defaultValues: {
            name: "",
            description: "",
            contractAddress: "",
            policyId: "",
            contractIdToLimit: "",
        },
    });

    useEffect(() => {
        const storedPolicies: StoredPolicies = JSON.parse(localStorage.getItem("zg:wallet_policies") || "{}");
        setPolicies(storedPolicies[walletId] || []);
    }, [walletId]);

    const handleAddPolicy = async (values: z.infer<typeof policyFormSchema>) => {
        setIsAdding(true);
        try {
            const newPolicy: Policy = {
                id: crypto.randomUUID(),
                name: values.name,
                type: 'contract',
                content: values.contractAddress,
                policyId: values.policyId,
                contractIdToLimit: values.contractIdToLimit,
                createdAt: new Date().toISOString(),
                description: values.description
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
            setIsOpen(false);
            form.reset();
        } catch (error) {
            console.error('Error adding policy:', error);
            toast.error('Failed to add policy');
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeletePolicy = (policyId: string) => {
        try {
            // Update localStorage
            const storedPolicies: StoredPolicies = JSON.parse(localStorage.getItem("zg:wallet_policies") || "{}");
            if (storedPolicies[walletId]) {
                storedPolicies[walletId] = storedPolicies[walletId].filter(p => p.id !== policyId);
                localStorage.setItem("zg:wallet_policies", JSON.stringify(storedPolicies));
            }

            // Update state
            setPolicies(prev => prev.filter(p => p.id !== policyId));
            toast.success('Policy deleted successfully');
        } catch (error) {
            console.error('Error deleting policy:', error);
            toast.error('Failed to delete policy');
        }
    };

    const handleAttachPolicy = async (policy: Policy) => {
        if (!onPolicyAttach) {
            toast.error('Policy attachment not available');
            return;
        }

        setIsAttaching(true);
        try {
            await onPolicyAttach(policy);
            toast.success('Policy attached successfully');
        } catch (error) {
            console.error('Error attaching policy:', error);
            toast.error('Failed to attach policy');
        } finally {
            setIsAttaching(false);
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
                    onClick={() => setIsOpen(true)}
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2"
                >
                    <Plus className="mr-1 h-3 w-3" />
                    Add
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
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <span>Contract: </span>
                                            <span className="font-mono">{shortAddress(policy.content)}</span>
                                            <button
                                                onClick={() => copyToClipboard(policy.content)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <Copy className="h-3 w-3" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <span>Policy ID: </span>
                                            <span className="font-mono">{shortAddress(policy.policyId)}</span>
                                        </div>
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
                                    {onPolicyAttach && (
                                        <DropdownMenuItem
                                            className="text-xs"
                                            onClick={() => handleAttachPolicy(policy)}
                                            disabled={isAttaching}
                                        >
                                            <Share2 className="mr-2 h-3.5 w-3.5" />
                                            <span>{isAttaching ? 'Attaching...' : 'Attach Policy'}</span>
                                        </DropdownMenuItem>
                                    )}
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

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Policy</DialogTitle>
                        <DialogDescription>
                            Create a new policy to limit contract interactions.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleAddPolicy)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Policy Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter a name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Policy description" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contractAddress"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contract Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter contract address" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="policyId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Policy ID</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter policy ID" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contractIdToLimit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contract ID to Limit</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter contract ID to limit" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isAdding}>
                                    {isAdding ? (
                                        <>
                                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                            Adding...
                                        </>
                                    ) : 'Add Policy'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
