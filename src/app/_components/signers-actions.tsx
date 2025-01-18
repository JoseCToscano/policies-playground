"use client"

import * as React from "react"
import { MoreHorizontal } from "lucide-react"

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
import { account, ClientTRPCErrorHandler } from "~/lib/utils"
import toast from "react-hot-toast"

const labels = [
  "feature",
  "bug",
  "enhancement",
  "documentation",
  "design",
  "question",
  "maintenance",
]

interface SignersActionsProps {
  handleSep10?: (publicKey: string) => void;
  handleTransfer: ({keypair, to, amount, keyId}: {keypair?: Keypair, to: string, amount: number, keyId?: string}) => void;
  secret?: string;
  publicKey?: string;
  keyId?: string;
}

export function SignersActions({ handleTransfer, handleSep10, secret, publicKey, keyId }: SignersActionsProps) {
  const [open, setOpen] = React.useState(false);
  const [transferAmount, setTransferAmount] = React.useState(0);
  const [transferTo, setTransferTo] = React.useState("");

const executeTransfer = async () => {
  if (!handleTransfer || !(secret || keyId)) return;
  if (!transferTo || !transferAmount) {alert("Please fill in all fields"); return;}
  if (secret) {
    await handleTransfer({keypair: Keypair.fromSecret(secret), to: transferTo, amount: transferAmount, keyId});
  } else {
    await handleTransfer({to: transferTo, amount: transferAmount, keyId});
  }
}

  return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="right">
          <Arrow/>
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
                            setOpen(false)
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
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Transfer</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <label htmlFor="recipient" className="text-sm font-medium">
                    Transfer to
                  </label>
                  <input
                    onChange={(e) => {
                        e.preventDefault();
                        setTransferTo(e.target.value)}}
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
                    onChange={(e) => {
                        e.preventDefault();
                        setTransferAmount(Number(e.target.value))}}
                  />
                </div>
                <Button onClick={executeTransfer} className="w-full" size="sm">
                  Transfer
                </Button>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              Delete
              <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
  )
}
