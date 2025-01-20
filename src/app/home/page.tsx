'use client'

import { useEffect, useState } from 'react'
import { Badge } from '~/components/ui/badge'
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { useSmartWallet } from '~/hooks/useSmartWallet'
import { account, ClientTRPCErrorHandler, copyToClipboard, fromStroops, shortAddress } from '~/lib/utils'
import { MoreHorizontal, PackagePlus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { SignersActions } from '../_components/signers-actions'
import { Keypair } from '@stellar/stellar-sdk'
import { api } from '~/trpc/react'
import toast from 'react-hot-toast'
import { AssembledTransaction } from '@stellar/stellar-sdk/contract'
import { env } from '~/env'
import { useSep10 } from '~/hooks/useSep10'
import { loadStripeOnramp } from '@stripe/crypto';
import { OnrampElement } from '~/app/_components/stripe-onramp'
import { CryptoElements } from '~/app/_components/stripe-onramp'
import axios from 'axios'


export default function PasskeyCreation() {
  const [status, setStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [accountDetails, setAccountDetails] = useState<{ username: string; userId: string } | null>(null)
  const { create, getWalletSigners, signXDR, addSubWallet, transfer, subWallets, fundWallet, keyId, balance, contractId, addSigner_Ed25519, loading, signers, isFunding } = useSmartWallet();

  const [isTransfering, setIsTransfering] = useState(false);

  const { getAuthChallenge, submitAuthChallenge } = useSep10();

  const [onrampSession, setOnrampSession] = useState<any | null>(null);

  const getSep10AuthToken = async (publicKey: string) => {
    try {
      const challenge = await getAuthChallenge({ publicKey });
      console.log('challenge:', challenge, publicKey, account.wallet?.options, account.wallet?.spec);
      const signedTx = await signXDR(challenge.transaction, 'Ed25519', publicKey);
      console.log('signedTx for challenge:', signedTx, typeof signedTx);
      const authToken = await submitAuthChallenge({ xdr: typeof signedTx === 'string' ? signedTx : signedTx.toXDR() });
      console.log('authToken:', authToken);
    } catch (error) {
      console.error('Error getting Sep10 auth token:', error);
    }
  }


  useEffect(() => {
    console.log('subWallets:', subWallets);
    console.log('signers:', signers);
  }, [subWallets, signers]);

  const handleTransfer = async ({ keypair, to, amount }: { keyId?: string, keypair?: Keypair, to: string, amount: number }) => {
    setIsTransfering(true);
    await transfer({ keypair, to, amount, keyId });
    setIsTransfering(false);
  }

  const createOnrampSession = async () => {
    try {
      const response = await axios.post(
        'https://api.stripe.com/v1/crypto/onramp_sessions',
        {
          "wallet_addresses[stellar]": 'GBLNWW53NIUIN57Y6OI5CKQXB7CODQWQ7ZSZGMQTNGHWMLXGPR3CS3NG',
          destination_networks: ['stellar'],
          destination_network: 'stellar',
          destination_currency: 'usdc',
        }, // Add any necessary body parameters here
        {
          headers: {
            'Authorization': `Bearer sk_test_51QFHr3FzCRmvgWLQZHMGcRnI9ntVy8R77M8z5OQAwbhNZRBsjcJ99jWeIH0xj4eAKQuRB3COKMfwDqVl220KgJMu00RrmQMoFR`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      console.log('Stripe Onramp Response:', response.data);
      setOnrampSession(response.data.client_secret);
      return response.data;
    } catch (error) {
      console.error('Error:', error.response ? error.response.data : error.message);
    }
  };


  const stripeOnrampPromise = loadStripeOnramp(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);


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
    const { keypair } = await addSigner_Ed25519();
    if (keypair) {
      console.log("Signer added:", keypair.publicKey());
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
    <Card className="w-[400px]">
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
            {signers.map(({ key, kind }) => (
              <div className="bg-gray-100 mt-1 pl-1 rounded-md flex justify-between gap-0 items-center border-[1px] border-gray-300" key={key}>
                <div className="flex w-full items-center gap-2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-gray-800" variant={"outline"}>{kind}</Badge>
                  <p onClick={() => { copyToClipboard(key) }}>{shortAddress(key)}</p>
                </div>
                <div className="flex items-end gap-0">
                  <SignersActions handleTransfer={handleTransfer} keyId={keyId || undefined} publicKey={key} handleSep10={getSep10AuthToken} />
                </div>
              </div>
            ))}
            { /** Sub Wallets */}
            {subWallets && Array.from(subWallets).map(([key, [secret, interval, amount]]) => (
              <div className="bg-gray-100 mt-1 pl-1 rounded-md flex justify-between gap-0 items-center border-[1px] border-gray-300" key={key}>
                <div className="flex w-full items-center gap-2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-gray-800" variant={"outline"}>Policy signer</Badge>
                  <p onClick={() => { copyToClipboard(key) }}>{shortAddress(key)}</p>
                  <p>{amount}</p>
                </div>
                <div className="flex items-end gap-0">
                  <SignersActions handleTransfer={handleTransfer} secret={secret} />
                </div>
              </div>
            ))}
            {/** Actions */}
            <div className="flex justify-center mt-4 gap-2">
              {contractId && <Button onClick={() => { fundWallet(contractId!) }}>{isFunding ? "Funding..." : "Fund Wallet"}</Button>}
              <Button onClick={handleAddSigner}>{loading ? "Adding..." : "Add Signer"}</Button>
              <Button onClick={handleAddSubWallet}>{loading ? "Adding..." : "Add Sub wallet"}</Button>
              <Button onClick={createOnrampSession}>Create Onramp Session</Button>
            </div>
            {onrampSession && (
              <CryptoElements stripeOnramp={stripeOnrampPromise}>
                <OnrampElement clientSecret={onrampSession} appearance={{}} />
              </CryptoElements>
            )}
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

