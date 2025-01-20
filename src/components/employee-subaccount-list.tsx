"use client"

import { useEffect, useState } from "react"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { ChevronDown, ChevronUp, Edit, Trash2, CheckCircle, XCircle, Loader2, Copy, Plus } from "lucide-react"
import { useSmartWallet } from "~/hooks/useSmartWallet"
import { copyToClipboard, shortAddress, toStroops } from "~/lib/utils"
import { SignersActions } from "~/app/_components/signers-actions"
import { Keypair } from "@stellar/stellar-sdk"
import toast from "react-hot-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form"

type EmployeeSubaccount = {
  id: number
  name: string
  email: string
  balance: number
  spendingLimit: number
  web3Address: string
  expenseRequests: {
    id: number
    amount: number
    description: string
    status: "pending" | "approved" | "rejected"
  }[]
}

const fillDummySubaccountData = (subwallet: string, settings: { email: string, name: string, limitPerTransaction: number }) => {
  return {
    id: 1,
    name: settings.name,
    email: settings.email,
    balance: 5000,
    spendingLimit: settings.limitPerTransaction,
    limitPerTransaction: settings.limitPerTransaction,
    stellarAddress: subwallet,
    expenseRequests: [
      { id: 1, amount: 150, description: "Office supplies", status: "pending" },
      { id: 2, amount: 300, description: "Client dinner", status: "approved" },
    ],
  }
}

const subaccountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  limitPerTransaction: z.string().transform((val) => parseFloat(val)),
})

type SubaccountFormData = z.infer<typeof subaccountSchema>

