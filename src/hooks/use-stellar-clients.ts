'use client';

import { useStellar } from '~/contexts/stellar-context';
import { createStellarClients, type StellarClients } from '~/lib/stellar-clients-factory';
import { useMemo } from 'react';

/**
 * Main hook for accessing all Stellar clients
 * Automatically creates clients based on current network configuration
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
 */
export const useStellarRpc = () => {
  const { rpc } = useStellarClients();
  return rpc;
};

/**
 * Convenience hook for accessing just the PasskeyKit account client
 */
export const useStellarAccount = () => {
  const { account } = useStellarClients();
  return account;
};

/**
 * Convenience hook for accessing just the PasskeyServer
 */
export const useStellarServer = () => {
  const { server } = useStellarClients();
  return server;
};

/**
 * Convenience hook for accessing native XLM SAC client
 */
export const useStellarNative = () => {
  const { native } = useStellarClients();
  return native;
};

/**
 * Hook for accessing funding utilities (testnet only)
 */
export const useStellarFunding = () => {
  const { getFundPubkey, getFundSigner, fundKeypair } = useStellarClients();
  return { getFundPubkey, getFundSigner, fundKeypair };
};

/**
 * Hook that provides network-aware configuration
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