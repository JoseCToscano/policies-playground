"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Copy, Share2, Trash2, FileText, Loader2, Plus, MoreVertical, CircleDollarSign, EuroIcon, StarIcon, Combine, LucideFileLock2, Pencil } from "lucide-react";
import { copyToClipboard, shortAddress, policyAssignmentUtils } from "~/lib/utils";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Combobox, ComboboxItem } from "~/components/ui/combobox";
import { Textarea } from "~/components/ui/textarea";
import { useSmartWallet } from "~/hooks/useSmartWallet";

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
});

// Popular contracts for the combobox
const popularContracts: ComboboxItem[] = [
    {
        value: "native",
        label: "Native XLM",
        description: "Stellar's native token",
        icon: <StarIcon className="h-3.5 w-3.5" />
    },
    {
        value: "USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
        label: "USDC Token",
        description: "Circle's USD Coin on Stellar",
        icon: <CircleDollarSign className="h-3.5 w-3.5" />
    },
    {
        value: "EURC-GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO",
        label: "EURC Token",
        description: "Circle's Euro Coin on Stellar",
        icon: <EuroIcon className="h-3.5 w-3.5" />
    },
    {
        value: "CCHZKMVGSP3N4YEHD4EFHA6UKND5NDVP4COTAFENAFMPRNTEC2U2ST5F",
        label: "Blend",
        description: "Blend Protocol",
        icon: <Combine className="h-3.5 w-3.5" />
    },
    {
        value: "CAXZG5WRNRY4ZDG6UPNFAQ2HY77HPETA7YIQDKFK4JENRVH43X2TREW6",
        label: "Do Math",
        description: "@kalepail's Do Math Demo",
        icon: <Combine className="h-3.5 w-3.5" />
    },
    {
        label: "Contact's list",
        description: "@JoseCToscano's Contact's Smart Contract Demo",
        value: "CA7RPHRR5MCWBPDD4ZT6M6AIME7KTZH5QRHFT45GXNAXCQ3VW3ABJXAZ",
        icon: <Combine className="h-3.5 w-3.5" />
    },
];

