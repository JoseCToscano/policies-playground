'use client'

import { useState } from 'react'
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"

export default function PasskeyCreation() {
  const [status, setStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const createPasskey = async () => {
    setStatus('creating')
    setErrorMessage(null)

    try {
      // Generate a random user ID and username
      const userId = crypto.randomUUID()
      const username = `user_${Math.floor(Math.random() * 1000000)}`

      // Create PublicKeyCredentialCreationOptions
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: new Uint8Array(32),
        rp: {
          name: "Example Corp",
          id: window.location.hostname,
        },
        user: {
          id: Uint8Array.from(userId, c => c.charCodeAt(0)),
          name: username,
          displayName: username,
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          requireResidentKey: true,
        },
        timeout: 60000,
        attestation: "direct"
      }

      // Create the passkey
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      })

      if (credential) {
        setStatus('success')
        // Here you would typically send the credential to your server
        console.log('Passkey created successfully:', credential)
      } else {
        throw new Error('Failed to create passkey')
      }
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred')
    }
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Create a Smart Wallet</CardTitle>
        <CardDescription>Built on Stellar's passkey technology.</CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'idle' && (
          <Button onClick={createPasskey} className="w-full">
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
          <div className="text-center text-green-600">
            <p>Passkey created successfully!</p>
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

