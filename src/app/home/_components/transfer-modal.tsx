'use client'

import { useState, useEffect } from 'react'
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog"
import { ArrowRightLeft, Loader2 } from "lucide-react"
import { useSmartWallet } from '~/hooks/useSmartWallet'
import { toast } from 'react-hot-toast'
import { SignerInfo, StoredSigners } from '~/app/home/_components/signers-list'

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  currentWalletId: string
}

const ASSET_OPTIONS = [
  { value: 'XLM', label: 'XLM (Stellar Lumens)', address: 'native' },
  { value: 'USDC', label: 'USDC', address: 'USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5' },
  { value: 'EURC', label: 'EURC', address: 'EURC-GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO' },
]

export function TransferModal({ isOpen, onClose, currentWalletId }: TransferModalProps) {
  const [fromWallet, setFromWallet] = useState<string>(currentWalletId)
  const [toAddress, setToAddress] = useState<string>('')
  const [selectedAsset, setSelectedAsset] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [isTransferring, setIsTransferring] = useState(false)
  const [availableSigners, setAvailableSigners] = useState<SignerInfo[]>([])

  const { transfer, keyId, getSignerSecret } = useSmartWallet()

  useEffect(() => {
    if (isOpen && currentWalletId) {
      const storedSigners: StoredSigners = JSON.parse(localStorage.getItem("zg:wallet_signers") || "{}")
      const signers = storedSigners[currentWalletId] || []
      setAvailableSigners(signers)
    }
  }, [isOpen, currentWalletId])

  const handleTransfer = async () => {
    if (!toAddress || !amount || !selectedAsset) {
      toast.error('Please fill in all fields')
      return
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setIsTransferring(true)
    try {
      const amountInStroops = selectedAsset === 'XLM' 
        ? Number(amount) * 10_000_000 // Convert XLM to stroops
        : Number(amount) * 10_000_000 // Assume other assets use same precision

      // Check if transferring from main wallet or signer wallet
      const isMainWallet = fromWallet === currentWalletId
      
      if (isMainWallet) {
        // Transfer from main wallet using keyId
        await transfer({
          to: toAddress,
          amount: amountInStroops,
          keypair: undefined,
          keyId: keyId
        })
      } else {
        // Transfer from signer wallet using keypair
        const signerSecret = getSignerSecret(fromWallet)
        if (!signerSecret) {
          toast.error('Signer secret not found')
          return
        }
        
        const { Keypair } = await import('@stellar/stellar-sdk')
        const keypair = Keypair.fromSecret(signerSecret)
        
        await transfer({
          to: toAddress,
          amount: amountInStroops,
          keypair: keypair,
          keyId: undefined
        })
      }

      toast.success('Transfer completed successfully')
      onClose()
      
      // Reset form
      setToAddress('')
      setAmount('')
      setSelectedAsset('')
    } catch (error) {
      console.error('Transfer failed:', error)
      toast.error('Transfer failed. Please try again.')
    } finally {
      setIsTransferring(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transfer Assets
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">From</label>
            <Select value={fromWallet} onValueChange={setFromWallet}>
              <SelectTrigger>
                <SelectValue placeholder="Select wallet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={currentWalletId}>
                  Main Wallet ({currentWalletId.slice(0, 8)}...)
                </SelectItem>
                {availableSigners.map((signer) => (
                  <SelectItem key={signer.publicKey} value={signer.publicKey}>
                    {signer.name} ({signer.publicKey.slice(0, 8)}...)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">To</label>
            <Input
              placeholder="Enter Stellar address"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Asset</label>
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger>
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent>
                {ASSET_OPTIONS.map((asset) => (
                  <SelectItem key={asset.value} value={asset.value}>
                    {asset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleTransfer} 
            disabled={isTransferring || !toAddress || !amount || !selectedAsset}
          >
            {isTransferring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Transferring...
              </>
            ) : (
              'Transfer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}