export function EmployeeSubaccountList() {
  const [isLoading, setIsLoading] = useState(true);
  const { subWallets, transfer, addSubWallet } = useSmartWallet();
  const [isAddingSubaccount, setIsAddingSubaccount] = useState(false);

  useEffect(() => {
    // initial 1 second loading
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  }, [subWallets]);


  const [newEmployeeName, setNewEmployeeName] = useState("")
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("")
  const [isTransfering, setIsTransfering] = useState<Record<string, boolean>>({});

  const AddSubaccountDialog = () => {
    const [open, setOpen] = useState(false)

    const form = useForm<SubaccountFormData>({
      resolver: zodResolver(subaccountSchema),
      defaultValues: {
        name: "",
        email: "",
        limitPerTransaction: 0,
      },
    })

    const onSubmit = async (data: SubaccountFormData) => {
      setIsAddingSubaccount(true)
      try {
        await addSubWallet(data.email, data.name, data.limitPerTransaction)
        setOpen(false)
        form.reset()
      } catch (error) {
        console.error("Failed to add subaccount:", error)
      } finally {
        setIsAddingSubaccount(false)
      }
    }

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Subaccount
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Subaccount</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="limitPerTransaction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Limit (USD)</FormLabel>
                    <FormControl>
                      <Input placeholder="1000" type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Create Subaccount
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    )
  }

  const updateSpendingLimit = (id: number, newLimit: number) => {
    // TODO: Implement spending limit update
    // setSubaccounts(
    //   subaccounts.map((account) => (account.id === id ? { ...account, spendingLimit: newLimit } : account)),
    // )
  }

  const handleExpenseAction = (accountId: number, requestId: number, action: "approve" | "reject") => {
    // TODO: Implement expense action
    // setSubaccounts(
    //   subaccounts.map((account) => {
    //     if (account.id === accountId) {
    //       const updatedRequests = account.expenseRequests.map((request) =>
    //         request.id === requestId ? { ...request, status: action === "approve" ? "approved" : "rejected" } : request,
    //       )
    //       return { ...account, expenseRequests: updatedRequests }
    //     }
    //     return account
    //   }),
    // )
  }

  const handleTransfer = async ({ keypair, to, amount }: { keypair?: Keypair, to: string, amount: number }) => {
    if (!keypair) return;
    setIsTransfering(prev => ({ ...prev, [keypair.publicKey()]: true }));
    await transfer({ keypair, to, amount }).then(() => {
      toast.success("Transfer completed");
    });
    setIsTransfering(prev => ({ ...prev, [keypair.publicKey()]: false }));
  }

  return (
    <Card className="bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-lg text-primary flex justify-between">Employee Sub-accounts
          <AddSubaccountDialog />
        </CardTitle>
        <CardDescription className="text-xs">Manage employee sub-accounts and their spending limits</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isAddingSubaccount && (
            <div className="flex items-center justify-between space-x-4 p-3 bg-secondary rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div>
                  <div className="h-4 w-32 bg-muted rounded mb-2" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
            </div>
          )}
          {isLoading ? (
            // Skeleton loading state
            Array.from({ length: 3 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="animate-pulse">
                <div className="flex items-center justify-between space-x-4 p-3 bg-secondary rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-8 w-8 rounded-full bg-muted" />
                    <div>
                      <div className="h-4 w-32 bg-muted rounded mb-2" />
                      <div className="h-3 w-24 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-40 bg-muted rounded" />
                    <div className="flex items-end gap-0">
                      <div className="h-8 w-24 bg-muted rounded" />
                      <div className="h-8 w-8 bg-muted rounded ml-2" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            Array.from(subWallets ?? []).map(([key, settings]) => {
              const account = fillDummySubaccountData(key, settings);
              return (
                <Collapsible key={key}>
                  <div className="flex items-center justify-between space-x-4 p-3 bg-secondary rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={`/placeholder.svg?height=32&width=32`} alt={account.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {account.name?.split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-sm font-medium text-foreground flex gap-1 items-center">
                          {account.name}
                          <Badge className="bg-gradient-to-r from-[#4ab3e8] to-[#0081c6] text-gray-800" variant={"outline"}>
                            Ed25519{' '}
                            <p className="text-xs text-gray-200 pl-1">{shortAddress(account.stellarAddress)}</p>
                          </Badge>
                          {/* Add a copy button */}
                          <Button
                            onClick={() => copyToClipboard(account.stellarAddress)}
                            variant="ghost" className="p-0 rounded-full hover:scale-105 transition-all duration-100">
                            <Copy className="h-2 w-2 text-primary" />
                          </Button>
                          {isTransfering[account.stellarAddress] && <Loader2 className="h-3 w-3 text-primary animate-spin" />}
                        </h3>
                        <p className="text-xs text-muted-foreground">{account.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs font-medium text-foreground">
                        Limit per transaction: <span className="text-primary">{Number(account.limitPerTransaction).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                      </div>
                      <div className="flex items-end gap-0">
                        <CollapsibleTrigger asChild>
                          <Button size="sm" className="p-0 px-4 rounded-md">
                            Requests <ChevronDown className="h-3 w-3 text-primary text-white" />
                          </Button>
                        </CollapsibleTrigger>
                        <SignersActions handleTransfer={handleTransfer} publicKey={key} />
                      </div>
                    </div>
                  </div>
                  <CollapsibleContent className="mt-2">
                    <Card className="bg-secondary">
                      <CardHeader>
                        <CardTitle className="text-sm text-primary">Expense Requests</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {account.expenseRequests.length > 0 ? (
                          <ul className="space-y-2">
                            {account.expenseRequests.map((request) => (
                              <li key={request.id} className="flex items-center justify-between p-2 bg-card rounded-lg">
                                <div>
                                  <p className="text-xs font-medium text-foreground">
                                    ${request.amount.toFixed(2)} - {request.description}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Status: {request.status}</p>
                                </div>
                                {request.status === "pending" && (
                                  <div className="space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleExpenseAction(account.id, request.id, "approve")}
                                      className="h-6 text-xs"
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleExpenseAction(account.id, request.id, "reject")}
                                      className="h-6 text-xs"
                                    >
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-muted-foreground">No expense requests.</p>
                        )}
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}

