'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '~/components/ui/badge'
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { useSmartWallet } from '~/hooks/useSmartWallet'
import { account, copyToClipboard, fromStroops, shortAddress } from '~/lib/utils'
import { Copy, DollarSign, Euro, Plus, Settings, Shield } from "lucide-react"
import { api } from '~/trpc/react'
import { cn } from '~/lib/utils'

const USDC = "USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const EURC = "EURC-GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO";

const PolicyCard = ({ title, description, active = false, onClick }: { title: string, description: string, active?: boolean, onClick?: () => void }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="cursor-pointer"
    onClick={onClick}
  >
    <Card className={cn("relative overflow-hidden", active && "border-primary")}>
      {active && (
        <div className="absolute top-0 right-0 p-2">
          <Badge variant="default">Active</Badge>
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  </motion.div>
)

export default function PolicyBuilder() {
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null)
  const { create, connect, contractId, keyId } = useSmartWallet();

  const { data: contractBalance } = api.stellar.getContractBalance.useQuery({ contractAddress: contractId! }, {
    enabled: !!contractId
  });

  const policies = [
    {
      id: 'time-based',
      title: 'Time-Based Limits',
      description: 'Set spending limits based on time intervals (daily, weekly, monthly)',
    },
    {
      id: 'amount-based',
      title: 'Amount-Based Limits',
      description: 'Set maximum transaction amounts for each payment',
    },
    {
      id: 'domain-based',
      title: 'Domain Restrictions',
      description: 'Limit transactions to specific domains or merchants',
    },
    {
      id: 'multi-sig',
      title: 'Multi-Signature',
      description: 'Require multiple approvals for transactions',
    },
  ]

  return (
    <div className="min-h-screen relative bg-background overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent backdrop-blur-[2px]" />

      {/* Gradient Orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[100px] animate-pulse mix-blend-soft-light" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px] animate-pulse mix-blend-soft-light"
        style={{ animationDelay: '-2s' }}
      />

      <div className="container mx-auto p-8 relative">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Policy Builder
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage smart wallet policies with granular control
          </p>
        </motion.div>

        {/* Wallet Connection Section */}
        {!contractId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-4 mb-12"
          >
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
                <CardDescription>Create or connect your smart wallet to start building policies</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Button onClick={() => create()} className="w-full">
                  <Shield className="w-4 h-4 mr-2" />
                  Create Smart Wallet
                </Button>
                {keyId && (
                  <Button onClick={() => connect(keyId)} variant="outline" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Connect Existing Wallet
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Connected Wallet Info */}
        {contractId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid gap-6 md:grid-cols-[300px_1fr] mb-12"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                  Smart Wallet
                  <Badge className='bg-gradient-to-r from-[#4ab3e8] to-[#0081c6] text-background'>
                    {shortAddress(contractId)}
                    <Button
                      onClick={() => copyToClipboard(contractId)}
                      variant="ghost"
                      className="ml-2 p-0 h-4 hover:bg-transparent"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-xl font-bold">
                    <DollarSign className="w-5 h-5 mr-2" />
                    <span>{fromStroops(contractBalance?.[USDC] ?? "0", 2)} USD</span>
                  </div>
                  <div className="flex items-center text-lg font-bold">
                    <Euro className="w-5 h-5 mr-2" />
                    <span>{fromStroops(contractBalance?.[EURC] ?? "0", 2)} EUR</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Policy Grid */}
        {contractId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {policies.map((policy) => (
                <PolicyCard
                  key={policy.id}
                  title={policy.title}
                  description={policy.description}
                  active={selectedPolicy === policy.id}
                  onClick={() => setSelectedPolicy(policy.id)}
                />
              ))}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer"
              >
                <Card className="border-dashed flex items-center justify-center h-full">
                  <CardContent className="flex flex-col items-center py-6">
                    <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Create Custom Policy</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

