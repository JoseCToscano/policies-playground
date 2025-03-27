"use client"

import * as React from "react"
import { MoreHorizontal, Loader2 } from "lucide-react"

import { Button } from "~/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { Arrow } from "@radix-ui/react-dropdown-menu"
import { Keypair } from "@stellar/stellar-sdk"
import { api } from "~/trpc/react"
import { account, ClientTRPCErrorHandler, policyAssignmentUtils } from "~/lib/utils"
import toast from "react-hot-toast"
import { useSmartWallet } from "~/hooks/useSmartWallet"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"

const labels = [
  "feature",
  "bug",
  "enhancement",
  "documentation",
  "design",
  "question",
  "maintenance",
]

type PolicyAssignment = {
  policyId: string;
  signerPublicKey: string;
  walletId: string;
  assignedAt: string;
}

type StoredPolicyAssignments = {
  [walletId: string]: PolicyAssignment[];
}

interface SignersActionsProps {
  handleSep10?: (publicKey: string) => void;
  handleTransfer: ({ keypair, to, amount, keyId }: { keypair?: Keypair, to: string, amount: number, keyId?: string }) => void;
  publicKey?: string;
  keyId?: string;
  walletId: string;
}

export function SignersActions({ handleTransfer, handleSep10, publicKey, keyId, walletId }: SignersActionsProps) {
  const [open, setOpen] = React.useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = React.useState(false);
  const [transferAmount, setTransferAmount] = React.useState(10);
  const [transferTo, setTransferTo] = React.useState("DUMMY_ADDRESS");
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { getKeypair, removeSubWallet, safeRemovePolicy } = useSmartWallet();

  const handleDelete = async () => {
    if (!publicKey) return;
    setIsDeleting(true);
    try {
      // Get all policies assigned to this signer
      const affectedPolicies = policyAssignmentUtils.removeSigner(publicKey, walletId);

      // Remove each policy from the signer
      for (const policyId of affectedPolicies) {
        // Note: You'll need to get the contractIdToLimit from somewhere
        // This could be stored in the policy assignments or fetched from the policies list
        await safeRemovePolicy(policyId, "", publicKey);
      }

      await removeSubWallet(publicKey);
      toast.success("Signer removed successfully");
    } catch (e) {
      console.error("Error deleting signer:", e);
      toast.error("Failed to delete signer");
    } finally {
      setIsDeleting(false);
    }
  }

  const executeTransfer = () => {
    if (!publicKey) return;
    handleTransfer({
      to: transferTo,
      amount: transferAmount,
      keyId: keyId
    });
  };

  const assignPolicy = (policyId: string) => {
    if (!publicKey) return;

    try {
      const storedAssignments = policyAssignmentUtils.getSignersForPolicy(policyId, walletId);
      const isAlreadyAssigned = storedAssignments.includes(publicKey);

      if (isAlreadyAssigned) {
        toast.error("Policy is already assigned to this signer");
        return;
      }

      // Add new assignment
      const assignments = JSON.parse(localStorage.getItem("zg:policy_assignments") || "{}");
      if (!assignments[walletId]) {
        assignments[walletId] = [];
      }

      assignments[walletId].push({
        policyId,
        signerPublicKey: publicKey,
        walletId,
        assignedAt: new Date().toISOString()
      });

      localStorage.setItem("zg:policy_assignments", JSON.stringify(assignments));
      toast.success("Policy assigned successfully");
      setOpen(false);
    } catch (error) {
      console.error("Error assigning policy:", error);
      toast.error("Failed to assign policy");
    }
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Arrow />
          <DropdownMenuLabel>Signer Actions</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem>Share</DropdownMenuItem>
            {handleSep10 && publicKey && <DropdownMenuItem onClick={() => handleSep10(publicKey)}>Sep10</DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Attach policy</DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                className="p-0"
                sideOffset={-4}
                alignOffset={-4}
              >
                <Command>
                  <CommandInput
                    placeholder="Filter label..."
                    autoFocus={true}
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>No label found.</CommandEmpty>
                    <CommandGroup>
                      {labels.map((label) => (
                        <CommandItem
                          key={label}
                          value={label}
                          onSelect={(value) => {
                            assignPolicy(value);
                          }}
                        >
                          {label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Delete
                  <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Funds</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="recipient" className="text-sm font-medium">
                Transfer to
              </label>
              <input
                value={transferTo}
                disabled
                onChange={(e) => {
                  e.preventDefault();
                  setTransferTo(e.target.value)
                }}
                id="recipient"
                type="text"
                className="w-full px-3 py-2 text-sm border rounded-md"
                placeholder="Recipient address"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Transfer amount
              </label>
              <input
                id="amount"
                type="number"
                min="0"
                step="any"
                className="w-full px-3 py-2 text-sm border rounded-md"
                placeholder="0.00"
                value={transferAmount}
                onChange={(e) => {
                  e.preventDefault();
                  setTransferAmount(Number(e.target.value))
                }}
              />
            </div>
            <Button
              onClick={() => {
                executeTransfer();
                setTransferDialogOpen(false);
              }}
              className="w-full"
              size="sm"
            >
              Transfer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
