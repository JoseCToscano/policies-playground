"use client"

import * as React from "react"
import { MoreHorizontal, Copy, QrCode, Share2, Link } from "lucide-react"
import { QRCodeSVG } from 'qrcode.react';

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
import { account, ClientTRPCErrorHandler, copyToClipboard } from "~/lib/utils"
import toast from "react-hot-toast"
import { useSmartWallet } from "~/hooks/useSmartWallet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "~/components/ui/dialog"

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
  handleTransfer: ({ keypair, to, amount, keyId }: { keypair?: Keypair, to: string, amount: number, keyId?: string }) => void;
  publicKey?: string;
  keyId?: string;
}

export function SignersActions({ handleTransfer, handleSep10, publicKey, keyId }: SignersActionsProps) {
  const [open, setOpen] = React.useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = React.useState(false);
  const [transferAmount, setTransferAmount] = React.useState(10);
  const [transferTo, setTransferTo] = React.useState("DUMMY_ADDRESS");
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { getKeypair, removeSubWallet } = useSmartWallet();

  const executeTransfer = async () => {
    try {
      if (!handleTransfer || !(publicKey || keyId)) return;
      if (!transferTo || !transferAmount) { alert("Please fill in all fields"); return; }
      if (publicKey) {
        const kp = await getKeypair(publicKey);
        if (!kp) {
          toast.error("Failed to get keypair");
          return;
        }
        await handleTransfer({ keypair: kp, to: transferTo, amount: transferAmount });
      } else {
        await handleTransfer({ to: transferTo, amount: transferAmount, keyId });
      }
    } catch (e) {
      toast.error("Transfer failed");
    }
  }

  const handleDelete = async () => {
    if (!publicKey) return;
    setIsDeleting(true);
    try {
      await removeSubWallet(publicKey);
    } catch (e) {
      toast.error("Failed to delete subwallet");
    } finally {
      setIsDeleting(false);
    }
  }

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
            <Dialog>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => {
                  e.preventDefault();
                  setOpen(false);
                }}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Share Signer</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center space-y-6">
                  {/* QR Code */}
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    {publicKey && (
                      <QRCodeSVG
                        value={publicKey}
                        size={200}
                        level="H"
                        includeMargin={true}
                        className="w-full h-full"
                      />
                    )}
                  </div>

                  {/* Public Key */}
                  <div className="w-full space-y-2">
                    <label className="text-sm font-medium text-gray-700">Public Key</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={publicKey || ""}
                        className="flex-1 px-3 py-2 text-sm border rounded-md bg-gray-50"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (publicKey) {
                            copyToClipboard(publicKey);
                            toast.success("Public key copied!");
                          }
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Share Options */}
                  <div className="w-full space-y-2">
                    <label className="text-sm font-medium text-gray-700">Share via</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          if (publicKey) {
                            void navigator.share({
                              title: "Share Signer",
                              text: `Signer Public Key: ${publicKey}`,
                            }).catch(() => {
                              // Fallback if Web Share API is not supported
                              copyToClipboard(publicKey);
                              toast.success("Public key copied!");
                            });
                          }
                        }}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          if (publicKey) {
                            copyToClipboard(publicKey);
                            toast.success("Public key copied!");
                          }
                        }}
                      >
                        <Link className="h-4 w-4 mr-2" />
                        Copy Link
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            {handleSep10 && publicKey && <DropdownMenuItem onClick={() => handleSep10(publicKey)}>Sep10</DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              setOpen(false);
              setTransferDialogOpen(true);
            }}>
              Transfer
            </DropdownMenuItem>
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
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={() => {
              handleDelete();
            }}>
              {isDeleting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div> : "Delete"}
              <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
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
