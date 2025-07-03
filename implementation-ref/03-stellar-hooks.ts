/**
 * STELLAR HOOKS PATTERN - REFERENCE IMPLEMENTATION
 * 
 * This file demonstrates the hook pattern used in Freelii for accessing
 * network-aware Stellar clients. These hooks automatically update when
 * the network changes, ensuring your components always use the correct
 * configuration.
 * 
 * Key Features:
 * - Network-aware client access
 * - Automatic updates when network changes
 * - Memoization for performance
 * - Convenience hooks for specific clients
 * - Type safety with TypeScript
 */

'use client';

import { useStellar } from './01-stellar-context';
import { createStellarClients, type StellarClients } from './02-stellar-clients-factory';
import { useMemo } from 'react';

/**
 * Main hook for accessing all Stellar clients
 * 
 * This hook automatically creates clients based on the current network
 * configuration and memoizes them to prevent unnecessary re-creation.
 * 
 * @returns Object containing all clients, network info, and config
 */
export const useStellarClients = () => {
  const { config, network } = useStellar();

  // Memoize clients to prevent recreation on every render
  // Only recreate when config changes (i.e., when network switches)
  const clients = useMemo(() => {
    return createStellarClients(config);
  }, [config]);

  return {
    ...clients,  // All client objects from the factory
    network,     // Current network ('testnet' | 'mainnet')
    config,      // Current network configuration
  };
};

/**
 * Convenience hook for accessing just the RPC client
 * 
 * Usage:
 * ```tsx
 * const rpc = useStellarRpc();
 * const accountInfo = await rpc.getAccount(publicKey);
 * ```
 */
export const useStellarRpc = () => {
  const { rpc } = useStellarClients();
  return rpc;
};

/**
 * Convenience hook for accessing just the PasskeyKit account client
 * 
 * Usage:
 * ```tsx
 * const account = useStellarAccount();
 * const wallet = await account.createWallet('MyApp', 'MyWallet');
 * ```
 */
export const useStellarAccount = () => {
  const { account } = useStellarClients();
  return account;
};

/**
 * Convenience hook for accessing just the PasskeyServer
 * 
 * Usage:
 * ```tsx
 * const server = useStellarServer();
 * const result = await server.send(signedTransaction);
 * ```
 */
export const useStellarServer = () => {
  const { server } = useStellarClients();
  return server;
};

/**
 * Convenience hook for accessing native XLM SAC client
 * 
 * Usage:
 * ```tsx
 * const native = useStellarNative();
 * const transfer = await native.transfer({
 *   from: senderAddress,
 *   to: recipientAddress,
 *   amount: BigInt(1000000) // 0.1 XLM in stroops
 * });
 * ```
 */
export const useStellarNative = () => {
  const { native } = useStellarClients();
  return native;
};

/**
 * Convenience hook for accessing main balance SAC client
 * (This could be USDC, XLM, or another token depending on your config)
 * 
 * Usage:
 * ```tsx
 * const mainBalance = useStellarMainBalance();
 * const balance = await mainBalance.balance(walletAddress);
 * ```
 */
export const useStellarMainBalance = () => {
  const { mainBalance } = useStellarClients();
  return mainBalance;
};

/**
 * Hook for accessing funding utilities (testnet only)
 * 
 * Usage:
 * ```tsx
 * const { getFundPubkey, getFundSigner } = useStellarFunding();
 * 
 * // Fund a wallet on testnet
 * const fundPubkey = await getFundPubkey();
 * const fundSigner = await getFundSigner();
 * ```
 */
export const useStellarFunding = () => {
  const { getFundPubkey, getFundSigner, fundKeypair } = useStellarClients();
  return { getFundPubkey, getFundSigner, fundKeypair };
};

/**
 * Hook that provides network-aware configuration
 * 
 * This is useful when you need to access configuration values
 * without creating the full client objects.
 * 
 * Usage:
 * ```tsx
 * const { rpcUrl, networkPassphrase, isTestnet } = useStellarConfig();
 * ```
 */
export const useStellarConfig = () => {
  const { config, network } = useStellar();
  
  return {
    ...config,
    isTestnet: network === 'testnet',
    isMainnet: network === 'mainnet',
  };
};

/**
 * Type exports for better TypeScript support
 */
export type { StellarClients };

/**
 * Usage Examples:
 * 
 * 1. Basic usage in a component:
 * ```tsx
 * import { useStellarClients } from './stellar-hooks';
 * 
 * function WalletComponent() {
 *   const { account, server, network } = useStellarClients();
 *   
 *   const createWallet = async (alias: string) => {
 *     const result = await account.createWallet('MyApp', alias);
 *     await server.send(result.signedTx);
 *   };
 *   
 *   return (
 *     <div>
 *       <p>Current network: {network}</p>
 *       <button onClick={() => createWallet('MyWallet')}>
 *         Create Wallet
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * 2. Using convenience hooks:
 * ```tsx
 * import { useStellarAccount, useStellarServer } from './stellar-hooks';
 * 
 * function SimpleWalletComponent() {
 *   const account = useStellarAccount();
 *   const server = useStellarServer();
 *   
 *   // Same functionality as above, but more focused imports
 * }
 * ```
 * 
 * 3. Network-aware operations:
 * ```tsx
 * import { useStellarConfig, useStellarNative } from './stellar-hooks';
 * 
 * function TransferComponent() {
 *   const { isTestnet } = useStellarConfig();
 *   const native = useStellarNative();
 *   
 *   if (isTestnet) {
 *     // Show testnet warning or different UI
 *   }
 *   
 *   // Perform transfer using the correct network's native client
 * }
 * ```
 */