export function PoliciesVault({ walletId }: { walletId: string }) {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState("");
    const { addPolicy, safeRemovePolicy, detachPolicy } = useSmartWallet();
    const [isRemoving, setIsRemoving] = useState(false);
    const [deletingPolicyId, setDeletingPolicyId] = useState<string | null>(null);
    const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
    const [newPolicyName, setNewPolicyName] = useState("");
    const [newPolicyDescription, setNewPolicyDescription] = useState("");

    const form = useForm<z.infer<typeof policyFormSchema>>({
        resolver: zodResolver(policyFormSchema),
        defaultValues: {
            name: "",
            description: "",
            contractAddress: "",
            policyId: "",
        },
    });

    // Update form value when contract is selected from combobox
    useEffect(() => {
        if (selectedContract) {
            form.setValue("contractAddress", selectedContract);
        }
    }, [selectedContract, form]);

    useEffect(() => {
        const storedPolicies: StoredPolicies = JSON.parse(localStorage.getItem("zg:wallet_policies") || "{}");
        setPolicies(storedPolicies[walletId] || []);
    }, [walletId]);

    const handleAddPolicy = async (values: z.infer<typeof policyFormSchema>) => {
        setIsAdding(true);
        try {
            const res = await addPolicy(values.policyId);
            console.log('res', res);
            const newPolicy: Policy = {
                id: crypto.randomUUID(),
                name: values.name,
                type: 'contract',
                content: values.contractAddress,
                policyId: values.policyId,
                contractIdToLimit: values.contractAddress,
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
            setSelectedContract("");
        } catch (error) {
            console.error('Error adding policy:', error);
            toast.error('Failed to add policy');
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemovePolicy = async (policy: Policy) => {
        try {
            setDeletingPolicyId(policy.id);
            setIsRemoving(true);
            // Get all signers that have this policy assigned
            const affectedSigners = policyAssignmentUtils.getSignersForPolicy(policy.id, walletId);
            console.log('affectedSigners', affectedSigners);
            // Remove policy from all affected signers
            for (const signerKey of affectedSigners) {
                console.log('signerKey', signerKey);
                await detachPolicy(signerKey);
            }

            await safeRemovePolicy(policy.policyId);

            // Remove policy assignments from storage
            policyAssignmentUtils.removePolicy(policy.id, walletId);

            // Remove policy from local storage
            const storedPolicies: StoredPolicies = JSON.parse(
                localStorage.getItem("zg:wallet_policies") || "{}"
            );

            if (storedPolicies[walletId]) {
                storedPolicies[walletId] = storedPolicies[walletId].filter(p => p.id !== policy.id);
                localStorage.setItem("zg:wallet_policies", JSON.stringify(storedPolicies));

                // Update local state immediately
                setPolicies(storedPolicies[walletId]);
            }

            toast.success("Policy removed successfully");
        } catch (error) {
            console.error("Error removing policy:", error);
            toast.error("Failed to remove policy");
        } finally {
            setIsRemoving(false);
            setDeletingPolicyId(null);
        }
    }

    const handleEditPolicy = () => {
        if (!editingPolicy || !newPolicyName.trim()) return;

        try {
            // Update in localStorage
            const storedPolicies: StoredPolicies = JSON.parse(localStorage.getItem("zg:wallet_policies") || "{}");
            const walletPolicies = storedPolicies[walletId] || [];
            const policyIndex = walletPolicies.findIndex(p => p.id === editingPolicy.id);

            if (policyIndex !== -1) {
                walletPolicies[policyIndex] = {
                    ...editingPolicy,
                    name: newPolicyName.trim(),
                    description: newPolicyDescription.trim()
                };
                storedPolicies[walletId] = walletPolicies;
                localStorage.setItem("zg:wallet_policies", JSON.stringify(storedPolicies));

                // Update local state
                setPolicies(walletPolicies);
                toast.success("Policy updated successfully");
            }
        } catch (error) {
            console.error("Error updating policy:", error);
            toast.error("Failed to update policy");
        } finally {
            setEditingPolicy(null);
            setNewPolicyName("");
            setNewPolicyDescription("");
        }
    };

    return (
        <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-700">Policies</h3>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4 bg-gray-100 border border-gray-200 text-gray-600">
                        {policies.length}
                    </Badge>
                </div>
                <Button
                    onClick={() => setIsOpen(true)}
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-gray-100"
                >
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                </Button>
            </div>

            <div className="p-4 space-y-2">
                {policies.length === 0 ? (
                    <div className="rounded-md border border-dashed border-gray-200 p-3 text-center">
                        <p className="text-xs text-gray-500">No policies attached</p>
                    </div>
                ) : (
                    policies.map((policy) => (
                        <div
                            key={policy.id}
                            className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-2 hover:bg-gray-50"
                        >
                            {deletingPolicyId === policy.id && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-md z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                                        <span className="text-xs text-red-600">Removing policy...</span>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-50 border border-gray-200">
                                    <LucideFileLock2 className="h-3.5 w-3.5 text-gray-500" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-medium text-gray-900">{policy.name}</h4>
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <span>Policy ID: </span>
                                            <span className="font-mono">{shortAddress(policy.policyId)}</span>
                                            <button
                                                onClick={() => copyToClipboard(policy.policyId)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <Copy className="h-3 w-3" />
                                            </button>
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
                                    <DropdownMenuItem className="text-xs" onClick={() => copyToClipboard(policy.content)}>
                                        <Copy className="mr-2 h-3.5 w-3.5" />
                                        <span>Copy Address</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-xs"
                                        onClick={() => {
                                            setEditingPolicy(policy);
                                            setNewPolicyName(policy.name);
                                            setNewPolicyDescription(policy.description);
                                        }}
                                    >
                                        <Pencil className="mr-2 h-3.5 w-3.5" />
                                        <span>Edit Policy</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-xs text-red-600"
                                        onClick={() => handleRemovePolicy(policy)}
                                        disabled={deletingPolicyId === policy.id}
                                    >
                                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                                        <span>Remove Policy</span>
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
                                            <div className="space-y-2">
                                                <Combobox
                                                    items={popularContracts}
                                                    value={selectedContract}
                                                    onChange={setSelectedContract}
                                                    placeholder="Select a contract or enter address"
                                                    searchPlaceholder="Search contracts..."
                                                    emptyText="No contracts found"
                                                />
                                                <Input
                                                    placeholder="Or enter contract address manually"
                                                    {...field}
                                                    value={selectedContract || field.value}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        setSelectedContract(e.target.value);
                                                    }}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            This contract will also be the one limited by the policy.
                                        </p>
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

            {/* Edit Policy Dialog */}
            <Dialog open={!!editingPolicy} onOpenChange={(open) => !open && setEditingPolicy(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Policy</DialogTitle>
                        <DialogDescription>
                            Update the name and description for this policy.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Name</label>
                            <Input
                                value={newPolicyName}
                                onChange={(e) => setNewPolicyName(e.target.value)}
                                placeholder="Enter policy name"
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Description</label>
                            <Textarea
                                value={newPolicyDescription}
                                onChange={(e) => setNewPolicyDescription(e.target.value)}
                                placeholder="Enter policy description"
                                className="w-full"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditingPolicy(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditPolicy}
                            disabled={!newPolicyName.trim()}
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
