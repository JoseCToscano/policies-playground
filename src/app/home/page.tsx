'use client'

import { useEffect, useState } from 'react'
import { Badge } from '~/components/ui/badge'
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { useSmartWallet } from '~/hooks/useSmartWallet'
import { copyToClipboard, fromStroops, shortAddress } from '~/lib/utils'
import { MoreHorizontal, PackagePlus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { SignersActions } from '../_components/signers-actions'

export default function PasskeyCreation() {
  const [status, setStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [accountDetails, setAccountDetails] = useState<{ username: string; userId: string } | null>(null)
  const { create, getWalletSigners, addSubWallet, subWallets, fundWallet, balance, contractId, addSigner_Ed25519, loading, signers, isFunding } = useSmartWallet();


  const handleCreate = async () => {
    setStatus('creating');
    try {
      await create();
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage((error as Error)?.message || 'Unknown error');
    }
  }

  const handleAddSigner = async () => {
    console.log("Adding signer ...");
    const { publicKey } = await addSigner_Ed25519();
    if (publicKey) {
      console.log("Signer added:", publicKey);
    } else {
      console.error("Failed to add signer");
    }
    await getWalletSigners();
  }
  
  const handleAddSubWallet = async () => {
    console.log("Adding subwallet ...");
     await addSubWallet();
    await getWalletSigners();
  }

  const handleRemoveSigner = async (key: string) => {
    // TODO: Implement remove signer functionality
    console.log("Removing signer:", key)
  }

  useEffect(() => {
    if (contractId) {
      setStatus('success');
    }
  }, [contractId]);

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Create a Smart Wallet</CardTitle>
        <CardDescription>Built on Stellar's passkey technology.</CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'idle' && (
          <Button onClick={handleCreate} className="w-full">
            Create Passkey
          </Button>
        )}
        {status === 'creating' && (
          <div className="text-center">
            <p>Creating passkey...</p>
            <div className="mt-2 animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
        {status === 'success' && (
          <div className="text-center">
            <p className="text-green-600 mb-4">Passkey created successfully!</p>
            <div className="bg-gray-100 p-4 rounded-md">
              <h3 className="font-semibold mb-2">Account Details:</h3>
              <p><span className="font-medium">Contract ID:</span> <span className="cursor-pointer" onClick={() => copyToClipboard(String(contractId))}>{shortAddress(contractId)}</span></p>
              <p><span className="font-medium">Balance:</span> {fromStroops(balance)}</p>
            </div>
            { /** Signers */}
            {signers.map(({key, kind}) => (
              <div className="bg-gray-100 mt-1 pl-1 rounded-md flex justify-between gap-0 items-center border-[1px] border-gray-300" key={key}>
                <div className="flex w-full items-center gap-2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-gray-800" variant={"outline"}>{kind}</Badge>
                  <p>{shortAddress(key)}</p>
                </div>
                <div className="flex items-end gap-0">
                <SignersActions />
              </div>
              </div>
            ))}
             { /** Sub Wallets */}
            {subWallets && Array.from(subWallets).map(([key, [secret, interval, amount]]) => (
              <div className="bg-gray-100 mt-1 pl-1 rounded-md flex justify-between gap-0 items-center border-[1px] border-gray-300" key={key}>
                <div className="flex w-full items-center gap-2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-gray-800" variant={"outline"}>Policy signer</Badge>
                  <p>{shortAddress(key)}</p>
                  <p>{amount}</p>
                  <p>{shortAddress(secret)}</p>
                </div>
                <div className="flex items-end gap-0">
                  <SignersActions />
                </div>
              </div>
            ))}
            {/** Actions */}
            <div className="flex justify-center mt-4 gap-2">
              {contractId && <Button onClick={()=>{fundWallet(contractId!)}}>{isFunding ? "Funding..." : "Fund Wallet"}</Button>}
              <Button onClick={handleAddSigner}>{loading ? "Adding..." : "Add Signer"}</Button>
              <Button onClick={handleAddSubWallet}>{loading ? "Adding..." : "Add Sub wallet"}</Button>
            </div>
          </div>
        )}
        {status === 'error' && (
          <div className="text-center text-red-600">
            <p>Error creating passkey:</p>
            <p>{errorMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

