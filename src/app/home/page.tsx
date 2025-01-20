'use client'

import { useEffect, useState } from 'react'
import { Badge } from '~/components/ui/badge'
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { useSmartWallet } from '~/hooks/useSmartWallet'
import { account, copyToClipboard, fromStroops, shortAddress } from '~/lib/utils'
import { Copy, DollarSign, Euro, ScanFaceIcon } from "lucide-react"
import { SignersActions } from '../_components/signers-actions'
import { Keypair } from '@stellar/stellar-sdk'
import { env } from '~/env'
import { useSep10 } from '~/hooks/useSep10'
import { loadStripeOnramp } from '@stripe/crypto';
import { OnrampElement } from '~/app/_components/stripe-onramp'
import { CryptoElements } from '~/app/_components/stripe-onramp'
import axios from 'axios'
import { RecentTransactions } from "~/components/recent-transactions";
import { EmployeeSubaccountList } from "~/components/employee-subaccount-list";
import { AccountSwitcher } from '~/app/_components/account-switcher'
import { api } from '~/trpc/react'

const USDC = "USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const EURC = "EURC-GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO";

export default function PasskeyCreation() {
  const [status, setStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { create, connect, getWalletSigners, signXDR, addSubWallet, transfer, subWallets, removeSubWallet, fundWallet, keyId, balance, contractId, addSigner_Ed25519, loading, signers, isFunding, getWalletBalance, } = useSmartWallet();

  const [isTransfering, setIsTransfering] = useState(false);

  const { getAuthChallenge, submitAuthChallenge } = useSep10();

  const { data: contractBalance } = api.stellar.getContractBalance.useQuery({ contractAddress: contractId! }, {
    enabled: !!contractId
  });

  useEffect(() => {
    console.log('balance changed, Page', balance);
  }, [balance]);

  useEffect(() => {
    console.log('contractBalance changed, Page', contractBalance);
  }, [contractBalance]);

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

  return (
    <div className="space-y-6 w-full h-full p-12 pt-0">
      <AccountSwitcher />
      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <div className="space-y-6">
          <Card className="bg-card text-card-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Company Balance</CardTitle>

            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-xl font-bold text-primary">
                  <DollarSign className="w-5 h-5 mr-2" />
                  <span>{fromStroops(contractBalance?.[USDC] ?? "0", 2)} USD</span>
                </div>
                <div className="flex items-center text-lg font-bold text-primary">
                  <Euro className="w-5 h-5 mr-2" />
                  <span>{fromStroops(contractBalance?.[EURC] ?? "0", 2)} EUR</span>
                </div>
                <div className="flex items-center text-md font-semibold text-muted-foreground">
                  <span>{fromStroops(balance)} XLM</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>

            <CardHeader>
              <CardTitle className='flex items-center justify-between text-sm font-medium'>
                {contractId ? "Smart Wallet Address" : "Connect device"}
                {contractId && (<div><Badge className='bg-gradient-to-r from-[#4ab3e8] to-[#0081c6] text-gray-800' variant={"outline"}>
                  {shortAddress(contractId)}
                </Badge>
                  <Button
                    onClick={() => copyToClipboard(contractId)}
                    variant="ghost" className="p-0 rounded-full hover:scale-105 transition-all duration-100">
                    <Copy className="h-2 w-2 text-primary" />
                  </Button>
                </div>)

                }
              </CardTitle>
              {!contractId && keyId && <Button onClick={() => connect(keyId!)} className='text-sm bg-gradient-to-r from-black to-gray-800 text-white'>
                <ScanFaceIcon className='w-4 h-4 mr-2' />
                Connect
              </Button>}
              {!contractId && <Button onClick={() => create()} className='text-sm bg-gradient-to-r from-black to-gray-800 text-white'>
                <ScanFaceIcon className='w-4 h-4 mr-2' />
                Create Smart Wallet
              </Button>}
            </CardHeader>
          </Card>
          <RecentTransactions />
        </div>
        <EmployeeSubaccountList />
        <div className='flex flex-col gap-2'>
          {contractId && <Button onClick={() => { fundWallet(contractId!) }}>{isFunding ? "Funding..." : "Fund Wallet"}</Button>}
        </div>
      </div>
    </div>
  )
}

