/**
 * STELLAR CLIENTS FACTORY PATTERN - REFERENCE IMPLEMENTATION
 * 
 * This file demonstrates how to create Stellar SDK clients dynamically
 * based on network configuration using the passkey-kit package.
 * 
 * Key Features:
 * - Factory function that creates all necessary Stellar clients
 * - PasskeyKit integration for smart wallet functionality
 * - PasskeyServer for transaction submission and Mercury integration
 * - SAC (Stellar Asset Contract) clients for token operations
 * - Funding utilities for testnet development
 */

import type { StellarNetworkConfig } from './01-stellar-context';
import { Account, Keypair, StrKey } from '@stellar/stellar-sdk/minimal';
import { basicNodeSigner } from '@stellar/stellar-sdk/minimal/contract';
import { Server } from '@stellar/stellar-sdk/minimal/rpc';
import { PasskeyKit, PasskeyServer, SACClient } from 'passkey-kit';

/**
 * Factory function to create Stellar clients based on network configuration
 * 
 * This approach allows you to dynamically create clients that are properly
 * configured for the current network (testnet vs mainnet).
 * 
 * @param config Network-specific configuration
 * @returns Object containing all Stellar SDK clients and utilities
 */
export const createStellarClients = (config: StellarNetworkConfig) => {
  // Create RPC client for Soroban interactions
  const rpc = new Server(config.rpcUrl);

  // Create PasskeyKit client for smart wallet operations
  const account = new PasskeyKit({
    rpcUrl: config.rpcUrl,
    networkPassphrase: config.networkPassphrase,
    walletWasmHash: config.walletWasmHash,
  });

  // Create PasskeyServer for transaction submission and Mercury integration
  const server = new PasskeyServer({
    rpcUrl: config.rpcUrl,
    launchtubeUrl: config.launchtubeUrl,
    launchtubeJwt: config.launchtubeJwt,
    mercuryProjectName: config.mercuryProjectName,
    mercuryUrl: config.mercuryUrl,
    mercuryJwt: config.mercuryJwt,
  });

  // Mock account for transactions that don't require a real source account
  const mockPubkey = StrKey.encodeEd25519PublicKey(Buffer.alloc(32));
  const mockSource = new Account(mockPubkey, '0');

  /**
   * Funding utilities for testnet development
   * 
   * These functions create deterministic keypairs based on the current hour
   * to provide consistent funding sources for testing.
   * 
   * IMPORTANT: Only use these for testnet! Never use deterministic keypairs in production.
   */
  const fundKeypair = async () => {
    const now = new Date();
    now.setMinutes(0, 0, 0); // Round to current hour

    const nowData = new TextEncoder().encode(now.getTime().toString());
    const hashBuffer = await crypto.subtle.digest('SHA-256', nowData);
    const keypair = Keypair.fromRawEd25519Seed(Buffer.from(hashBuffer));
    const publicKey = keypair.publicKey();

    // Try to fund the keypair if it doesn't exist
    rpc.getAccount(publicKey)
      .catch(() => rpc.requestAirdrop(publicKey))
      .catch(() => {
        console.log('Airdrop failed');
      }); // Ignore airdrop failures

    return keypair;
  };

  const getFundPubkey = async () => (await fundKeypair()).publicKey();
  const getFundSigner = async () => basicNodeSigner(await fundKeypair(), config.networkPassphrase);

  // Create SAC (Stellar Asset Contract) client for token operations
  const sac = new SACClient({
    rpcUrl: config.rpcUrl,
    networkPassphrase: config.networkPassphrase,
  });

  // Get SAC client for native XLM operations
  const native = sac.getSACClient(config.nativeContractId);

  // Get SAC client for main balance token (could be USDC, XLM, or other)
  const mainBalance = sac.getSACClient(config.mainBalance);

  return {
    // Core clients
    rpc,
    account,
    server,

    // Utilities
    mockPubkey,
    mockSource,

    // Funding utilities (testnet only)
    fundKeypair,
    getFundPubkey,
    getFundSigner,

    // Token clients
    native,
    mainBalance,
  };
};

/**
 * Type for the return value of createStellarClients
 * Useful for TypeScript inference in other parts of your application
 */
export type StellarClients = ReturnType<typeof createStellarClients>;

/**
 * Usage Example:
 * 
 * ```typescript
 * import { createStellarClients } from './stellar-clients-factory';
 * import { useStellar } from './stellar-context';
 * 
 * function MyComponent() {
 *   const { config } = useStellar();
 *   const clients = createStellarClients(config);
 *   
 *   // Use clients.account for wallet operations
 *   // Use clients.server for transaction submission
 *   // Use clients.native for XLM transfers
 *   // Use clients.mainBalance for token transfers
 * }
 * ```
 * 
 * Migration Notes:
 * - This replaces any static client exports you might have had
 * - All clients are now created dynamically based on network config
 * - No backward compatibility exports - use the factory function or hooks
 */